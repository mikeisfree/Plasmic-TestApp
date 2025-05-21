import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      75, // fov
      mountRef.current.clientWidth / mountRef.current.clientHeight, // aspect
      0.1, // near
      1000 // far
    );
    camera.position.z = 7; 

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true, 
      antialias: true,
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.style.pointerEvents = 'none'; // Add this line
    mountRef.current.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1); // Coming from top-right-front
    scene.add(directionalLight);

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Define Materials
    const darkBlueMaterial = new THREE.MeshPhongMaterial({ color: 0x0000CD, side: THREE.DoubleSide }); // MediumBlue
    const whiteMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
    const yellowMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFF00, side: THREE.DoubleSide });

    // Create Butterfly function
    function createButterfly(variationIndex: number): THREE.Group {
      const butterfly = new THREE.Group();

      // Body
      const bodyGeom = new THREE.CapsuleGeometry(0.05, 0.25, 4, 8); // Smaller body
      const body = new THREE.Mesh(bodyGeom, darkBlueMaterial);
      body.rotation.z = Math.PI / 2; // Orient it horizontally
      butterfly.add(body);

      // Wing dimensions
      const wingWidth = 0.4;
      const wingHeight = 0.5;

      // Base material
      let wingMaterial: THREE.MeshPhongMaterial; // Defined to be explicitly typed
      // Variation examples (can be expanded)
      if (variationIndex === 1) {
         wingMaterial = new THREE.MeshPhongMaterial({ color: 0x4169E1, side: THREE.DoubleSide }); // RoyalBlue
      } else if (variationIndex === 2) {
         wingMaterial = new THREE.MeshPhongMaterial({ color: 0x00008B, side: THREE.DoubleSide }); // DarkerBlue
      } else {
         wingMaterial = new THREE.MeshPhongMaterial({ color: 0x0000CD, side: THREE.DoubleSide }); // Default to MediumBlue like darkBlueMaterial but new instance
      }


      // Left Wing
      const leftWingGeom = new THREE.PlaneGeometry(wingWidth, wingHeight);
      const leftWing = new THREE.Mesh(leftWingGeom, wingMaterial);
      leftWing.position.set(0, wingHeight / 2, 0); 
      
      const leftWingGroup = new THREE.Group();
      leftWingGroup.add(leftWing);
      leftWingGroup.position.set(0.06, 0, 0.05); 
      butterfly.add(leftWingGroup);

      // Right Wing
      const rightWingGeom = new THREE.PlaneGeometry(wingWidth, wingHeight);
      const rightWing = new THREE.Mesh(rightWingGeom, wingMaterial);
      rightWing.position.set(0, wingHeight / 2, 0); 

      const rightWingGroup = new THREE.Group();
      rightWingGroup.add(rightWing);
      rightWingGroup.position.set(-0.06, 0, 0.05); 
      rightWingGroup.rotation.y = Math.PI; 
      butterfly.add(rightWingGroup);
      
      // Accents
      const accentMaterial = (variationIndex % 2 === 0) ? whiteMaterial : yellowMaterial;
      const accentGeom = new THREE.SphereGeometry(0.03, 6, 6);
      
      const leftAccent = new THREE.Mesh(accentGeom, accentMaterial);
      leftAccent.position.set(0, wingHeight * 0.25, 0.01); 
      leftWing.add(leftAccent); 

      const rightAccent = new THREE.Mesh(accentGeom, accentMaterial);
      rightAccent.position.set(0, wingHeight * 0.25, 0.01); 
      rightWing.add(rightAccent); 


      butterfly.userData.wings = { left: leftWingGroup, right: rightWingGroup };
      butterfly.userData.flapSpeed = 0.8 + Math.random() * 0.4;
      butterfly.userData.flapOffset = Math.random() * Math.PI * 2;
      // Enhanced userData for advanced animation
      butterfly.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02);
      butterfly.userData.targetPosition = null;
      butterfly.userData.isResting = false;
      butterfly.userData.restingTime = 0;
      butterfly.userData.timeUntilNextAction = Math.random() * 5 + 5; // Initial flight time

      const scale = 0.8 + variationIndex * 0.2;
      butterfly.scale.set(scale, scale, scale);

      return butterfly;
    }

    const butterfliesRef = useRef<THREE.Group[]>([]);
    butterfliesRef.current = []; 

    for (let i = 0; i < 3; i++) {
      const butterfly = createButterfly(i);
      butterfly.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
      // Initial rotation is handled by movement logic now
      scene.add(butterfly);
      butterfliesRef.current.push(butterfly);
    }
    
    // Define Flight Boundaries
    const flightZone = { x: [-4, 4], y: [-3, 3], z: [-3, 3] }; // Adjust based on camera and desired area

    // Placeholder card corner positions (world coordinates)
    // These would ideally be derived from the actual bento card elements' positions and sizes.
    const cardCorners = [
      new THREE.Vector3(-2, 1, 0), new THREE.Vector3(2, 1, 0),
      new THREE.Vector3(-2, -1.5, 0), new THREE.Vector3(2, -1.5, 0),
    ];

    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();

      butterfliesRef.current.forEach(butterfly => {
        // Wing Flapping
        const wings = butterfly.userData.wings;
        const flapSpeed = butterfly.userData.flapSpeed;
        const flapOffset = butterfly.userData.flapOffset;
        const flapAngle = Math.sin(Date.now() * 0.008 * flapSpeed + flapOffset) * (Math.PI / 3);
        wings.left.rotation.z = flapAngle;
        wings.right.rotation.z = flapAngle;

        // Action Timer
        butterfly.userData.timeUntilNextAction -= deltaTime;

        // Resting Logic
        if (butterfly.userData.isResting) {
          butterfly.userData.restingTime -= deltaTime;
          if (butterfly.userData.restingTime <= 0) {
            butterfly.userData.isResting = false;
            butterfly.userData.velocity.set((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02);
            butterfly.userData.targetPosition = null; 
            butterfly.userData.timeUntilNextAction = Math.random() * 10 + 10; 
          }
          butterfly.rotation.y += Math.sin(Date.now() * 0.0005) * 0.005; // Gentle bobbing
          renderer.render(scene, camera); // Ensure render is called
          return; // Skip movement if resting
        }

        // Landing Decision
        if (butterfly.userData.timeUntilNextAction <= 0 && !butterfly.userData.isResting) {
          if (Math.random() < 0.3) { // 30% chance to try and land
            const randomCorner = cardCorners[Math.floor(Math.random() * cardCorners.length)];
            butterfly.userData.targetPosition = randomCorner.clone();
            butterfly.userData.timeUntilNextAction = Math.random() * 5 + 8; // Time to reach and rest
          } else {
            butterfly.userData.targetPosition = null;
            butterfly.userData.velocity.set((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02);
            butterfly.userData.timeUntilNextAction = Math.random() * 8 + 8; 
          }
        }

        // Movement Logic
        if (butterfly.userData.targetPosition) {
          const direction = new THREE.Vector3().subVectors(butterfly.userData.targetPosition, butterfly.position).normalize();
          butterfly.userData.velocity.lerp(direction.multiplyScalar(0.02), 0.05); 

          if (butterfly.position.distanceTo(butterfly.userData.targetPosition) < 0.15) {
            butterfly.userData.isResting = true;
            butterfly.userData.restingTime = Math.random() * 3 + 4;
            butterfly.userData.velocity.set(0, 0, 0);
            butterfly.userData.targetPosition = null;
          }
        }
        
        butterfly.position.add(butterfly.userData.velocity.clone().multiplyScalar(60 * deltaTime));

        if (!butterfly.userData.isResting && butterfly.userData.velocity.lengthSq() > 0.0001) {
          const targetQuaternion = new THREE.Quaternion();
          // Create a temporary lookAt position in the direction of velocity
          const lookAtPosition = new THREE.Vector3().addVectors(butterfly.position, butterfly.userData.velocity);
          // Use a temporary matrix to avoid altering butterfly's matrix directly for lookAt
          const tempMatrix = new THREE.Matrix4().lookAt(butterfly.position, lookAtPosition, butterfly.up);
          targetQuaternion.setFromRotationMatrix(tempMatrix);
          butterfly.quaternion.slerp(targetQuaternion, 0.05);
        }

        // Boundary Bouncing
        if (butterfly.position.x < flightZone.x[0] || butterfly.position.x > flightZone.x[1]) {
          butterfly.userData.velocity.x *= -1;
          butterfly.position.x = THREE.MathUtils.clamp(butterfly.position.x, flightZone.x[0], flightZone.x[1]);
          if (butterfly.userData.targetPosition) butterfly.userData.targetPosition = null; 
        }
        if (butterfly.position.y < flightZone.y[0] || butterfly.position.y > flightZone.y[1]) {
          butterfly.userData.velocity.y *= -1;
          butterfly.position.y = THREE.MathUtils.clamp(butterfly.position.y, flightZone.y[0], flightZone.y[1]);
          if (butterfly.userData.targetPosition) butterfly.userData.targetPosition = null;
        }
        if (butterfly.position.z < flightZone.z[0] || butterfly.position.z > flightZone.z[1]) {
          butterfly.userData.velocity.z *= -1;
          butterfly.position.z = THREE.MathUtils.clamp(butterfly.position.z, flightZone.z[0], flightZone.z[1]);
          if (butterfly.userData.targetPosition) butterfly.userData.targetPosition = null;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      butterfliesRef.current.forEach(butterfly => {
          scene.remove(butterfly);
          butterfly.traverse(object => {
              if (object instanceof THREE.Mesh) {
                  object.geometry.dispose();
                  if (Array.isArray(object.material)) {
                      object.material.forEach(material => material.dispose());
                  } else {
                      // Check if material is one of the shared ones before disposing
                      if (object.material !== darkBlueMaterial && object.material !== whiteMaterial && object.material !== yellowMaterial) {
                        object.material.dispose();
                      }
                  }
              }
          });
      });
      // Dispose shared materials if they were defined in useEffect
      darkBlueMaterial.dispose();
      whiteMaterial.dispose();
      yellowMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default ThreeScene;
