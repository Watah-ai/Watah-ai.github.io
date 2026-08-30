'use client';

import { useEffect, useRef, useState } from 'react';

type GalaxyStatus = 'loading' | 'ready' | 'fallback';
type DeviceNavigator = Navigator & { deviceMemory?: number };

const vertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aRadius;
  attribute float aAngle;
  attribute float aSpeed;
  attribute float aPhase;
  attribute float aSize;
  attribute float aDrift;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float flow = sin(uTime * 0.2 + aPhase + aRadius * 1.7) * 0.018;
    float angle = aAngle + uTime * aSpeed + flow;
    float radius = aRadius + sin(uTime * 0.18 + aPhase) * aDrift;
    vec3 transformed = vec3(cos(angle) * radius, position.y + sin(uTime * 0.3 + aPhase) * aDrift * 0.55, sin(angle) * radius);
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * (58.0 / max(1.0, -mvPosition.z));
    vColor = color;
    vTwinkle = 0.78 + 0.22 * sin(uTime * 0.82 + aPhase * 3.0);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float core = smoothstep(0.5, 0.0, distanceToCenter);
    float glow = smoothstep(0.5, 0.12, distanceToCenter) * 0.42;
    float alpha = (core + glow) * vTwinkle * 0.56;
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(vColor * (0.72 + core * 0.58), alpha);
  }
