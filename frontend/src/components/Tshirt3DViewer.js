'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Spinner } from 'react-bootstrap';

export default function Tshirt3DViewer({ tshirtColor, tshirtView, frontFabricCanvas, backFabricCanvas, visible = true, interactive = true, hideDecals = false, cameraZOffset = 0.95, enableZoom = true, garmentType = 'tshirt' }) {
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
  const decalMeshFrontRef = useRef(null);
  const decalMeshBackRef = useRef(null);
  const decalMeshSetRef = useRef(new Set()); // tracks all decal meshes for color exclusion
  const isFallbackRef = useRef(false);
  const DecalGeometryClassRef = useRef(null);
  const ThreeModuleRef = useRef(null);

  // Camera targets for smooth transition
  const targetCameraXRef = useRef(0);
  const targetCameraYRef = useRef(0.05);
  const targetCameraZRef = useRef(tshirtView === 'front' ? cameraZOffset : -cameraZOffset);
  const isAnimatingCameraRef = useRef(false);

  // Keep track of the latest color without triggering scene re-renders
  const currentColorRef = useRef(tshirtColor);
  useEffect(() => {
    currentColorRef.current = tshirtColor;
  }, [tshirtColor]);

  // Refs for double-sided canvas textures
  const frontTextureRef = useRef(null);
  const backTextureRef = useRef(null);

  // Helper to project BOTH front and back design decals
  const projectDecals = () => {
    const THREE = ThreeModuleRef.current;
    const DecalGeometry = DecalGeometryClassRef.current;
    const mesh = shirtMeshRef.current;
    const modelGroup = modelGroupRef.current;

    const texFront = frontTextureRef.current;
    const texBack = backTextureRef.current;

    if (!THREE || !DecalGeometry || !mesh || !modelGroup || !texFront || !texBack) return;

    // Remove existing decals
    if (decalMeshFrontRef.current) {
      modelGroup.remove(decalMeshFrontRef.current);
      decalMeshSetRef.current.delete(decalMeshFrontRef.current);
      decalMeshFrontRef.current = null;
    }
    if (decalMeshBackRef.current) {
      modelGroup.remove(decalMeshBackRef.current);
      decalMeshSetRef.current.delete(decalMeshBackRef.current);
      decalMeshBackRef.current = null;
    }

    // Hide decals if explicitly requested (e.g., in 2D mode to prevent ghosting)
    if (hideDecals) {
      return;
    }

    const isFallback = isFallbackRef.current;
    
    // Front vs Back position coordinates
    let zOffset = 0.08;
    let yOffset = -0.01;

    if (isFallback) {
      zOffset = 0.046;
    } else {
      // Find bounds of the mesh to project the decal precisely on the centered mesh surface
      const tempBox = new THREE.Box3().setFromObject(mesh);
      const tempSize = new THREE.Vector3();
      tempBox.getSize(tempSize);
      zOffset = tempSize.z / 2 + 0.008; // slightly in front of the mesh surface
    }

    const size = isFallback
      ? new THREE.Vector3(0.24, 0.44, 0.2)
      : new THREE.Vector3(0.28, 0.51, 0.2); // Z depth 0.2 is enough now that matrixWorld is correct

    try {
      // 1. Project Front Decal (using front texture)
      const posFront = new THREE.Vector3(0, yOffset, zOffset); 
      const rotFront = new THREE.Euler(0, 0, 0);
      const geoFront = new DecalGeometry(mesh, posFront, rotFront, size);
      const matFront = new THREE.MeshBasicMaterial({
        map: texFront,
        color: 0xffffff,        // ← MUST stay white — never let shirt color tint the decal
        transparent: true,
        alphaTest: 0.01,
        depthTest: false,       // ← OFF: renderOrder=20 already ensures correct draw order
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4
      });
      const decalFront = new THREE.Mesh(geoFront, matFront);
      decalFront.position.z += 0.003;
      decalFront.renderOrder = 20;
      decalFront.userData.isDecal = true;
      decalMeshFrontRef.current = decalFront;
      decalMeshSetRef.current.add(decalFront);
      modelGroup.add(decalFront);

      // 2. Project Back Decal (using back texture)
      const posBack = new THREE.Vector3(0, yOffset, -zOffset); 
      const rotBack = new THREE.Euler(0, Math.PI, 0);
      const geoBack = new DecalGeometry(mesh, posBack, rotBack, size);
      const matBack = new THREE.MeshBasicMaterial({
        map: texBack,
        color: 0xffffff,        // ← MUST stay white
        transparent: true,
        alphaTest: 0.01,
        depthTest: false,       // ← OFF
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4
      });
      const decalBack = new THREE.Mesh(geoBack, matBack);
      decalBack.position.z -= 0.003;
      decalBack.renderOrder = 20;
      decalBack.userData.isDecal = true;
      decalMeshBackRef.current = decalBack;
      decalMeshSetRef.current.add(decalBack);
      modelGroup.add(decalBack);

    } catch (e) {
      console.warn('Failed to project decals', e);
    }
  };

  // 1. Scene Initialization (runs once on mount / canvas bind)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let active = true;
    let renderer, scene, camera, controls;
    let animationFrameId;

    const initThree = async () => {
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
        const { DecalGeometry } = await import('three/examples/jsm/geometries/DecalGeometry.js');

        if (!active) return;

        ThreeModuleRef.current = THREE;
        DecalGeometryClassRef.current = DecalGeometry;

        const container = containerRef.current;
        if (!container) return;

        // ── Scene Setup ──
        scene = new THREE.Scene();
        scene.background = null;

        // ── Camera ──
        camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
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

        // ── Initialize CanvasTextures directly from DOM Canvases ──
        if (frontFabricCanvas) {
          const texFront = new THREE.CanvasTexture(frontFabricCanvas.getElement());
          texFront.anisotropy = 8;
          texFront.colorSpace = THREE.SRGBColorSpace;
          frontTextureRef.current = texFront;

          frontFabricCanvas.on('after:render', () => {
            if (frontTextureRef.current) frontTextureRef.current.needsUpdate = true;
          });
        }

        if (backFabricCanvas) {
          const texBack = new THREE.CanvasTexture(backFabricCanvas.getElement());
          texBack.anisotropy = 8;
          texBack.colorSpace = THREE.SRGBColorSpace;
          backTextureRef.current = texBack;

          backFabricCanvas.on('after:render', () => {
            if (backTextureRef.current) backTextureRef.current.needsUpdate = true;
          });
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
          projectDecals();
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
          projectDecals();
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
          // Load polo.obj
          const loader = new OBJLoader();
          loader.load(
            '/polo.obj',
            (obj) => {
              if (!active) return;
              const model = obj;

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
              // Make the polo model 15% wider (X-axis) to match a boxier fit
              model.scale.set(targetScale * 1.1, targetScale, targetScale);

              let mainMesh = null;
              model.traverse((child) => {
                if (child.isMesh) {
                  if (!mainMesh) mainMesh = child;
                  child.castShadow = true;
                  child.receiveShadow = true;
                  child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(currentColorRef.current),
                    roughness: 0.8, metalness: 0.1
                  });
                }
              });

              modelGroup.add(model);
              shirtMeshRef.current = mainMesh;

              // Force update world matrix so DecalGeometry uses the scaled/positioned mesh
              model.updateMatrixWorld(true);

              projectDecals();
              setLoading(false);

            },
            undefined,
            (err) => {
              console.warn('OBJ load failed for polo, using procedural body + collar', err);
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
              projectDecals();
              setLoading(false);
            }
          );

        } else {
          // Regular t-shirt: Try loading GLB, fall back to procedural
          const loader = new GLTFLoader();
          const modelUrl = '/shirt_baked.glb';

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
              const size = new THREE.Vector3();
              box.getSize(size);
              const maxDim = Math.max(size.x, size.y, size.z);
              const targetScale = 0.68 / maxDim;
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
              projectDecals();
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
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        };

        window.addEventListener('resize', handleResize);

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
      // Exclude ALL decal meshes from color overriding using userData flag
      if (child.isMesh && !child.userData.isDecal) {
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

    // Safety net: always reset decal material colors to pure white so they are never tinted
    if (decalMeshFrontRef.current && decalMeshFrontRef.current.material) {
      decalMeshFrontRef.current.material.color.set(0xffffff);
    }
    if (decalMeshBackRef.current && decalMeshBackRef.current.material) {
      decalMeshBackRef.current.material.color.set(0xffffff);
    }
  }, [tshirtColor]);

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
    if (frontTextureRef.current) frontTextureRef.current.needsUpdate = true;
    if (backTextureRef.current) backTextureRef.current.needsUpdate = true;

    // Re-project BOTH decals to show up properly
    projectDecals();
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
          
          // Re-project decals to align with updated scale
          projectDecals();

          if (frontTextureRef.current) frontTextureRef.current.needsUpdate = true;
          if (backTextureRef.current) backTextureRef.current.needsUpdate = true;
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
            Loading 3D {garmentType === 'polo' ? 'Polo T-Shirt' : 'T-Shirt'} Studio…
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
