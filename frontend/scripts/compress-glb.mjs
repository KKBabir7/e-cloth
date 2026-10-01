/**
 * Compress public/*.glb for web: strip unused textures, simplify mesh, Draco.
 * Target: < 1 MB each. Backups: public/_glb_backup/
 *
 * Usage: node scripts/compress-glb.mjs [file.glb ...]
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  prune,
  weld,
  simplify,
  resample,
  textureCompress,
  draco,
} from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const backupDir = path.join(publicDir, '_glb_backup');

const DEFAULT_FILES = ['shirt_baked.glb', 'polov1.glb', 'dropsholder.glb'];
const FILES = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_FILES;
const TARGET_BYTES = 1 * 1024 * 1024; // 1 MB

async function createIO() {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });
  return io;
}

function mb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

async function compressOne(io, filename) {
  const src = path.join(publicDir, filename);
  const out = path.join(publicDir, filename);
  const backup = path.join(backupDir, filename);

  if (!fs.existsSync(src)) {
    console.warn(`Skip missing: ${filename}`);
    return;
  }

  if (!fs.existsSync(backup)) {
    fs.mkdirSync(backupDir, { recursive: true });
    fs.copyFileSync(src, backup);
  }

  // Prefer compressing from backup so re-runs stay high quality
  const inputPath = fs.existsSync(backup) ? backup : src;
  const before = fs.statSync(inputPath).size;
  console.log(`\n→ ${filename}  in ${mb(before)} MB`);

  let document = await io.read(inputPath);

  // Viewer replaces materials with solid color — drop embedded maps
  for (const texture of document.getRoot().listTextures()) {
    texture.dispose();
  }
  for (const material of document.getRoot().listMaterials()) {
    material.setBaseColorTexture(null);
    material.setMetallicRoughnessTexture(null);
    material.setNormalTexture(null);
    material.setOcclusionTexture(null);
    material.setEmissiveTexture(null);
  }

  await document.transform(
    dedup(),
    weld({ tolerance: 0.0001 }),
    simplify({
      simplifier: MeshoptSimplifier,
      // Keep enough detail so torso curves stay smooth (still << 1MB with Draco)
      ratio: 0.40,
      error: 0.0005,
    }),
    resample(),
    prune()
  );

  // Draco geometry compression
  await document.transform(
    draco({
      method: 'edgebreaker',
      encodeSpeed: 5,
      decodeSpeed: 5,
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 12,
    })
  );

  await io.write(out, document);
  let after = fs.statSync(out).size;
  console.log(`  after Draco: ${mb(after)} MB`);

  // If still over 1MB, simplify harder from backup
  if (after > TARGET_BYTES) {
    console.log('  still >1MB — stronger simplify…');
    document = await io.read(inputPath);
    for (const texture of document.getRoot().listTextures()) texture.dispose();
    for (const material of document.getRoot().listMaterials()) {
      material.setBaseColorTexture(null);
      material.setMetallicRoughnessTexture(null);
      material.setNormalTexture(null);
      material.setOcclusionTexture(null);
      material.setEmissiveTexture(null);
    }
    await document.transform(
      dedup(),
      weld({ tolerance: 0.0001 }),
      simplify({
        simplifier: MeshoptSimplifier,
        ratio: 0.22,
        error: 0.001,
      }),
      prune(),
      draco({
        method: 'edgebreaker',
        encodeSpeed: 5,
        decodeSpeed: 5,
        quantizePosition: 12,
        quantizeNormal: 8,
      })
    );
    await io.write(out, document);
    after = fs.statSync(out).size;
    console.log(`  after stronger pass: ${mb(after)} MB`);
  }

  console.log(
    after <= TARGET_BYTES
      ? `  ✓ under 1 MB (${mb(after)} MB)`
      : `  ⚠ still ${mb(after)} MB — check output quality`
  );
}

async function main() {
  await MeshoptSimplifier.ready;
  const io = await createIO();
  for (const f of FILES) {
    await compressOne(io, f);
  }
  console.log('\nDone. Originals in public/_glb_backup/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
