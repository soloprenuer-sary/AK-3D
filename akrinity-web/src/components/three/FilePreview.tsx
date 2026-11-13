'use client';

import { useEffect, useRef, useState } from 'react';
import type * as Three from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type Status = 'idle' | 'loading' | 'ready' | 'unsupported' | 'error';

const SUPPORTED = ['stl', '3mf', 'obj'];
/** STL previews fast at any size. 3MF and OBJ are parsed on the page, so very large ones are skipped. */
const PREVIEW_LIMIT_BYTES = 40 * 1024 * 1024;
/** Stop waiting after this long. The parse itself blocks the page, so this is a safety net. */
const PREVIEW_TIMEOUT_MS = 30000;

function extOf(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? '';
}

interface FilePreviewProps {
  file: File | null;
  /** Hex colour applied to the model. Changing it recolours the model without reloading the file. */
  colour: string;
}

/**
 * Preview of the file the customer picks on the quote form, shown in a full-width box. Loads only
 * for STL, 3MF and OBJ, and only after a file is chosen. The file stays in the browser; nothing is
 * uploaded.
 */
export function FilePreview({ file, colour }: FilePreviewProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const materialRef = useRef<Three.MeshStandardMaterial | null>(null);
  const colourRef = useRef(colour);
  const [status, setStatus] = useState<Status>('idle');

  // Recolour the live model when a colour is picked. No reload needed.
  useEffect(() => {
    colourRef.current = colour;
    materialRef.current?.color.set(colour);
  }, [colour]);

  useEffect(() => {
    const el = host.current;
    if (!file || !el) return;
    const ext = extOf(file);
    if (!SUPPORTED.includes(ext)) return;
    if (ext !== 'stl' && file.size > PREVIEW_LIMIT_BYTES) return;

    let cancelled = false;
    let done = false;
    const timeout = window.setTimeout(() => {
      if (!done && !cancelled) setStatus('error');
    }, PREVIEW_TIMEOUT_MS);
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

        const material = new THREE.MeshStandardMaterial({ color: colourRef.current, roughness: 0.5 });
        materialRef.current = material;
        let geometry: { dispose?: () => void } | null = null;

        try {
          if (ext === 'stl') {
            const geo = new STLLoader().parse(await file.arrayBuffer()) as unknown as Three.BufferGeometry;
            geometry = geo;
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
            loaded = obj;
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
          materialRef.current = null;
          geometry?.dispose?.();
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

  const ext = file ? extOf(file) : '';
  const supported = file ? SUPPORTED.includes(ext) : false;
  const tooLarge = file ? ext !== 'stl' && file.size > PREVIEW_LIMIT_BYTES : false;

  let message = '';
  if (!file) message = 'Choose a file above and it appears here. You can turn it and change its colour.';
  else if (!supported) message = 'No preview for this file type. Your file is still fine to upload.';
  else if (tooLarge) message = 'This file is too large to preview in the browser (over 40 MB). It is still fine to upload; we check it when we quote.';
  else if (status === 'error') message = 'Preview did not finish. Your file is still fine to upload; we check it when we quote.';
  else if (status === 'unsupported') message = 'This browser cannot show 3D previews. Your file is still fine to upload.';
  else if (status !== 'ready') message = 'Loading preview…';

  return (
    <div className="file-stage">
      {file && supported && !tooLarge && <div ref={host} style={{ position: 'absolute', inset: 0 }} />}
      {message && (
        <div className="file-stage-msg" role="status">
          {message}
        </div>
      )}
      {status === 'ready' && <span className="file-stage-hint">Drag to turn · scroll to zoom</span>}
    </div>
  );
}
