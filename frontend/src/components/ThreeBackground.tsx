import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000008, 0.012);

      const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
      camera.position.set(0, 0, 80);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000008, 1);
      container.appendChild(renderer.domElement);

      const rand = (a: number, b: number) => Math.random() * (b - a) + a;

      // 1. Background star field
      const bgStarCount = 4000;
      const bgGeo = new THREE.BufferGeometry();
      const bgPos = new Float32Array(bgStarCount * 3);
      const bgCol = new Float32Array(bgStarCount * 3);
      const starColors = [
        new THREE.Color(0xffffff),
        new THREE.Color(0xaac4ff),
        new THREE.Color(0xffd6a5),
        new THREE.Color(0xffadad),
        new THREE.Color(0xcaffbf),
      ];
      for (let i = 0; i < bgStarCount; i++) {
        bgPos[i * 3]     = rand(-600, 600);
        bgPos[i * 3 + 1] = rand(-600, 600);
        bgPos[i * 3 + 2] = rand(-600, -20);
        const c = starColors[Math.floor(Math.random() * starColors.length)];
        bgCol[i * 3] = c.r; bgCol[i * 3 + 1] = c.g; bgCol[i * 3 + 2] = c.b;
      }
      bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
      bgGeo.setAttribute('color', new THREE.BufferAttribute(bgCol, 3));
      scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true })));

      // 2. Spiral Galaxy
      const armCount = 3, armStars = 1200;
      const galaxyGeo = new THREE.BufferGeometry();
      const galaxyPos = new Float32Array(armCount * armStars * 3);
      const galaxyCol = new Float32Array(armCount * armStars * 3);
      const innerColor = new THREE.Color(0xffefc8);
      const outerColor = new THREE.Color(0x2244ff);
      let gi = 0;
      for (let arm = 0; arm < armCount; arm++) {
        const armOffset = (arm / armCount) * Math.PI * 2;
        for (let s = 0; s < armStars; s++) {
          const t = s / armStars;
          const angle = t * Math.PI * 6 + armOffset;
          const radius = t * 55 + rand(0, 3);
          const spread = rand(-3, 3) * (1 - t * 0.6);
          const height = rand(-3, 3) * (1 - t * 0.6);
          galaxyPos[gi] = Math.cos(angle) * radius + spread;
          galaxyPos[gi + 1] = height;
          galaxyPos[gi + 2] = Math.sin(angle) * radius + spread;
          const mixed = innerColor.clone().lerp(outerColor, t);
          galaxyCol[gi] = mixed.r; galaxyCol[gi + 1] = mixed.g; galaxyCol[gi + 2] = mixed.b;
          gi += 3;
        }
      }
      galaxyGeo.setAttribute('position', new THREE.BufferAttribute(galaxyPos, 3));
      galaxyGeo.setAttribute('color', new THREE.BufferAttribute(galaxyCol, 3));
      const galaxy = new THREE.Points(galaxyGeo, new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
      galaxy.position.set(20, -15, -30);
      galaxy.rotation.x = Math.PI * 0.15;
      scene.add(galaxy);

      // 3. Nebula dust clouds
      const nebulaColors = [0x7b00ff, 0x0088ff, 0xff2266, 0x00eeff, 0xaa00ff];
      function makeNebulaCloud(x: number, y: number, z: number, colorHex: number, count: number, radius: number) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const r = rand(0, radius);
          pos[i * 3]     = x + r * Math.sin(phi) * Math.cos(theta) + rand(-radius * 0.3, radius * 0.3);
          pos[i * 3 + 1] = y + r * Math.sin(phi) * Math.sin(theta) * 0.5 + rand(-radius * 0.1, radius * 0.1);
          pos[i * 3 + 2] = z + r * Math.cos(phi) + rand(-radius * 0.3, radius * 0.3);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: rand(1.2, 2.5), color: colorHex, transparent: true, opacity: rand(0.04, 0.12), blending: THREE.AdditiveBlending, sizeAttenuation: true })));
      }
      makeNebulaCloud(-35, 10, -80,  nebulaColors[0], 800, 30);
      makeNebulaCloud( 40, -5, -100, nebulaColors[1], 700, 25);
      makeNebulaCloud( 10, 25, -60,  nebulaColors[2], 600, 20);
      makeNebulaCloud(-20,-20, -90,  nebulaColors[3], 900, 35);
      makeNebulaCloud( 55, 15, -70,  nebulaColors[4], 500, 18);
      makeNebulaCloud(  0,  0, -50,  nebulaColors[1], 400, 12);

      // 4. Shooting stars
      interface Shooter { line: THREE.Line; velocity: THREE.Vector3; life: number; maxLife: number; mat: THREE.LineBasicMaterial; }
      const shooters: Shooter[] = [];
      function spawnShooter() {
        const pts = [new THREE.Vector3(rand(-120,120), rand(20,80), rand(-50,10)), new THREE.Vector3(rand(-120,120), rand(20,80), rand(-50,10))];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        shooters.push({ line, velocity: new THREE.Vector3(rand(-2,2), rand(-3,-1.5), rand(-1,1)), life: 0, maxLife: rand(0.4,0.9), mat });
      }

      // 5. Distant glowing orbs
      for (let i = 0; i < 12; i++) {
        const orb = new THREE.Mesh(new THREE.SphereGeometry(rand(0.4,1.5),8,8), new THREE.MeshBasicMaterial({ color: nebulaColors[Math.floor(Math.random()*nebulaColors.length)], transparent: true, opacity: rand(0.3,0.7) }));
        orb.position.set(rand(-80,80), rand(-40,40), rand(-120,-20));
        scene.add(orb);
      }

      // Mouse parallax
      const mouse = { x: 0, y: 0 };
      const smoothMouse = { x: 0, y: 0 };
      function onMouseMove(e: MouseEvent) { mouse.x = (e.clientX/window.innerWidth-0.5)*2; mouse.y = (e.clientY/window.innerHeight-0.5)*2; }
      window.addEventListener('mousemove', onMouseMove);

      // Animation loop
      const clock = new THREE.Clock();
      let shooterTimer = 0;
      function animate() {
        animationFrameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();
        smoothMouse.x += (mouse.x - smoothMouse.x) * 0.03;
        smoothMouse.y += (mouse.y - smoothMouse.y) * 0.03;
        camera.position.x = smoothMouse.x * 6;
        camera.position.y = -smoothMouse.y * 4;
        camera.lookAt(smoothMouse.x * 2, -smoothMouse.y * 2, 0);
        galaxy.rotation.y = elapsed * 0.025;
        shooterTimer += delta;
        if (shooterTimer > rand(0.8, 2.5)) { spawnShooter(); shooterTimer = 0; }
        for (let i = shooters.length - 1; i >= 0; i--) {
          const s = shooters[i];
          s.life += delta;
          const t = s.life / s.maxLife;
          const pos = s.line.geometry.attributes.position?.array as Float32Array | undefined;
          if (!pos) { shooters.splice(i, 1); continue; }
          pos[0]=pos[3]; pos[1]=pos[4]; pos[2]=pos[5];
          pos[3]+=s.velocity.x; pos[4]+=s.velocity.y; pos[5]+=s.velocity.z;
          s.line.geometry.attributes.position.needsUpdate = true;
          s.mat.opacity = t < 0.5 ? t*2*0.9 : (1-t)*0.9;
          if (s.life >= s.maxLife) { scene.remove(s.line); s.line.geometry.dispose(); s.mat.dispose(); shooters.splice(i,1); }
        }
        if (renderer) renderer.render(scene, camera);
      }
      animate();

      function onResize() { if (!renderer) return; camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }
      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(animationFrameId);
        if (renderer) { renderer.dispose(); if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement); }
      };
    } catch (e) {
      console.warn('WebGL not available:', e);
    }
  }, []);

  return <div ref={containerRef} className="three-canvas-container" />;
}
