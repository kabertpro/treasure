import * as THREE from 'three';
import { WorldConfig } from '../types/game';
import { VoxelTextures } from './proceduralTextures';

export interface GeneratedWorld {
  terrainGroup: THREE.Group;
  collisionBoxes: THREE.Box3[];
  waterOrLavaMesh?: THREE.Mesh;
  spawnPoint: THREE.Vector3;
  bossSpawnPoint: THREE.Vector3;
  enemySpawns: { pos: THREE.Vector3; type: 'pirate' | 'robot' | 'shadow' | 'knight' | 'golem' }[];
  vehicleSpawns: { pos: THREE.Vector3; type: 'sports' | 'buggy' | 'bike' }[];
  treasureSpawns: { pos: THREE.Vector3; type: 'diamond' | 'star' | 'key' | 'chest' }[];
  crateSpawns: THREE.Vector3[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export const WorldGenerator = {
  generate(world: WorldConfig): GeneratedWorld {
    const terrainGroup = new THREE.Group();
    const collisionBoxes: THREE.Box3[] = [];
    const enemySpawns: { pos: THREE.Vector3; type: 'pirate' | 'robot' | 'shadow' | 'knight' | 'golem' }[] = [];
    const vehicleSpawns: { pos: THREE.Vector3; type: 'sports' | 'buggy' | 'bike' }[] = [];
    const treasureSpawns: { pos: THREE.Vector3; type: 'diamond' | 'star' | 'key' | 'chest' }[] = [];
    const crateSpawns: THREE.Vector3[] = [];

    const bounds = { minX: -90, maxX: 90, minZ: -90, maxZ: 90 };
    const spawnPoint = new THREE.Vector3(0, 2, 60);
    const bossSpawnPoint = new THREE.Vector3(0, 2, -60);

    // Reusable Materials
    const grassTop = VoxelTextures.getGrassTop();
    const grassSide = VoxelTextures.getGrassSide();
    const dirtTex = VoxelTextures.getDirt();
    const sandTex = VoxelTextures.getSand();
    const stoneTex = VoxelTextures.getStone();
    const stoneBrickTex = VoxelTextures.getStoneBrick();
    const roadTex = VoxelTextures.getRoad();
    const metalTex = VoxelTextures.getMetalPanel();
    const logSide = VoxelTextures.getLogSide();
    const leavesTex = VoxelTextures.getLeaves();
    const obsidianTex = VoxelTextures.getObsidian();
    const lavaTex = VoxelTextures.getLava();
    const waterTex = VoxelTextures.getWater();

    // 1. Base Terrain Ground Plane
    let primaryGroundMat: THREE.Material;
    if (world.id === 1) {
      primaryGroundMat = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.9 });
    } else if (world.id === 2) {
      primaryGroundMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.8 });
    } else if (world.id === 3) {
      primaryGroundMat = new THREE.MeshStandardMaterial({ map: grassTop, roughness: 0.8 });
    } else if (world.id === 4) {
      primaryGroundMat = new THREE.MeshStandardMaterial({ map: stoneBrickTex, roughness: 0.85 });
    } else {
      primaryGroundMat = new THREE.MeshStandardMaterial({ map: obsidianTex, roughness: 0.9 });
    }

    const groundGeo = new THREE.PlaneGeometry(240, 240, 1, 1);
    const groundMesh = new THREE.Mesh(groundGeo, primaryGroundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    groundMesh.receiveShadow = true;
    terrainGroup.add(groundMesh);

    // Helper to add voxel structure blocks and physics bounding box
    const addVoxelBlock = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
      hasCollision: boolean = true
    ) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y + h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      terrainGroup.add(mesh);

      if (hasCollision) {
        const box = new THREE.Box3();
        box.setFromObject(mesh);
        collisionBoxes.push(box);
      }
      return mesh;
    };

    // Helper to create a voxel tree
    const addVoxelTree = (x: number, z: number, scale: number = 1.0) => {
      const trunkMat = new THREE.MeshStandardMaterial({ map: logSide, roughness: 0.9 });
      const leafMat = new THREE.MeshStandardMaterial({ map: leavesTex, roughness: 0.8 });

      // Trunk
      addVoxelBlock(x, 0, z, 1.2 * scale, 5 * scale, 1.2 * scale, trunkMat, true);

      // Leaves (layered cubes)
      addVoxelBlock(x, 4 * scale, z, 4.5 * scale, 2.5 * scale, 4.5 * scale, leafMat, false);
      addVoxelBlock(x, 6.5 * scale, z, 3 * scale, 2 * scale, 3 * scale, leafMat, false);
    };

    // Natural Perimeter Barriers (Cliffs and Mountains)
    const cliffMat = world.id === 5 
      ? new THREE.MeshStandardMaterial({ map: obsidianTex }) 
      : new THREE.MeshStandardMaterial({ map: stoneTex });

    for (let x = -100; x <= 100; x += 18) {
      addVoxelBlock(x, 0, -96, 18, 16, 12, cliffMat);
      addVoxelBlock(x, 0, 96, 18, 16, 12, cliffMat);
    }
    for (let z = -96; z <= 96; z += 18) {
      addVoxelBlock(-96, 0, z, 12, 16, 18, cliffMat);
      addVoxelBlock(96, 0, z, 12, 16, 18, cliffMat);
    }

    // ==========================================
    // WORLD SPECIFIC LANDMARKS & GEOGRAPHY
    // ==========================================

    if (world.id === 1) {
      // WORLD 1: ISLA DEL TESORO
      // Stepped Sunken Temple / Pyramid at North
      const pyrMat = new THREE.MeshStandardMaterial({ map: stoneBrickTex, roughness: 0.7 });
      for (let lvl = 0; lvl < 5; lvl++) {
        const size = 32 - lvl * 5;
        addVoxelBlock(0, lvl * 2.5, -55, size, 2.5, size, pyrMat);
      }
      // Temple doorway / Boss arena platform
      addVoxelBlock(0, 12.5, -55, 12, 1, 12, pyrMat);

      // Palm trees scattered
      const palmLocs = [
        [-35, 30], [35, 30], [-45, 10], [45, 10],
        [-20, 50], [20, 50], [-50, -20], [50, -20],
        [-30, -40], [30, -40], [-60, 40], [60, 40]
      ];
      palmLocs.forEach(([px, pz]) => addVoxelTree(px, pz, 1.2));

      // Pirate Camp & Ruins
      addVoxelBlock(-25, 0, 15, 8, 4, 10, pyrMat);
      addVoxelBlock(25, 0, 15, 8, 4, 10, pyrMat);

      // Sea water pool in South
      const waterMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 30),
        new THREE.MeshStandardMaterial({ map: waterTex, transparent: true, opacity: 0.8 })
      );
      waterMesh.rotation.x = -Math.PI / 2;
      waterMesh.position.set(0, 0.1, 70);
      terrainGroup.add(waterMesh);

      // Vehicles
      vehicleSpawns.push({ pos: new THREE.Vector3(12, 0, 45), type: 'buggy' });

      // Enemies
      enemySpawns.push(
        { pos: new THREE.Vector3(-15, 0, 35), type: 'pirate' },
        { pos: new THREE.Vector3(15, 0, 35), type: 'pirate' },
        { pos: new THREE.Vector3(-25, 0, 10), type: 'pirate' },
        { pos: new THREE.Vector3(25, 0, 10), type: 'pirate' },
        { pos: new THREE.Vector3(0, 0, -10), type: 'golem' },
        { pos: new THREE.Vector3(-20, 0, -35), type: 'golem' },
        { pos: new THREE.Vector3(20, 0, -35), type: 'golem' }
      );

    } else if (world.id === 2) {
      // WORLD 2: CIUDAD PERDIDA
      // 4 Explorable Voxel Skyscrapers & Highrises
      const buildMat1 = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.5 });
      const buildMat2 = new THREE.MeshStandardMaterial({ map: stoneBrickTex, roughness: 0.7 });

      // Skyscraper 1 (North-West)
      addVoxelBlock(-35, 0, -35, 18, 42, 18, buildMat1);
      // Skyscraper 2 (North-East)
      addVoxelBlock(35, 0, -35, 18, 48, 18, buildMat2);
      // Skyscraper 3 (South-West)
      addVoxelBlock(-40, 0, 25, 20, 36, 20, buildMat2);
      // Skyscraper 4 (South-East)
      addVoxelBlock(40, 0, 25, 20, 38, 20, buildMat1);

      // Elevated Highway Bridge across center
      addVoxelBlock(0, 6, 0, 90, 1.5, 10, buildMat1);
      // Bridge ramps
      addVoxelBlock(-45, 0, 0, 10, 6, 10, buildMat1);
      addVoxelBlock(45, 0, 0, 10, 6, 10, buildMat1);

      // Vehicles (Sports car & Bike ready to drive!)
      vehicleSpawns.push({ pos: new THREE.Vector3(5, 0, 48), type: 'sports' });
      vehicleSpawns.push({ pos: new THREE.Vector3(-8, 0, 48), type: 'bike' });

      // Enemies (Robots & Drones)
      enemySpawns.push(
        { pos: new THREE.Vector3(-15, 0, 30), type: 'robot' },
        { pos: new THREE.Vector3(15, 0, 30), type: 'robot' },
        { pos: new THREE.Vector3(0, 8, 0), type: 'robot' }, // On bridge
        { pos: new THREE.Vector3(-25, 0, -15), type: 'robot' },
        { pos: new THREE.Vector3(25, 0, -15), type: 'robot' },
        { pos: new THREE.Vector3(0, 0, -40), type: 'robot' }
      );

    } else if (world.id === 3) {
      // WORLD 3: BOSQUE MISTERIOSO
      // Giant Redwood Trees and ancient ruins
      for (let x = -70; x <= 70; x += 25) {
        for (let z = -70; z <= 70; z += 25) {
          if (Math.abs(x) > 10 || Math.abs(z) > 15) {
            addVoxelTree(x + (Math.random() * 8 - 4), z + (Math.random() * 8 - 4), 1.5 + Math.random() * 0.8);
          }
        }
      }

      // Stone sanctuary ring in center
      const runeMat = new THREE.MeshStandardMaterial({ map: stoneBrickTex, roughness: 0.6 });
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        const rx = Math.cos(a) * 22;
        const rz = Math.sin(a) * 22;
        addVoxelBlock(rx, 0, rz, 3, 7, 3, runeMat);
      }

      // Vehicle
      vehicleSpawns.push({ pos: new THREE.Vector3(6, 0, 50), type: 'buggy' });

      // Enemies (Shadow monsters & Spectres)
      enemySpawns.push(
        { pos: new THREE.Vector3(-12, 0, 30), type: 'shadow' },
        { pos: new THREE.Vector3(12, 0, 30), type: 'shadow' },
        { pos: new THREE.Vector3(-20, 0, 5), type: 'shadow' },
        { pos: new THREE.Vector3(20, 0, 5), type: 'shadow' },
        { pos: new THREE.Vector3(0, 0, -25), type: 'shadow' },
        { pos: new THREE.Vector3(-15, 0, -45), type: 'shadow' },
        { pos: new THREE.Vector3(15, 0, -45), type: 'shadow' }
      );

    } else if (world.id === 4) {
      // WORLD 4: REINO NOCTURNO
      // Gothic Castle Fortress
      const castleMat = new THREE.MeshStandardMaterial({ map: stoneBrickTex, roughness: 0.8 });

      // Great Castle Wall in North
      addVoxelBlock(0, 0, -45, 60, 14, 6, castleMat);
      // Castle Gate Arch
      addVoxelBlock(-18, 0, -45, 12, 18, 8, castleMat);
      addVoxelBlock(18, 0, -45, 12, 18, 8, castleMat);
      addVoxelBlock(0, 12, -45, 24, 6, 8, castleMat);

      // Towers in 4 corners of central courtyard
      addVoxelBlock(-35, 0, -10, 8, 20, 8, castleMat);
      addVoxelBlock(35, 0, -10, 8, 20, 8, castleMat);
      addVoxelBlock(-35, 0, 35, 8, 16, 8, castleMat);
      addVoxelBlock(35, 0, 35, 8, 16, 8, castleMat);

      // Graveyard pillars
      for (let i = -2; i <= 2; i++) {
        addVoxelBlock(i * 10, 0, 20, 1.5, 3.5, 0.8, castleMat);
      }

      vehicleSpawns.push({ pos: new THREE.Vector3(-6, 0, 50), type: 'sports' });

      enemySpawns.push(
        { pos: new THREE.Vector3(-15, 0, 35), type: 'knight' },
        { pos: new THREE.Vector3(15, 0, 35), type: 'knight' },
        { pos: new THREE.Vector3(-20, 0, 10), type: 'knight' },
        { pos: new THREE.Vector3(20, 0, 10), type: 'knight' },
        { pos: new THREE.Vector3(0, 0, -20), type: 'knight' },
        { pos: new THREE.Vector3(-10, 0, -50), type: 'knight' },
        { pos: new THREE.Vector3(10, 0, -50), type: 'knight' }
      );

    } else {
      // WORLD 5: FORTALEZA DEL TESORO
      // Obsidian Citadel & Magma Rivers
      const obsMat = new THREE.MeshStandardMaterial({ map: obsidianTex, roughness: 0.8 });
      const lavaMat = new THREE.MeshBasicMaterial({ map: lavaTex });

      // Lava Canals (East and West)
      const lavaEast = new THREE.Mesh(new THREE.PlaneGeometry(20, 140), lavaMat);
      lavaEast.rotation.x = -Math.PI / 2;
      lavaEast.position.set(40, 0.1, 0);
      terrainGroup.add(lavaEast);

      const lavaWest = new THREE.Mesh(new THREE.PlaneGeometry(20, 140), lavaMat);
      lavaWest.rotation.x = -Math.PI / 2;
      lavaWest.position.set(-40, 0.1, 0);
      terrainGroup.add(lavaWest);

      // Colossal Throne Citadel at Boss Point
      addVoxelBlock(0, 0, -55, 45, 20, 25, obsMat);
      addVoxelBlock(0, 20, -55, 30, 10, 18, obsMat);

      // Pillars of Fire
      [-25, 25].forEach((px) => {
        addVoxelBlock(px, 0, -30, 4, 15, 4, obsMat);
        addVoxelBlock(px, 0, 10, 4, 12, 4, obsMat);
      });

      // Drawbridge over magma
      addVoxelBlock(0, 0, 0, 14, 2, 40, obsMat);

      vehicleSpawns.push({ pos: new THREE.Vector3(0, 0, 45), type: 'sports' });

      enemySpawns.push(
        { pos: new THREE.Vector3(-12, 0, 30), type: 'golem' },
        { pos: new THREE.Vector3(12, 0, 30), type: 'golem' },
        { pos: new THREE.Vector3(0, 2, 10), type: 'golem' },
        { pos: new THREE.Vector3(-15, 0, -15), type: 'golem' },
        { pos: new THREE.Vector3(15, 0, -15), type: 'golem' },
        { pos: new THREE.Vector3(0, 0, -35), type: 'golem' }
      );
    }

    // ==========================================
    // TREASURES & BREAKABLE CRATES DISTRIBUTION
    // ==========================================
    // Collectibles distributed across the map
    treasureSpawns.push(
      // Diamonds
      { pos: new THREE.Vector3(-18, 1, 40), type: 'diamond' },
      { pos: new THREE.Vector3(18, 1, 40), type: 'diamond' },
      { pos: new THREE.Vector3(-30, 1, 0), type: 'diamond' },
      { pos: new THREE.Vector3(30, 1, 0), type: 'diamond' },
      { pos: new THREE.Vector3(0, 1, -15), type: 'diamond' },
      // Stars
      { pos: new THREE.Vector3(-10, 1, 15), type: 'star' },
      { pos: new THREE.Vector3(10, 1, 15), type: 'star' },
      // Key
      { pos: new THREE.Vector3(0, 1, 5), type: 'key' },
      // Question Chests (Triggers educational trivia!)
      { pos: new THREE.Vector3(-12, 0.5, 25), type: 'chest' },
      { pos: new THREE.Vector3(12, 0.5, 25), type: 'chest' },
      { pos: new THREE.Vector3(0, 0.5, -45), type: 'chest' }
    );

    // Breakable crates with ammo and bonus points
    crateSpawns.push(
      new THREE.Vector3(-8, 0, 35),
      new THREE.Vector3(8, 0, 35),
      new THREE.Vector3(-18, 0, 18),
      new THREE.Vector3(18, 0, 18),
      new THREE.Vector3(-5, 0, -5),
      new THREE.Vector3(5, 0, -5),
      new THREE.Vector3(-15, 0, -30),
      new THREE.Vector3(15, 0, -30)
    );

    return {
      terrainGroup,
      collisionBoxes,
      spawnPoint,
      bossSpawnPoint,
      enemySpawns,
      vehicleSpawns,
      treasureSpawns,
      crateSpawns,
      bounds,
    };
  },
};