`;

function createRandom(seed = 8731) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function getPerformanceProfile() {
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const memory = (navigator as DeviceNavigator).deviceMemory ?? 4;
  if (touch || window.innerWidth < 768) return { count: 32000, pixelRatio: 1.25, farStars: 650 };
  if (window.innerWidth >= 1280 && memory >= 8) return { count: 90000, pixelRatio: 1.75, farStars: 1300 };
  return { count: 64000, pixelRatio: 1.5, farStars: 900 };
}

export default function GalaxyBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<GalaxyStatus>('loading');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let frameId = 0;
    let resizeObserver: ResizeObserver | undefined;
    let cleanupScene: (() => void) | undefined;

    async function initialize(host: HTMLDivElement) {
      try {
        const THREE = await import('three');
        if (disposed) return;
        const profile = getPerformanceProfile();
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatio));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.domElement.className = 'h-full w-full';
        renderer.domElement.setAttribute('aria-hidden', 'true');
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
        camera.position.set(0.5, 15.8, 18.5);
        camera.lookAt(3.0, 0, 0);
        const galaxy = new THREE.Group();
        galaxy.position.set(4.0, 1.55, 0);
        galaxy.rotation.z = -0.12;
        galaxy.scale.setScalar(0.95);
        scene.add(galaxy);

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(profile.count * 3);
        const colors = new Float32Array(profile.count * 3);
        const radii = new Float32Array(profile.count);
        const angles = new Float32Array(profile.count);
        const speeds = new Float32Array(profile.count);
        const phases = new Float32Array(profile.count);
        const sizes = new Float32Array(profile.count);
        const drifts = new Float32Array(profile.count);
        const random = createRandom();
        const armCount = 4;
        const maxRadius = 10.6;
        const coreRadius = 0.1;
        const coreWhite = new THREE.Color('#fffbe6');
        const coreGold = new THREE.Color('#ffb454');
        const warmWhite = new THREE.Color('#fff0cf');
        const outerWhite = new THREE.Color('#e8f3ff');
        const outerBlue = new THREE.Color('#63b7ff');
        const outerPurple = new THREE.Color('#9278ff');
        const deepBlue = new THREE.Color('#4058d8');
        const color = new THREE.Color();

        for (let index = 0; index < profile.count; index += 1) {
          const radius = coreRadius + Math.pow(random(), 1.78) * (maxRadius - coreRadius);
          const normalizedRadius = radius / maxRadius;
          const armAngle = ((index % armCount) / armCount) * Math.PI * 2;
          const scatter = (random() - 0.5) * (0.36 + normalizedRadius * 0.82);
          const diffuseDisk = random() < 0.12;
          const angle = normalizedRadius < 0.23 || diffuseDisk
            ? random() * Math.PI * 2 + radius * 0.08
            : armAngle + radius * 0.69 + scatter;
          const base = index * 3;
          positions[base] = radius;
          positions[base + 1] = (0.08 + normalizedRadius * 0.44) * (random() - 0.5);
          positions[base + 2] = angle;
          radii[index] = radius;
          angles[index] = angle;
          speeds[index] = 0.026 / (0.72 + radius * 0.1) + random() * 0.0007;
          phases[index] = random() * Math.PI * 2;
          sizes[index] = (0.48 + random() * 0.72 + Math.pow(random(), 12) * 1.8) * (1.24 - normalizedRadius * 0.22);
          drifts[index] = 0.014 + random() * (0.018 + normalizedRadius * 0.06);

          if (normalizedRadius < 0.1) color.copy(coreWhite).lerp(coreGold, normalizedRadius / 0.1);
          else if (normalizedRadius < 0.25) color.copy(coreGold).lerp(warmWhite, (normalizedRadius - 0.1) / 0.15);
          else if (normalizedRadius < 0.42) color.copy(warmWhite).lerp(outerWhite, (normalizedRadius - 0.25) / 0.17);
          else if (normalizedRadius < 0.64) color.copy(outerWhite).lerp(outerBlue, (normalizedRadius - 0.42) / 0.22);
          else if (normalizedRadius < 0.86) color.copy(outerBlue).lerp(outerPurple, (normalizedRadius - 0.64) / 0.22);
          else color.copy(outerPurple).lerp(deepBlue, (normalizedRadius - 0.86) / 0.14);
          const variation = 0.82 + random() * 0.38;
          colors[base] = color.r * variation;
          colors[base + 1] = color.g * variation;
          colors[base + 2] = color.b * variation;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));
        geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
        geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
        geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
        geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('aDrift', new THREE.BufferAttribute(drifts, 1));

        const uniforms = { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } };
        const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
        galaxy.add(new THREE.Points(geometry, material));

        const coreGeometries = [new THREE.SphereGeometry(0.18, 24, 16), new THREE.SphereGeometry(0.6, 24, 16), new THREE.SphereGeometry(1.1, 24, 16)];
        const coreMaterials = [
          new THREE.MeshBasicMaterial({ color: 0xfff9db, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending }),
          new THREE.MeshBasicMaterial({ color: 0xffb14a, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }),
          new THREE.MeshBasicMaterial({ color: 0xff8b35, transparent: true, opacity: 0.04, depthWrite: false, blending: THREE.AdditiveBlending }),
        ];
        coreGeometries.forEach((coreGeometry, index) => galaxy.add(new THREE.Mesh(coreGeometry, coreMaterials[index])));

        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(profile.farStars * 3);
        const starColors = new Float32Array(profile.farStars * 3);
        const starPalette = [new THREE.Color('#dceaff'), new THREE.Color('#789cff'), new THREE.Color('#b69cff'), new THREE.Color('#ffd3a6')];
        for (let index = 0; index < profile.farStars; index += 1) {
          const base = index * 3;
          starPositions[base] = (random() - 0.5) * 42;
          starPositions[base + 1] = (random() - 0.5) * 20;
          starPositions[base + 2] = -4 - random() * 22;
          const starColor = starPalette[Math.floor(random() * starPalette.length)];
          starColors[base] = starColor.r;
          starColors[base + 1] = starColor.g;
          starColors[base + 2] = starColor.b;
        }
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        const starMaterial = new THREE.PointsMaterial({ vertexColors: true, size: 0.042, transparent: true, opacity: 0.62, depthWrite: false, blending: THREE.AdditiveBlending });
        scene.add(new THREE.Points(starGeometry, starMaterial));

        const resize = () => {
          if (disposed || host.clientWidth === 0 || host.clientHeight === 0) return;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatio));
          renderer.setSize(host.clientWidth, host.clientHeight, false);
          camera.aspect = host.clientWidth / host.clientHeight;
          camera.updateProjectionMatrix();
          uniforms.uPixelRatio.value = renderer.getPixelRatio();
        };
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resize();

        const startTime = performance.now();
        const render = () => {
          if (disposed) return;
          const elapsed = (performance.now() - startTime) / 1000;
          uniforms.uTime.value = elapsed;
          if (!reduceMotion) {
            camera.position.x = 0.5 + Math.sin(elapsed * 0.02) * 0.2;
            camera.position.z = 18.5 + Math.cos(elapsed * 0.018) * 0.16;
            camera.lookAt(3.0, 0, 0);
          }
          renderer.render(scene, camera);
          if (!reduceMotion && !document.hidden) frameId = window.requestAnimationFrame(render);
        };
        const handleVisibility = () => {
          window.cancelAnimationFrame(frameId);
          if (!document.hidden && !reduceMotion) frameId = window.requestAnimationFrame(render);
        };
        const handleContextLost = (event: Event) => {
          event.preventDefault();
          window.cancelAnimationFrame(frameId);
          setStatus('fallback');
        };
        document.addEventListener('visibilitychange', handleVisibility);
        renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

        cleanupScene = () => {
          window.cancelAnimationFrame(frameId);
          document.removeEventListener('visibilitychange', handleVisibility);
          renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
          resizeObserver?.disconnect();
          geometry.dispose();
          material.dispose();
          coreGeometries.forEach((item) => item.dispose());
          coreMaterials.forEach((item) => item.dispose());
          starGeometry.dispose();
          starMaterial.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
        setStatus('ready');
        render();
      } catch (error) {
        console.warn('Galaxy background unavailable; using the static fallback.', error);
        if (!disposed) setStatus('fallback');
      }
    }

    void initialize(container);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      cleanupScene?.();
    };
  }, []);

  return <div ref={containerRef} aria-hidden="true" data-galaxy-status={status} className="galaxy-background absolute inset-0 overflow-hidden" />;
}
