'use client';

import { useEffect, useRef, useState } from 'react';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { prof } from '@/lib/printer-geometry';
import { COLOURS, type ShopProduct } from '@/lib/shop-data';

type Status = 'loading' | 'ready' | 'unsupported' | 'error';

const MESSAGES: Record<Exclude<Status, 'ready'>, string> = {
  loading: 'Loading 3D preview…',
  unsupported:
    '3D preview needs WebGL, which this browser does not support. Use the photos instead.',
  error: '3D preview could not load. Reload the page to try again.',
};

interface ModelViewerProps {
  product: ShopProduct;
  /** Optional 3MF model URL. When missing, a sample vase is shown. */
  modelUrl?: string;
}

/**
 * Interactive 3D preview. three.js is imported only when this component mounts (the 3D tab
 * opens), drawing pauses when scrolled off screen, and everything is released on unmount.
 */
export function ModelViewer({ product, modelUrl }: ModelViewerProps) {
  const host = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [autoRotate, setAutoRotate] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let raf = 0;
    let visible = false;
    let dispose: (() => void) | null = null;

    (async () => {
      const THREE = await import('three');
      const { OrbitControls: Controls } = await import(
        'three/examples/jsm/controls/OrbitControls.js'
      );
      if (cancelled) return;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        setStatus('unsupported');
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.domElement.setAttribute('role', 'img');
      renderer.domElement.setAttribute('aria-label', `3D preview of ${product.name}`);
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 2.4, 8.5);
      scene.add(new THREE.AmbientLight(0xffffff, 0.9));
      const key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(3, 6, 4);
      scene.add(key);

      // Print bed
      const bedGeo = new THREE.CylinderGeometry(2.6, 2.6, 0.12, 64);
      const bedMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
      const bed = new THREE.Mesh(bedGeo, bedMat);
      bed.position.y = -0.06;
      scene.add(bed);

      // The part: an uploaded 3MF model, or the sample vase (same profile as the hero printer).
      const partGeos: { dispose: () => void }[] = [];
      const partMats: { dispose: () => void }[] = [];
      if (modelUrl) {
        try {
          const { ThreeMFLoader } = await import('three/examples/jsm/loaders/3MFLoader.js');
          const loader = new ThreeMFLoader();
          const model = await new Promise<InstanceType<typeof THREE.Group>>((resolve, reject) =>
            loader.load(modelUrl, resolve, undefined, reject),
          );
          if (cancelled) return;
          // Fit the model to about 3.4 units tall, standing on the bed, centred.
          const first = new THREE.Box3().setFromObject(model);
          const size = first.getSize(new THREE.Vector3());
          const s = 3.4 / Math.max(size.x, size.y, size.z, 0.0001);
          model.scale.setScalar(s);
          model.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(model);
          const centre = box.getCenter(new THREE.Vector3());
          model.position.set(-centre.x, -box.min.y, -centre.z);
          model.traverse((child) => {
            const mesh = child as { isMesh?: boolean; geometry?: { dispose: () => void }; material?: { dispose: () => void } };
            if (mesh.isMesh) {
              if (mesh.geometry) partGeos.push(mesh.geometry);
              if (mesh.material) partMats.push(mesh.material);
            }
          });
          scene.add(model);
        } catch {
          setStatus('error');
          return;
        }
      } else {
        const profile: InstanceType<typeof THREE.Vector2>[] = [];
        for (let i = 0; i <= 40; i++) {
          const t = i / 40;
          profile.push(new THREE.Vector2(prof(t) / 40, t * 3.4));
        }
        const vaseGeo = new THREE.LatheGeometry(profile, 64);
        const vaseMat = new THREE.MeshStandardMaterial({
          color: COLOURS[product.colours[0]],
          roughness: 0.55,
          side: THREE.DoubleSide,
        });
        partGeos.push(vaseGeo);
        partMats.push(vaseMat);
        scene.add(new THREE.Mesh(vaseGeo, vaseMat));
      }

      const controls = new Controls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 4;
      controls.maxDistance = 12;
      controls.target.set(0, 1.6, 0);
      controls.update();
      controlsRef.current = controls;

      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      const loop = () => {
        raf = 0;
        if (!visible) return;
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(loop);
      };

      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) loop();
        if (!visible && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      });
      io.observe(el);

      renderer.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        visible = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        setStatus('error');
      });

      dispose = () => {
        visible = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        io.disconnect();
        ro.disconnect();
        controls.dispose();
        controlsRef.current = null;
        bedGeo.dispose();
        bedMat.dispose();
        partGeos.forEach((g) => g.dispose());
        partMats.forEach((m) => m.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };

      setStatus('ready');
      loop();
    })();

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [product, modelUrl]);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  return (
    <div className="viewer">
      <div ref={host} className="viewer-stage" />
      {status !== 'ready' && (
        <p className="viewer-msg" role="status">
          {MESSAGES[status]}
        </p>
      )}
      <p className="viewer-hint">Drag to rotate. Scroll to zoom.</p>
      <div className="viewer-actions">
        <button
          type="button"
          className="pill"
          aria-pressed={autoRotate}
          onClick={() => setAutoRotate((v) => !v)}
          disabled={status !== 'ready'}
        >
          Auto-rotate
        </button>
        <button
          type="button"
          className="pill"
          onClick={() => controlsRef.current?.reset()}
          disabled={status !== 'ready'}
        >
          Reset view
        </button>
      </div>
    </div>
  );
}
