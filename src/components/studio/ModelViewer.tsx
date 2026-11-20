"use client";

import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { Surface } from "@/lib/model3d/types";

export interface ModelViewerHandle {
  /** Sličica trenutnega pogleda (JPEG data URL) ali null. */
  capture: (width?: number, height?: number) => string | null;
  resetView: () => void;
}

const SURFACE_MATERIAL: Record<
  Surface,
  { roughness: number; metalness: number; flat: boolean }
> = {
  mat: { roughness: 0.85, metalness: 0, flat: false },
  sijajna: { roughness: 0.22, metalness: 0.08, flat: false },
  groba: { roughness: 1, metalness: 0, flat: true },
  gladka: { roughness: 0.5, metalness: 0.02, flat: false },
};

export default function ModelViewer({
  ref,
  geometry,
  color,
  surface,
  fitKey,
  label,
}: {
  ref?: Ref<ModelViewerHandle>;
  geometry: THREE.BufferGeometry | null;
  color: string;
  surface: Surface;
  /** Ob spremembi ključa se kamera prilagodi modelu. */
  fitKey: string;
  label: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    mesh: THREE.Mesh;
    material: THREE.MeshStandardMaterial;
    render: () => void;
    fit: () => void;
  } | null>(null);
  const [webglError] = useState(() => {
    try {
      const test = document.createElement("canvas");
      return !(test.getContext("webgl2") ?? test.getContext("webgl"));
    } catch {
      return true;
    }
  });

  // enkratna postavitev scene
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    if (webglError) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0b0e11, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 6000);
    camera.position.set(160, 140, 200);

    scene.add(new THREE.HemisphereLight(0xdfefff, 0x1a2027, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(150, 260, 180);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8fdcff, 0.8);
    rim.position.set(-200, 120, -160);
    scene.add(rim);

    const grid = new THREE.GridHelper(220, 22, 0x2f6f8a, 0x1f2a33);
    scene.add(grid);

    const material = new THREE.MeshStandardMaterial({ color: "#38c8ff" });
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    scene.add(mesh);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = false;
    controls.screenSpacePanning = true;
    controls.listenToKeyEvents(canvas);
    controls.keyPanSpeed = 20;

    const render = () => renderer.render(scene, camera);
    controls.addEventListener("change", render);

    const fit = () => {
      const geom = mesh.geometry;
      geom.computeBoundingBox();
      const box = geom.boundingBox;
      if (!box || box.isEmpty()) {
        controls.target.set(0, 0, 0);
        camera.position.set(160, 140, 200);
      } else {
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const radius = Math.max(size.length() / 2, 10);
        const distance =
          (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.15;
        const dir = new THREE.Vector3(0.75, 0.55, 1).normalize();
        controls.target.copy(center);
        camera.position.copy(center).addScaledVector(dir, distance);
        camera.near = Math.max(0.1, distance / 200);
        camera.far = distance * 20;
        camera.updateProjectionMatrix();
      }
      controls.update();
      render();
    };

    const resize = () => {
      const { clientWidth, clientHeight } = host;
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    stateRef.current = {
      renderer,
      scene,
      camera,
      controls,
      mesh,
      material,
      render,
      fit,
    };
    return () => {
      observer.disconnect();
      controls.dispose();
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      stateRef.current = null;
    };
  }, [webglError]);

  // zamenjava geometrije
  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    state.mesh.geometry = geometry ?? new THREE.BufferGeometry();
    state.mesh.visible = Boolean(geometry);
    state.render();
  }, [geometry]);

  // prilagoditev kamere ob novem modelu
  useEffect(() => {
    stateRef.current?.fit();
  }, [fitKey]);

  // material
  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    const look = SURFACE_MATERIAL[surface];
    state.material.color.set(color);
    state.material.roughness = look.roughness;
    state.material.metalness = look.metalness;
    state.material.flatShading = look.flat;
    state.material.needsUpdate = true;
    state.render();
  }, [color, surface]);

  useImperativeHandle(ref, () => ({
    capture: (width = 320, height = 240) => {
      const state = stateRef.current;
      if (!state) return null;
      state.render();
      const source = state.renderer.domElement;
      const out = document.createElement("canvas");
      out.width = width;
      out.height = height;
      const ctx = out.getContext("2d");
      if (!ctx) return null;
      const scale = Math.max(width / source.width, height / source.height);
      const w = source.width * scale;
      const h = source.height * scale;
      ctx.drawImage(source, (width - w) / 2, (height - h) / 2, w, h);
      return out.toDataURL("image/jpeg", 0.8);
    },
    resetView: () => stateRef.current?.fit(),
  }));

  function orbit(deltaDeg: number) {
    const state = stateRef.current;
    if (!state) return;
    const offset = state.camera.position.clone().sub(state.controls.target);
    offset.applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      THREE.MathUtils.degToRad(deltaDeg),
    );
    state.camera.position.copy(state.controls.target).add(offset);
    state.controls.update();
    state.render();
  }

  function zoom(factor: number) {
    const state = stateRef.current;
    if (!state) return;
    const offset = state.camera.position.clone().sub(state.controls.target);
    offset.multiplyScalar(factor);
    state.camera.position.copy(state.controls.target).add(offset);
    state.controls.update();
    state.render();
  }

  const button =
    "inline-flex size-11 items-center justify-center rounded-full bg-bg/80 text-fg ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/10";

  return (
    <div
      ref={hostRef}
      className="relative h-full min-h-[18rem] w-full overflow-hidden rounded-[1.5rem] bg-[#0b0e11] ring-1 ring-white/10"
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="img"
        aria-label={`${label}. Vleci za vrtenje, kolešček ali dva prsta za povečavo, desni klik za premik. S tipkami s puščicami premikaš pogled, ko je predogled izbran.`}
        className="block h-full w-full touch-none outline-none focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-accent"
      />
      {webglError ? (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-fg-muted">
          Tvoj brskalnik ne podpira 3D predogleda (WebGL). Model lahko še vedno
          pripraviš in preneseš.
        </div>
      ) : null}
      <div
        className="absolute right-3 bottom-3 flex gap-2"
        role="group"
        aria-label="Upravljanje pogleda"
      >
        <button
          type="button"
          className={button}
          onClick={() => orbit(-30)}
          aria-label="Zavrti pogled levo"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M7 4L3 8l4 4M3 8h9a5 5 0 010 10H9" />
          </svg>
        </button>
        <button
          type="button"
          className={button}
          onClick={() => orbit(30)}
          aria-label="Zavrti pogled desno"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M13 4l4 4-4 4M17 8H8a5 5 0 000 10h3" />
          </svg>
        </button>
        <button
          type="button"
          className={button}
          onClick={() => zoom(0.8)}
          aria-label="Povečaj pogled"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M10 4v12M4 10h12" />
          </svg>
        </button>
        <button
          type="button"
          className={button}
          onClick={() => zoom(1.25)}
          aria-label="Pomanjšaj pogled"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M4 10h12" />
          </svg>
        </button>
        <button
          type="button"
          className={button}
          onClick={() => stateRef.current?.fit()}
          aria-label="Ponastavi pogled"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M4 9a6 6 0 1 1 1.8 4.3M4 4v5h5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
