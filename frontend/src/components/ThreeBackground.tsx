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
      // Scene setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x050510, 1);
      container.appendChild(renderer.domElement);

      camera.position.z = 30;

      // Mouse tracking
      const mouse = { x: 0, y: 0 };
      const targetMouse = { x: 0, y: 0 };

      // Create floating particles
      const particleCount = 200;
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);

      const colorPalette = [
        new THREE.Color(0x6366f1), // Indigo
        new THREE.Color(0x06b6d4), // Cyan
        new THREE.Color(0xa855f7), // Purple
        new THREE.Color(0x3b82f6), // Blue
        new THREE.Color(0x818cf8), // Light indigo
      ];

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        sizes[i] = Math.random() * 3 + 1;
      }

      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      // Custom particle material with glow effect
      const particleMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      const particles = new THREE.Points(particlesGeometry, particleMaterial);
      scene.add(particles);

      // Create floating geometric shapes
      const geometries: THREE.Mesh[] = [];

      // Icosahedrons
      for (let i = 0; i < 8; i++) {
        const size = Math.random() * 1.5 + 0.5;
        const geo = new THREE.IcosahedronGeometry(size, 0);
        const mat = new THREE.MeshPhongMaterial({
          color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
          transparent: true,
          opacity: 0.15,
          wireframe: true,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 30
        );
        mesh.userData = {
          rotSpeed: { x: Math.random() * 0.01, y: Math.random() * 0.01, z: Math.random() * 0.005 },
          floatSpeed: Math.random() * 0.5 + 0.2,
          floatOffset: Math.random() * Math.PI * 2,
          originalY: mesh.position.y,
        };
        scene.add(mesh);
        geometries.push(mesh);
      }

      // Torus knots
      for (let i = 0; i < 4; i++) {
        const geo = new THREE.TorusKnotGeometry(1 + Math.random(), 0.3, 64, 8);
        const mat = new THREE.MeshPhongMaterial({
          color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
          transparent: true,
          opacity: 0.1,
          wireframe: true,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 20 - 10
        );
        mesh.userData = {
          rotSpeed: { x: Math.random() * 0.005, y: Math.random() * 0.008, z: Math.random() * 0.003 },
          floatSpeed: Math.random() * 0.3 + 0.1,
          floatOffset: Math.random() * Math.PI * 2,
          originalY: mesh.position.y,
        };
        scene.add(mesh);
        geometries.push(mesh);
      }

      // Connection lines between particles
      const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending,
      });

      const linesGroup = new THREE.Group();
      scene.add(linesGroup);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x404080, 0.5);
      scene.add(ambientLight);

      const pointLight1 = new THREE.PointLight(0x6366f1, 2, 100);
      pointLight1.position.set(20, 20, 20);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0x06b6d4, 2, 100);
      pointLight2.position.set(-20, -20, 20);
      scene.add(pointLight2);

      const pointLight3 = new THREE.PointLight(0xa855f7, 1.5, 80);
      pointLight3.position.set(0, 30, -10);
      scene.add(pointLight3);

      // Animation
      const clock = new THREE.Clock();

      function updateLines() {
        while (linesGroup.children.length) {
          const child = linesGroup.children[0];
          linesGroup.remove(child);
          if ((child as any).geometry) (child as any).geometry.dispose();
        }

        const posArray = particlesGeometry.attributes.position.array as Float32Array;
        const threshold = 12;

        for (let i = 0; i < Math.min(particleCount, 50); i++) {
          for (let j = i + 1; j < Math.min(particleCount, 50); j++) {
            const dx = posArray[i * 3] - posArray[j * 3];
            const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
            const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < threshold) {
              const lineGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2]),
                new THREE.Vector3(posArray[j * 3], posArray[j * 3 + 1], posArray[j * 3 + 2]),
              ]);
              const line = new THREE.Line(lineGeo, linesMaterial);
              linesGroup.add(line);
            }
          }
        }
      }

      let frameCount = 0;

      function animate() {
        animationFrameId = requestAnimationFrame(animate);

        const elapsed = clock.getElapsedTime();
        frameCount++;

        targetMouse.x += (mouse.x - targetMouse.x) * 0.05;
        targetMouse.y += (mouse.y - targetMouse.y) * 0.05;

        particles.rotation.y = elapsed * 0.05 + targetMouse.x * 0.3;
        particles.rotation.x = elapsed * 0.03 + targetMouse.y * 0.2;

        const posArray = particlesGeometry.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          posArray[i * 3 + 1] += Math.sin(elapsed * 0.5 + i * 0.1) * 0.01;
        }
        particlesGeometry.attributes.position.needsUpdate = true;

        for (const mesh of geometries) {
          mesh.rotation.x += mesh.userData.rotSpeed.x;
          mesh.rotation.y += mesh.userData.rotSpeed.y;
          mesh.rotation.z += mesh.userData.rotSpeed.z;
          mesh.position.y = mesh.userData.originalY + Math.sin(elapsed * mesh.userData.floatSpeed + mesh.userData.floatOffset) * 2;
        }

        pointLight1.position.x = Math.sin(elapsed * 0.3) * 25;
        pointLight1.position.y = Math.cos(elapsed * 0.4) * 25;
        pointLight2.position.x = Math.cos(elapsed * 0.3) * 25;
        pointLight2.position.y = Math.sin(elapsed * 0.2) * 25;

        if (frameCount % 30 === 0) {
          updateLines();
        }

        if (renderer) renderer.render(scene, camera);
      }

      animate();

      function handleMouseMove(event: MouseEvent) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      }

      function handleResize() {
        if (!renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (renderer) {
          renderer.dispose();
          if (container && renderer.domElement && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        }
      };
    } catch (e) {
      console.warn('WebGL not supported or failed to initialize:', e);
    }
  }, []);

  return <div ref={containerRef} className="three-canvas-container" />;
}
