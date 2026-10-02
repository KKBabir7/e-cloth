'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Spinner } from 'react-bootstrap';

export default function Tshirt3DViewer({ tshirtColor, tshirtView, frontFabricCanvas, backFabricCanvas, visible = true, interactive = true, hideDecals = false, cameraZOffset = 0.95, enableZoom = true, garmentType = 'tshirt', viewPadding = 0 }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Refs for camera animation and controls
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  // Refs for Three.js objects
  const modelGroupRef = useRef(null);
  const shirtMeshRef = useRef(null);
  const printUniformsRef = useRef(null);
  const isFallbackRef = useRef(false);
  const garmentTypeRef = useRef(garmentType);
  const ThreeModuleRef = useRef(null);
  const targetCameraXRef = useRef(0);
  const targetCameraYRef = useRef(0.05);
  const targetCameraZRef = useRef(tshirtView === 'front' ? cameraZOffset : -cameraZOffset);
  const isAnimatingCameraRef = useRef(false);

  // viewPadding = extra container height above AND below the calibrated area, as a
  // fraction of it. Widening the FOV by the same ratio keeps the shirt's on-screen size.
  const BASE_FOV = 40;
  const getFov = (padding) =>
    (2 * Math.atan(Math.tan((BASE_FOV * Math.PI) / 360) * (1 + 2 * padding)) * 180) / Math.PI;
  const viewPaddingRef = useRef(viewPadding);

  useEffect(() => {
    viewPaddingRef.current = viewPadding;
    const camera = cameraRef.current;
    if (!camera) return;
    camera.fov = getFov(viewPadding);
    camera.updateProjectionMatrix();
  }, [viewPadding]);

  const hideDecalsRef = useRef(hideDecals);

  useEffect(() => {
    hideDecalsRef.current = hideDecals;
  }, [hideDecals]);

  useEffect(() => {
    garmentTypeRef.current = garmentType;
  }, [garmentType]);

  // Fabric lower canvas has the real design pixels (getElement = upper/controls)
  const getFabricCanvasEl = (fabricCanvas) => {
    if (!fabricCanvas) return null;
    return fabricCanvas.lowerCanvasEl || fabricCanvas.getElement?.() || null;
  };

  // GPU texture storage is fixed-size: when the Fabric canvas is resized
  // (stage zoom), drop the old storage so it is re-allocated at the new size.
  const refreshCanvasTexture = (texture) => {
    if (!texture || !texture.image) return;
    const { width, height } = texture.image;
    if (texture.userData.width !== width || texture.userData.height !== height) {
      if (texture.userData.width !== undefined) texture.dispose();
      texture.userData.width = width;
      texture.userData.height = height;
    }
    texture.needsUpdate = true;
  };

  // The print is drawn by the shirt's own shader: one surface, so it can't
  // z-fight, float, or show through to the other side, and it stays put while orbiting.
  const patchShirtMaterial = (material, uniforms) => {
    if (material.userData.printPatched) return;
    material.userData.printPatched = true;
    material.customProgramCacheKey = () => 'shirt-print';
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform mat4 uMeshToGroup;
          varying vec3 vPrintPos;`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vPrintPos = (uMeshToGroup * vec4(transformed, 1.0)).xyz;`
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform sampler2D uPrintFront;
          uniform sampler2D uPrintBack;
          uniform vec2 uPrintCenter;
          uniform vec2 uPrintSize;
          uniform float uShowPrint;
          varying vec3 vPrintPos;
          vec3 printSrgbToLinear(vec3 c) {
            return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
          }`
        )
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
          vec2 printUv = (vPrintPos.xy - uPrintCenter) / uPrintSize + 0.5;
          // Sample unconditionally: texture lookups inside branches break mip derivatives
          vec4 frontPrint = texture2D(uPrintFront, printUv);
          vec4 backPrint = texture2D(uPrintBack, vec2(1.0 - printUv.x, printUv.y));
          float inPrintBox = step(0.0, printUv.x) * step(printUv.x, 1.0)
                           * step(0.0, printUv.y) * step(printUv.y, 1.0);
          // Texture is premultiplied sRGB: un-premultiply before decoding, or edges go dark
          vec4 printTex = vPrintPos.z >= 0.0 ? frontPrint : backPrint;
          float printAlpha = printTex.a * inPrintBox * uShowPrint;
          vec3 printRgb = printSrgbToLinear(min(printTex.rgb / max(printTex.a, 0.0001), vec3(1.0)));`
        )
        .replace(
          '#include <opaque_fragment>',
          `// Print stays unlit so it shows the exact 2D editor color
          outgoingLight = mix(outgoingLight, printRgb, printAlpha);
          #include <opaque_fragment>`
        );
    };
    material.needsUpdate = true;
  };

  const applyShirtPrint = () => {
    const THREE = ThreeModuleRef.current;
    const mesh = shirtMeshRef.current;
    const modelGroup = modelGroupRef.current;
    if (!THREE || !mesh || !modelGroup || !mesh.material) return;

    if (!printUniformsRef.current) {
      printUniformsRef.current = {
        uPrintFront: { value: null },
        uPrintBack: { value: null },
        uMeshToGroup: { value: new THREE.Matrix4() },
        uPrintCenter: { value: new THREE.Vector2() },
        uPrintSize: { value: new THREE.Vector2(1, 1) },
        uShowPrint: { value: 0 }
      };
    }
    const uniforms = printUniformsRef.current;

    // Print area in model-group space, matching the 240×440 editor overlay
    const isFallback = isFallbackRef.current;
    const isPolo = garmentTypeRef.current === 'polo';
    const printW = isFallback ? 0.24 : isPolo ? 0.26 : 0.28;
    const printH = isFallback ? 0.44 : isPolo ? 0.48 : 0.51;
    const printY = isPolo ? 0.0 : -0.01;

    modelGroup.updateMatrixWorld(true);
    uniforms.uMeshToGroup.value
      .copy(modelGroup.matrixWorld)
      .invert()
      .multiply(mesh.matrixWorld);
    uniforms.uPrintCenter.value.set(0, printY);
    uniforms.uPrintSize.value.set(printW, printH);
    uniforms.uPrintFront.value = frontTextureRef.current;
    uniforms.uPrintBack.value = backTextureRef.current;

    const hasTextures = !!(frontTextureRef.current && backTextureRef.current);
    uniforms.uShowPrint.value = hasTextures && !hideDecalsRef.current ? 1 : 0;

    patchShirtMaterial(mesh.material, uniforms);
  };

  // Keep track of the latest color without triggering scene re-renders
  const currentColorRef = useRef(tshirtColor);
  useEffect(() => {
    currentColorRef.current = tshirtColor;
  }, [tshirtColor]);

  // Refs for double-sided canvas textures
  const frontTextureRef = useRef(null);
  const backTextureRef = useRef(null);

  // 1. Scene Initialization (runs once on mount / canvas bind)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let active = true;
    let renderer, scene, camera, controls;
    let animationFrameId;
    let dracoLoader;
    let resizeObserver;

    const initThree = async () => {
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');

        if (!active) return;

        ThreeModuleRef.current = THREE;

        dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        const createGltfLoader = () => {
          const loader = new GLTFLoader();
          loader.setDRACOLoader(dracoLoader);
          return loader;
        };

        const container = containerRef.current;
        if (!container) return;

        // ── Scene Setup ──
        scene = new THREE.Scene();
        scene.background = null;

        // ── Camera ──
        camera = new THREE.PerspectiveCamera(getFov(viewPaddingRef.current), container.clientWidth / container.clientHeight, 0.1, 100);
        cameraRef.current = camera;
        camera.position.set(targetCameraXRef.current, targetCameraYRef.current, targetCameraZRef.current);

        // ── Renderer ──
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        rendererRef.current = renderer;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);

        // ── Controls ──
        controls = new OrbitControls(camera, renderer.domElement);
        controlsRef.current = controls;
        controls.enabled = !!interactive;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = enableZoom;
        controls.minDistance = 0.45;
        controls.maxDistance = 4.00;
        controls.maxPolarAngle = Math.PI - 0.1;
        controls.minPolarAngle = 0.1;

        // Cancel camera auto-animation when user manually starts dragging
        controls.addEventListener('start', () => {
          isAnimatingCameraRef.current = false;
        });

        // ── Lighting ──
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight1.position.set(2, 4, 3);
        scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight2.position.set(-2, 2, -3);
        scene.add(dirLight2);

        const pointLight = new THREE.PointLight(0xffffff, 0.35, 10);
        pointLight.position.set(0, 0.2, 1.5);
        scene.add(pointLight);

        // Model container group
        const modelGroup = new THREE.Group();
        modelGroup.position.y = 0.028; // Shift up by 20px to prevent bottom cropping
        modelGroupRef.current = modelGroup;
        scene.add(modelGroup);

        // ── CanvasTextures from Fabric LOWER canvas (actual design, not selection UI) ──
        if (frontFabricCanvas) {
          const frontEl = getFabricCanvasEl(frontFabricCanvas);
          if (frontEl) {
            const texFront = new THREE.CanvasTexture(frontEl);
            texFront.anisotropy = 8;
            texFront.colorSpace = THREE.NoColorSpace;
            texFront.flipY = true;
            texFront.premultiplyAlpha = true;
            frontTextureRef.current = texFront;

            frontFabricCanvas.on('after:render', () => refreshCanvasTexture(frontTextureRef.current));
          }
        }

        if (backFabricCanvas) {
          const backEl = getFabricCanvasEl(backFabricCanvas);
          if (backEl) {
            const texBack = new THREE.CanvasTexture(backEl);
            texBack.anisotropy = 8;
            texBack.colorSpace = THREE.NoColorSpace;
            texBack.flipY = true;
            texBack.premultiplyAlpha = true;
            backTextureRef.current = texBack;

            backFabricCanvas.on('after:render', () => refreshCanvasTexture(backTextureRef.current));
          }
        }

        // ── Fallback Extruded 3D T-shirt (Procedural Shape) ──
        const loadProceduralShirt = () => {
          isFallbackRef.current = true;
          const baseMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(currentColorRef.current),
            roughness: 0.8,
            metalness: 0.1
          });

          // T-Shirt 2D Silhouette shape
          const shape = new THREE.Shape();
          shape.moveTo(-0.19, -0.32); // bottom left
          shape.lineTo(0.19, -0.32);  // bottom right
          shape.lineTo(0.19, 0.02);   // armpit right
          shape.lineTo(0.36, -0.08);  // sleeve bottom right
          shape.lineTo(0.42, 0.04);   // sleeve end right
          shape.lineTo(0.22, 0.22);   // shoulder right
          shape.lineTo(0.09, 0.22);   // neck right
          // neck cutout
          shape.quadraticCurveTo(0, 0.12, -0.09, 0.22);
          shape.lineTo(-0.22, 0.22);  // shoulder left
          shape.lineTo(-0.42, 0.04);  // sleeve end left
          shape.lineTo(-0.36, -0.08); // sleeve bottom left
          shape.lineTo(-0.19, 0.02);  // armpit left
          shape.closePath();

          const extrudeSettings = {
            depth: 0.055,
            bevelEnabled: true,
            bevelSegments: 6,
            steps: 1,
            bevelSize: 0.015,
            bevelThickness: 0.015
          };

          const torsoGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          torsoGeo.center();

          const torso = new THREE.Mesh(torsoGeo, baseMaterial);
          torso.castShadow = true;
          torso.receiveShadow = true;
          modelGroup.add(torso);

          // collar ring
          const collarGeo = new THREE.TorusGeometry(0.088, 0.011, 8, 32);
          const collar = new THREE.Mesh(collarGeo, baseMaterial);
          collar.position.set(0, 0.20, 0.025);
          collar.rotation.x = Math.PI / 2.1;
          modelGroup.add(collar);

          // neck label tag on back side
          const tagGeo = new THREE.BoxGeometry(0.04, 0.03, 0.005);
          const tagMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
          const tag = new THREE.Mesh(tagGeo, tagMat);
          tag.position.set(0, 0.19, -0.026);
          modelGroup.add(tag);

          shirtMeshRef.current = torso;
          applyShirtPrint();
          setLoading(false);
        };

        // ── Procedural 3D Polo T-Shirt ──
        const loadProceduralPolo = () => {
          isFallbackRef.current = true;

          const baseMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(currentColorRef.current),
            roughness: 0.78, metalness: 0.05
          });
          const collarMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(currentColorRef.current).multiplyScalar(0.88),
            roughness: 0.72, metalness: 0.05
          });
          const buttonMat = new THREE.MeshStandardMaterial({
            color: 0xf5f0e8, roughness: 0.35, metalness: 0.1
          });

          // ── Body shape: identical to t-shirt ──
          const bodyShape = new THREE.Shape();
          bodyShape.moveTo(-0.19, -0.32);
          bodyShape.lineTo(0.19, -0.32);
          bodyShape.lineTo(0.19, 0.02);
          bodyShape.lineTo(0.36, -0.08);
          bodyShape.lineTo(0.42, 0.04);
          bodyShape.lineTo(0.22, 0.22);
          bodyShape.lineTo(0.09, 0.22);
          bodyShape.quadraticCurveTo(0, 0.12, -0.09, 0.22);
          bodyShape.lineTo(-0.22, 0.22);
          bodyShape.lineTo(-0.42, 0.04);
          bodyShape.lineTo(-0.36, -0.08);
          bodyShape.lineTo(-0.19, 0.02);
          bodyShape.closePath();

          const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
            depth: 0.055, bevelEnabled: true,
            bevelSegments: 6, steps: 1,
            bevelSize: 0.014, bevelThickness: 0.014
          });
          bodyGeo.center();
          const torso = new THREE.Mesh(bodyGeo, baseMat);
          torso.castShadow = true;
          torso.receiveShadow = true;
          modelGroup.add(torso);

          // ── Polo collar: two flat rectangular flaps laid down on chest ──
          // They are thin boxes that lie flat at the neckline, angled slightly outward
          // Left collar wing
          const collarL = new THREE.Shape();
          collarL.moveTo(0, 0);
          collarL.lineTo(-0.115, 0);
          collarL.lineTo(-0.13, -0.065);
          collarL.lineTo(-0.01, -0.065);
          collarL.closePath();
          const collarLGeo = new THREE.ExtrudeGeometry(collarL, {
            depth: 0.011, bevelEnabled: true,
            bevelSegments: 2, bevelSize: 0.003, bevelThickness: 0.003
          });
          const collarLMesh = new THREE.Mesh(collarLGeo, collarMat);
          // Lay flat: rotate on X so it faces forward, then position at neck
          collarLMesh.rotation.x = -Math.PI / 2 + 0.18;
          collarLMesh.position.set(-0.005, 0.218, 0.024);
          collarLMesh.castShadow = true;
          modelGroup.add(collarLMesh);

          // Right collar wing (mirror)
          const collarR = new THREE.Shape();
          collarR.moveTo(0, 0);
          collarR.lineTo(0.115, 0);
          collarR.lineTo(0.13, -0.065);
          collarR.lineTo(0.01, -0.065);
          collarR.closePath();
          const collarRGeo = new THREE.ExtrudeGeometry(collarR, {
            depth: 0.011, bevelEnabled: true,
            bevelSegments: 2, bevelSize: 0.003, bevelThickness: 0.003
          });
          const collarRMesh = new THREE.Mesh(collarRGeo, collarMat);
          collarRMesh.rotation.x = -Math.PI / 2 + 0.18;
          collarRMesh.position.set(0.005, 0.218, 0.024);
          collarRMesh.castShadow = true;
          modelGroup.add(collarRMesh);

          // Collar stand: small thin box sitting upright behind the fold
          const standGeo = new THREE.BoxGeometry(0.20, 0.028, 0.010);
          const stand = new THREE.Mesh(standGeo, collarMat);
          stand.position.set(0, 0.228, 0.010);
          stand.rotation.x = 0.12;
          stand.castShadow = true;
          modelGroup.add(stand);

          // ── Placket strip ──
          const placketGeo = new THREE.BoxGeometry(0.026, 0.11, 0.007);
          const placket = new THREE.Mesh(placketGeo, collarMat);
          placket.position.set(0, 0.135, 0.031);
          placket.castShadow = true;
          modelGroup.add(placket);

          // ── 3 Buttons ──
          [0.20, 0.167, 0.134].forEach(yBtn => {
            const bGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.005, 14);
            const b = new THREE.Mesh(bGeo, buttonMat);
            b.rotation.x = Math.PI / 2;
            b.position.set(0, yBtn, 0.034);
            modelGroup.add(b);
          });

          // ── Back neck label ──
          const tagGeo = new THREE.BoxGeometry(0.036, 0.026, 0.004);
          const tagMat = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.6 });
          const tag = new THREE.Mesh(tagGeo, tagMat);
          tag.position.set(0, 0.198, -0.028);
          modelGroup.add(tag);

          shirtMeshRef.current = torso;
          applyShirtPrint();
          setLoading(false);
        };

        // ── Helper: add polo collar on top of the GLB shirt body ──
        // GLB is always normalized: 0.68 total height, centered at origin.
        // Neck top ≈ y:0.27, front face ≈ z:0.038
        const addPoloCollar = () => {
          const shirtCol = new THREE.Color(currentColorRef.current);
          const collarMat = new THREE.MeshStandardMaterial({
            color: shirtCol.clone().multiplyScalar(0.82),
            roughness: 0.70, metalness: 0.04, side: THREE.DoubleSide
          });
          const buttonMat = new THREE.MeshStandardMaterial({
            color: 0xf0ece0, roughness: 0.3, metalness: 0.08
          });

          // Known world coords after GLB normalization:
          const neckY  = 0.268;   // Y at neckline top
          const frontZ = 0.038;   // Z at shirt front surface
          const neckW  = 0.155;   // collar total width

          // ── Collar stand: thin upright band at neckline ──
          const standGeo = new THREE.BoxGeometry(neckW, 0.022, 0.007);
          const stand = new THREE.Mesh(standGeo, collarMat);
          stand.position.set(0, neckY - 0.011, frontZ - 0.003);
          stand.castShadow = true;
          modelGroup.add(stand);

          // ── Left collar flap: flat plane angled down on chest ──
          // Shape: trapezoid wider at outer edge
          const mkFlap = (side) => { // side = -1 left, +1 right
            const pts = side === -1
              ? [new THREE.Vector2(0,0), new THREE.Vector2(-neckW*0.48,0),
                 new THREE.Vector2(-neckW*0.52,-0.058), new THREE.Vector2(-0.006,-0.042)]
              : [new THREE.Vector2(0,0), new THREE.Vector2(neckW*0.48,0),
                 new THREE.Vector2(neckW*0.52,-0.058), new THREE.Vector2(0.006,-0.042)];
            const shape = new THREE.Shape(pts);
            const geo = new THREE.ShapeGeometry(shape);
            const mesh = new THREE.Mesh(geo, collarMat);
            // Rotate: lie flat on chest, tilt slightly outward
            mesh.rotation.x = -Math.PI / 2 + 0.28;
            mesh.rotation.z = side * 0.04;
            mesh.position.set(
              side * 0.003,
              neckY - 0.007,
              frontZ + 0.004
            );
            mesh.castShadow = true;
            return mesh;
          };
          modelGroup.add(mkFlap(-1));
          modelGroup.add(mkFlap(1));

          // ── Collar fold line (thin edge at top of flaps) ──
          const foldGeo = new THREE.BoxGeometry(neckW, 0.004, 0.004);
          const fold = new THREE.Mesh(foldGeo, collarMat);
          fold.position.set(0, neckY + 0.001, frontZ + 0.003);
          modelGroup.add(fold);

          // ── Placket: narrow strip down front center ──
          const placketGeo = new THREE.BoxGeometry(0.020, 0.088, 0.005);
          const placket = new THREE.Mesh(placketGeo, collarMat);
          placket.position.set(0, neckY - 0.022 - 0.044, frontZ + 0.002);
          placket.castShadow = true;
          modelGroup.add(placket);

          // ── 3 small buttons ──
          [0, 1, 2].forEach(i => {
            const btnY = neckY - 0.018 - i * 0.028;
            const btnGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 0.004, 12);
            const btn = new THREE.Mesh(btnGeo, buttonMat);
            btn.rotation.x = Math.PI / 2;
            btn.position.set(0, btnY, frontZ + 0.006);
            modelGroup.add(btn);
          });
        };


        if (garmentType === 'polo') {
          isFallbackRef.current = false;
          const loader = createGltfLoader();
          loader.load(
            '/polov1.glb',
            (gltf) => {
              if (!active) return;
              const model = gltf.scene;

              const box = new THREE.Box3().setFromObject(model);
              const center = new THREE.Vector3();
              box.getCenter(center);
              model.position.x = -center.x;
              model.position.y = -center.y;
              model.position.z = -center.z;

              const size = new THREE.Vector3();
              box.getSize(size);
              const maxDim = Math.max(size.x, size.y, size.z);
              const targetScale = 0.68 / maxDim;
              model.scale.set(targetScale, targetScale, targetScale);

              let mainMesh = null;
              let mainMeshVolume = 0;
              model.traverse((child) => {
                if (child.isMesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                  child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(currentColorRef.current),
                    roughness: 0.8,
                    metalness: 0.1
                  });

                  child.geometry.computeBoundingBox();
                  const bb = child.geometry.boundingBox;
                  if (bb) {
                    const volume =
                      (bb.max.x - bb.min.x) *
                      (bb.max.y - bb.min.y) *
                      (bb.max.z - bb.min.z);
                    if (volume > mainMeshVolume) {
                      mainMeshVolume = volume;
                      mainMesh = child;
                    }
                  }
                }
              });

              modelGroup.add(model);
              shirtMeshRef.current = mainMesh;

              model.updateMatrixWorld(true);
              applyShirtPrint();
              setLoading(false);
            },
            undefined,
            (err) => {
              console.warn('GLB load failed for polo, using procedural body + collar', err);
              if (!active) return;
              // Fallback: procedural shirt body + collar
              isFallbackRef.current = true;
              const mat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(currentColorRef.current), roughness: 0.8, metalness: 0.1
              });
              const shape = new THREE.Shape();
              shape.moveTo(-0.19, -0.32); shape.lineTo(0.19, -0.32);
              shape.lineTo(0.19, 0.02); shape.lineTo(0.36, -0.08);
              shape.lineTo(0.42, 0.04); shape.lineTo(0.22, 0.22);
              shape.lineTo(0.09, 0.22);
              shape.quadraticCurveTo(0, 0.12, -0.09, 0.22);
              shape.lineTo(-0.22, 0.22); shape.lineTo(-0.42, 0.04);
              shape.lineTo(-0.36, -0.08); shape.lineTo(-0.19, 0.02);
              shape.closePath();
              const geo = new THREE.ExtrudeGeometry(shape, {
                depth: 0.055, bevelEnabled: true, bevelSegments: 6,
                steps: 1, bevelSize: 0.014, bevelThickness: 0.014
              });
              geo.center();
              const torso = new THREE.Mesh(geo, mat);
              torso.castShadow = true; torso.receiveShadow = true;
              modelGroup.add(torso);
              shirtMeshRef.current = torso;
              addPoloCollar();
              applyShirtPrint();
              setLoading(false);
            }
          );

        } else {
          // Regular / drop-shoulder t-shirt: Try loading GLB, fall back to procedural
          isFallbackRef.current = false;
          const loader = createGltfLoader();
          const modelUrl = garmentType === 'dropshoulder' ? '/dropsholder.glb' : '/shirt_baked.glb';

          loader.load(
            modelUrl,
            (gltf) => {
              if (!active) return;
              const model = gltf.scene;

              // Auto-center the model using Box3
              const box = new THREE.Box3().setFromObject(model);
              const center = new THREE.Vector3();
              box.getCenter(center);
              model.position.x = -center.x;
              model.position.y = -center.y;
              model.position.z = -center.z;

              // Auto-scale model to fit a standard unit height of 0.68
              // By height, not max dimension: drop-shoulder is wider than tall
              const size = new THREE.Vector3();
              box.getSize(size);
              const targetScale = 0.68 / size.y;
              model.scale.set(targetScale, targetScale, targetScale);

              model.traverse((child) => {
                if (child.isMesh) {
                  shirtMeshRef.current = child;
                  child.castShadow = true;
                  child.receiveShadow = true;

                  child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(currentColorRef.current),
                    roughness: 0.8,
                    metalness: 0.1
                  });
                }
              });

              modelGroup.add(model);
              model.updateMatrixWorld(true);
              applyShirtPrint();
              setLoading(false);
            },
            undefined,
            (err) => {
              console.warn('GLTF loading error, falling back to procedural 3D model...', err);
              if (!active) return;
              loadProceduralShirt();
            }
          );
        }


        // ── Animate Loop ──
        const animate = () => {
          if (!active) return;
          animationFrameId = requestAnimationFrame(animate);

          // Smoothly glide the camera position to target if auto-animating
          if (isAnimatingCameraRef.current) {
            const tx = targetCameraXRef.current;
            const ty = targetCameraYRef.current;
            const tz = targetCameraZRef.current;
            
            camera.position.x += (tx - camera.position.x) * 0.1;
            camera.position.y += (ty - camera.position.y) * 0.1;
            camera.position.z += (tz - camera.position.z) * 0.1;

            if (camera.position.distanceTo(new THREE.Vector3(tx, ty, tz)) < 0.01) {
              camera.position.set(tx, ty, tz);
              isAnimatingCameraRef.current = false;
              if (interactive) {
                controls.enabled = true;
              }
            }
          }

          controls.update();
          renderer.render(scene, camera);
        };

        animate();

        // ── Handle Resize ──
        const handleResize = () => {
          if (!container || !camera || !renderer) return;
          if (!container.clientWidth || !container.clientHeight) return;
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        };

        window.addEventListener('resize', handleResize);
        // Parent stage can resize without a window resize (desktop stage scaling)
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);

        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize);
          if (frontFabricCanvas) frontFabricCanvas.off('after:render');
          if (backFabricCanvas) backFabricCanvas.off('after:render');
        };

      } catch (err) {
        console.error('Three.js initialization failed', err);
        setErrorMsg('Error loading 3D graphics canvas.');
        setLoading(false);
      }
    };

    initThree();

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
      resizeObserver?.disconnect();
      try {
        dracoLoader?.dispose?.();
      } catch (e) {}
      if (renderer && renderer.domElement && containerRef.current) {
        try {
          containerRef.current.removeChild(renderer.domElement);
        } catch(e) {}
      }
      if (renderer) renderer.dispose();
    };
  }, [frontFabricCanvas, backFabricCanvas, garmentType]);

  // 2. Sync Color Changes Instantly without reloading scene
  useEffect(() => {
    const modelGroup = modelGroupRef.current;
    if (!modelGroup) return;

    modelGroup.traverse((child) => {
      if (child.isMesh) {
        if (child.material) {
          const THREE = ThreeModuleRef.current;
          if (THREE) {
            // For polo: keep darker material pieces relatively darker
            const isDark = child.material.color && child.material.color.r < 0.85;
            if (isDark && garmentType === 'polo') {
              child.material.color.set(new THREE.Color(tshirtColor).multiplyScalar(0.78));
            } else {
              child.material.color.set(tshirtColor);
            }
          } else {
            child.material.color.set(tshirtColor);
          }
        }
      }
    });
  }, [tshirtColor, garmentType]);

  // Helper to safely render Fabric canvas without crashing on unmounted/disposed canvas context
  const safeRenderCanvas = (canvasObj) => {
    if (!canvasObj || !canvasObj.contextContainer || !canvasObj.lowerCanvasEl) return;
    try {
      if (typeof canvasObj.discardActiveObject === 'function') {
        canvasObj.discardActiveObject();
      }
      if (typeof canvasObj.renderAll === 'function') {
        canvasObj.renderAll();
      }
    } catch (e) {
      console.warn("Fabric canvas render suppressed:", e);
    }
  };

  // When entering Preview: clear selection, refresh texture, show the print
  useEffect(() => {
    if (!hideDecals) {
      safeRenderCanvas(frontFabricCanvas);
      safeRenderCanvas(backFabricCanvas);
      refreshCanvasTexture(frontTextureRef.current);
      refreshCanvasTexture(backTextureRef.current);
    }
    applyShirtPrint();
  }, [hideDecals]);

  // 3. Camera glide animation when view changes
  useEffect(() => {
    const isFront = tshirtView === 'front';

    // Temporarily lock controls while camera glides to front/back view
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    targetCameraXRef.current = 0;
    targetCameraYRef.current = 0.05;
    targetCameraZRef.current = isFront ? cameraZOffset : -cameraZOffset;
    isAnimatingCameraRef.current = true;
    
    // Force render Fabric.js and update textures safely
    safeRenderCanvas(frontFabricCanvas);
    safeRenderCanvas(backFabricCanvas);

    // Force update texture maps
    refreshCanvasTexture(frontTextureRef.current);
    refreshCanvasTexture(backTextureRef.current);

    // Re-apply design surfaces for the active view
    applyShirtPrint();
  }, [tshirtView, interactive]);

  // 4. Force Resize WebGL Renderer when tab visibility changes (solves 0x0 size bug when hidden)
  useEffect(() => {
    if (visible) {
      // Force render Fabric.js and update textures safely
      safeRenderCanvas(frontFabricCanvas);
      safeRenderCanvas(backFabricCanvas);

      const resizeAndRender = () => {
        const container = containerRef.current;
        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        if (container && renderer && camera) {
          const width = container.clientWidth || 380;
          const height = container.clientHeight || 420;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
          
          applyShirtPrint();

          refreshCanvasTexture(frontTextureRef.current);
          refreshCanvasTexture(backTextureRef.current);
        }
      };

      // Trigger immediately and with a small layout paint delay
      resizeAndRender();
      const timer = setTimeout(resizeAndRender, 60);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // 5. Update OrbitControls enabled state dynamically and reset on 2D mode
  useEffect(() => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (controls && camera) {
      controls.enabled = !!interactive;
      if (!interactive) {
        // Reset rotation and zoom to flat front/back view when returning to 2D editor
        controls.reset();
        const isFront = tshirtView === 'front';
        targetCameraXRef.current = 0;
        targetCameraYRef.current = 0.05;
        targetCameraZRef.current = isFront ? 0.95 : -0.95;
        isAnimatingCameraRef.current = true;
      }
    }
  }, [interactive, tshirtView]);

  return (
    <div 
      ref={containerRef} 
      className="position-relative w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ minHeight: '420px', cursor: 'grab' }}
    >
      {loading && (
        <div className="position-absolute top-50 start-50 translate-middle text-center z-3">
          <Spinner animation="border" variant="danger" />
          <p className="mt-2 text-muted small fw-semibold">
            Loading 3D {garmentType === 'polo' ? 'Polo T-Shirt' : garmentType === 'dropshoulder' ? 'Drop Shoulder T-Shirt' : 'T-Shirt'} Studio…
          </p>
        </div>
      )}
      {errorMsg && (
        <div className="position-absolute top-50 start-50 translate-middle text-center text-danger small z-3 fw-bold">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
