'use client';

import { useEffect, useRef, useState } from 'react';
import type * as Three from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type Status = 'idle' | 'loading' | 'ready' | 'unsupported' | 'error';

const SUPPORTED = ['stl', '3mf', 'obj'];

function extOf(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? '';
}

/**
 * Small corner preview of a file the customer picks on the quote form. Loads only for STL, 3MF
 * and OBJ, and only after a file is chosen. The file stays in the browser; nothing is uploaded.
 */
export function FilePreview({ file }: { file: File | null }) {
  const host = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    const el = host.current;
    if (!file || !el) return;
    const ext = extOf(file);
    if (!SUPPORTED.includes(ext)) return;

    let cancelled = false;
    let done = false;
    // Large 3MF files can take a long time to parse in the browser. Stop after 25 seconds.
    const timeout = window.setTimeout(() => {
      if (!done && !cancelled) setStatus('error');
    }, 25000);
    let raf = 0;
    let visible = true;
    let cleanup: (() => void) | null = null;
    let loaded: Three.Object3D | null = null;

    (async () => {
    try {
      const THREE = await import('three');
      const { OrbitControls: Controls } = await import('three/examples/jsm/controls/OrbitControls.js');
      const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
      const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
      const { ThreeMFLoader } = await import('three/examples/jsm/loaders/3MFLoader.js');
      if (cancelled) return;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        setStatus('unsupported');
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.setAttribute('role', 'img');
      renderer.domElement.setAttribute('aria-label', `Preview of ${file.name}`);
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
      scene.add(new THREE.AmbientLight(0xffffff, 1.0));
      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(2, 4, 3);
      scene.add(key);

      const material = new THREE.MeshStandardMaterial({ color: 0xf3f1ea, roughness: 0.6 });
      let geometryOrObject: { dispose?: () => void } | null = null;

      try {
        if (ext === 'stl') {
          const geo = new STLLoader().parse(await file.arrayBuffer()) as unknown as Three.BufferGeometry;
          geometryOrObject = geo;
          loaded = new THREE.Mesh(geo, material);
        } else if (ext === 'obj') {
          const obj = new OBJLoader().parse(await file.text()) as Three.Group;
          obj.traverse((o) => {
            const m = o as { isMesh?: boolean; material?: unknown };
            if (m.isMesh) m.material = material;
          });
          loaded = obj;
        } else {
          const obj = new ThreeMFLoader().parse(await file.arrayBuffer()) as Three.Group;
          obj.traverse((o) => {
            const m = o as { isMesh?: boolean; material?: unknown };
            if (m.isMesh) m.material = material;
          });
        }
      } catch {
        if (!cancelled) setStatus('error');
        return;
      }
      const model: Three.Object3D | null = loaded;
      if (cancelled || !model) return;

      // Centre the model and fit it into the view.
      const wrapper = new THREE.Group();
      wrapper.add(model);
      if (ext === 'stl') model.rotation.x = -Math.PI / 2; // STL is Z-up
      wrapper.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(wrapper);
      const size = box.getSize(new THREE.Vector3());
      const centre = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.0001);
      wrapper.position.sub(centre);
      wrapper.scale.setScalar(2.4 / maxDim);
      scene.add(wrapper);

      const controls: OrbitControls = new Controls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2.0;
      controls.minDistance = 2;
      controls.maxDistance = 9;
      camera.position.set(0, 1.4, 5.2);
      controls.update();

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
      });
      io.observe(el);

      cleanup = () => {
        visible = false;
        if (raf) cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        controls.dispose();
        material.dispose();
        geometryOrObject?.dispose?.();
        renderer.dispose();
        renderer.domElement.remove();
      };

      done = true;
      window.clearTimeout(timeout);
      setStatus('ready');
      loop();
    } catch {
      done = true;
      window.clearTimeout(timeout);
      if (!cancelled) setStatus('error');
    }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      if (raf) cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [file]);

  if (!file) return null;

  const supported = SUPPORTED.includes(extOf(file));
  const message = !supported
    ? 'No preview for this file type. Your file is still fine to upload.'
    : status === 'error'
      ? 'Preview did not finish. Large 3MF files are slow to preview. An STL export previews quickly.'
      : status === 'ready'
        ? 'Drag to turn'
        : 'Loading preview…';

  return (
    <figure className="file-corner" aria-label="File preview">
      {supported && <div ref={host} className="file-corner-stage" />}
      <figcaption className="file-corner-msg">{message}</figcaption>
    </figure>
  );
}
