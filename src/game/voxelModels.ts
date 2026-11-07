import * as THREE from 'three';
import { PlayerCustomization } from '../types/game';
import { VoxelTextures } from './proceduralTextures';

// Shared geometries for efficiency
const boxGeo = new THREE.BoxGeometry(1, 1, 1);

export interface AnimatedCharacterMesh extends THREE.Group {
  head: THREE.Group;
  torso: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weapon: THREE.Group;
  updateAnimation: (time: number, isMoving: boolean, isAttacking: boolean, isDead?: boolean) => void;
}

export const VoxelModels = {
  /**
   * Creates a fully articulated Voxel Player Character (Minecraft Steve/Alex style)
   */
  createPlayer(custom: PlayerCustomization): AnimatedCharacterMesh {
    const group = new THREE.Group() as unknown as AnimatedCharacterMesh;

    // Materials based on customization
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(custom.skinColor),
      roughness: 0.8,
      metalness: 0.1,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(custom.hairColor),
      roughness: 0.85,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(custom.shirtColor),
      roughness: 0.7,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(custom.pantsColor),
      roughness: 0.7,
    });
    const shoesMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(custom.shoesColor),
      roughness: 0.9,
    });

    // 1. Torso (0.8 wide, 1.1 high, 0.45 deep)
    const torsoGeo = new THREE.BoxGeometry(0.8, 1.1, 0.45);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);
    group.torso = torso;

    // 2. Head Group (pivots above torso)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.65, 0); // relative to torso
    torso.add(headGroup);
    group.head = headGroup;

    // Head base (0.75 cube)
    const headBase = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), skinMat);
    headBase.position.y = 0.375;
    headBase.castShadow = true;
    headGroup.add(headBase);

    // Hair / Cap
    const hairGeo = new THREE.BoxGeometry(0.8, 0.35, 0.8);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.65;
    hair.castShadow = true;
    headGroup.add(hair);

    if (custom.hairStyle === 'cap') {
      const visorGeo = new THREE.BoxGeometry(0.8, 0.08, 0.3);
      const visor = new THREE.Mesh(visorGeo, hairMat);
      visor.position.set(0, 0.52, 0.5);
      headGroup.add(visor);
    } else if (custom.hairStyle === 'helmet') {
      const helmetRim = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.15, 0.84), hairMat);
      helmetRim.position.y = 0.4;
      headGroup.add(helmetRim);
    }

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.02), eyeWhiteMat);
    eyeL.position.set(-0.2, 0.38, 0.38);
    const pupilL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.03), eyeMat);
    pupilL.position.set(-0.2, 0.38, 0.38);
    headGroup.add(eyeL, pupilL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.02), eyeWhiteMat);
    eyeR.position.set(0.2, 0.38, 0.38);
    const pupilR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.03), eyeMat);
    pupilR.position.set(0.2, 0.38, 0.38);
    headGroup.add(eyeR, pupilR);

    // Accessory
    if (custom.accessory === 'glasses') {
      const glassesMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
      const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.05), glassesMat);
      glasses.position.set(0, 0.38, 0.4);
      headGroup.add(glasses);
    } else if (custom.accessory === 'bandana') {
      const bandanaMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
      const bandana = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.16, 0.82), bandanaMat);
      bandana.position.set(0, 0.45, 0);
      headGroup.add(bandana);
    } else if (custom.accessory === 'cape') {
      const capeMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });
      const cape = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.2, 0.06), capeMat);
      cape.position.set(0, -0.3, -0.28);
      cape.rotation.x = 0.1;
      torso.add(cape);
    }

    // 3. Left Arm (pivots at shoulder)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.55, 0.45, 0);
    torso.add(leftArmGroup);
    group.leftArm = leftArmGroup;

    const armUpperL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.35), shirtMat);
    armUpperL.position.y = -0.25;
    armUpperL.castShadow = true;
    leftArmGroup.add(armUpperL);

    const armLowerL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.33), skinMat);
    armLowerL.position.y = -0.7;
    armLowerL.castShadow = true;
    leftArmGroup.add(armLowerL);

    // 4. Right Arm (Weapon Hand)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.55, 0.45, 0);
    torso.add(rightArmGroup);
    group.rightArm = rightArmGroup;

    const armUpperR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.35), shirtMat);
    armUpperR.position.y = -0.25;
    armUpperR.castShadow = true;
    rightArmGroup.add(armUpperR);

    const armLowerR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.33), skinMat);
    armLowerR.position.y = -0.7;
    armLowerR.castShadow = true;
    rightArmGroup.add(armLowerR);

    // Laser Blaster Weapon
    const weaponGroup = new THREE.Group();
    weaponGroup.position.set(0, -0.85, 0.25);
    const gunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.2, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
    );
    const gunBarrel = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.2 })
    );
    gunBarrel.position.z = 0.32;
    const gunCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.08, 0.16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    gunCore.position.y = 0.08;
    weaponGroup.add(gunBody, gunBarrel, gunCore);
    rightArmGroup.add(weaponGroup);
    group.weapon = weaponGroup;

    // 5. Left Leg (pivots at hip)
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.22, -0.55, 0);
    torso.add(leftLegGroup);
    group.leftLeg = leftLegGroup;

    const legUpperL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.38), pantsMat);
    legUpperL.position.y = -0.25;
    legUpperL.castShadow = true;
    leftLegGroup.add(legUpperL);

    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.44), shoesMat);
    shoeL.position.set(0, -0.65, 0.03);
    shoeL.castShadow = true;
    leftLegGroup.add(shoeL);

    // 6. Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.22, -0.55, 0);
    torso.add(rightLegGroup);
    group.rightLeg = rightLegGroup;

    const legUpperR = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.38), pantsMat);
    legUpperR.position.y = -0.25;
    legUpperR.castShadow = true;
    rightLegGroup.add(legUpperR);

    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.44), shoesMat);
    shoeR.position.set(0, -0.65, 0.03);
    shoeR.castShadow = true;
    rightLegGroup.add(shoeR);

    // Animation runner
    group.updateAnimation = (time: number, isMoving: boolean, isAttacking: boolean, isDead?: boolean) => {
      if (isDead) {
        group.rotation.x = Math.PI / 2;
        group.position.y = 0.2;
        return;
      }

      if (isMoving) {
        const swing = Math.sin(time * 10) * 0.65;
        leftArmGroup.rotation.x = swing;
        rightArmGroup.rotation.x = isAttacking ? -Math.PI / 3 : -swing;
        leftLegGroup.rotation.x = -swing;
        rightLegGroup.rotation.x = swing;
        torso.position.y = 1.35 + Math.abs(Math.sin(time * 10)) * 0.08;
      } else {
        // Idle breathing
        const breathe = Math.sin(time * 2.5) * 0.04;
        leftArmGroup.rotation.x = breathe;
        rightArmGroup.rotation.x = isAttacking ? -Math.PI / 3 : -breathe;
        leftLegGroup.rotation.x = 0;
        rightLegGroup.rotation.x = 0;
        torso.position.y = 1.35 + breathe * 0.3;
      }

      if (isAttacking) {
        rightArmGroup.rotation.x = -Math.PI / 2.6 + Math.sin(time * 30) * 0.1;
      }
    };

    return group;
  },

  /**
   * Enemies for the 5 Worlds
   */
  createEnemy(type: 'pirate' | 'robot' | 'shadow' | 'knight' | 'golem'): AnimatedCharacterMesh {
    const enemyGroup = new THREE.Group() as unknown as AnimatedCharacterMesh;

    let mainColor = 0xb91c1c;
    let secColor = 0x1e293b;
    let eyeColor = 0xfacc15;
    let scale = 1.0;

    if (type === 'pirate') {
      mainColor = 0x991b1b;
      secColor = 0xd97706;
      eyeColor = 0xffffff;
    } else if (type === 'robot') {
      mainColor = 0x475569;
      secColor = 0x0284c7;
      eyeColor = 0xef4444;
    } else if (type === 'shadow') {
      mainColor = 0x1e1b4b;
      secColor = 0x6b21a8;
      eyeColor = 0xc084fc;
    } else if (type === 'knight') {
      mainColor = 0x334155;
      secColor = 0x94a3b8;
      eyeColor = 0xdc2626;
      scale = 1.15;
    } else if (type === 'golem') {
      mainColor = 0x78350f;
      secColor = 0xea580c;
      eyeColor = 0xf97316;
      scale = 1.3;
    }

    const mat1 = new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.8 });
    const mat2 = new THREE.MeshStandardMaterial({ color: secColor, roughness: 0.6 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85 * scale, 1.1 * scale, 0.5 * scale), mat1);
    torso.position.y = 1.35 * scale;
    torso.castShadow = true;
    enemyGroup.add(torso);
    enemyGroup.torso = torso;

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.65 * scale, 0);
    torso.add(headGroup);
    enemyGroup.head = headGroup;

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.75 * scale, 0.75 * scale, 0.75 * scale), mat2);
    headMesh.position.y = 0.38 * scale;
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Glowing Eyes
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.12 * scale, 0.1 * scale, 0.05), eyeMat);
    eye1.position.set(-0.2 * scale, 0.4 * scale, 0.38 * scale);
    const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.12 * scale, 0.1 * scale, 0.05), eyeMat);
    eye2.position.set(0.2 * scale, 0.4 * scale, 0.38 * scale);
    headGroup.add(eye1, eye2);

    // Left Arm
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.55 * scale, 0.45 * scale, 0);
    torso.add(leftArm);
    const armMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.3 * scale, 1.0 * scale, 0.35 * scale), mat1);
    armMeshL.position.y = -0.5 * scale;
    armMeshL.castShadow = true;
    leftArm.add(armMeshL);
    enemyGroup.leftArm = leftArm;

    // Right Arm (Blade/Claw)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.55 * scale, 0.45 * scale, 0);
    torso.add(rightArm);
    const armMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.3 * scale, 1.0 * scale, 0.35 * scale), mat1);
    armMeshR.position.y = -0.5 * scale;
    armMeshR.castShadow = true;
    rightArm.add(armMeshR);
    enemyGroup.rightArm = rightArm;

    // Claw/Weapon
    const claw = new THREE.Mesh(
      new THREE.BoxGeometry(0.15 * scale, 0.4 * scale, 0.15 * scale),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 })
    );
    claw.position.set(0, -1.0 * scale, 0.15 * scale);
    rightArm.add(claw);
    enemyGroup.weapon = claw as unknown as THREE.Group;

    // Legs
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.24 * scale, -0.55 * scale, 0);
    torso.add(leftLeg);
    const legMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.35 * scale, 0.9 * scale, 0.38 * scale), mat2);
    legMeshL.position.y = -0.45 * scale;
    legMeshL.castShadow = true;
    leftLeg.add(legMeshL);
    enemyGroup.leftLeg = leftLeg;

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.24 * scale, -0.55 * scale, 0);
    torso.add(rightLeg);
    const legMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.35 * scale, 0.9 * scale, 0.38 * scale), mat2);
    legMeshR.position.y = -0.45 * scale;
    legMeshR.castShadow = true;
    rightLeg.add(legMeshR);
    enemyGroup.rightLeg = rightLeg;

    enemyGroup.updateAnimation = (time: number, isMoving: boolean, isAttacking: boolean, isDead?: boolean) => {
      if (isDead) {
        enemyGroup.scale.multiplyScalar(0.94);
        enemyGroup.rotation.y += 0.2;
        return;
      }
      if (isMoving) {
        const swing = Math.sin(time * 8) * 0.55;
        leftArm.rotation.x = swing;
        rightArm.rotation.x = isAttacking ? -Math.PI / 2 : -swing;
        leftLeg.rotation.x = -swing;
        rightLeg.rotation.x = swing;
      } else {
        leftArm.rotation.x = Math.sin(time * 2) * 0.05;
        rightArm.rotation.x = isAttacking ? -Math.PI / 2 : -Math.sin(time * 2) * 0.05;
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
      }
      if (isAttacking) {
        rightArm.rotation.x = -Math.PI / 2.2 + Math.sin(time * 20) * 0.3;
      }
    };

    return enemyGroup;
  },

  /**
   * 5 Grand Bosses
   */
  createBoss(type: 'kraken' | 'titan' | 'malgor' | 'noctar' | 'dragon'): THREE.Group {
    const bossGroup = new THREE.Group();

    if (type === 'kraken') {
      // Kraken: Giant cubic oceanic abomination with 4 massive animated tentacles
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.6 });
      const tentacleMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

      const head = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4.0, 4.5), bodyMat);
      head.position.y = 4.0;
      head.castShadow = true;
      bossGroup.add(head);

      // Huge Cyclopean eye
      const eye = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.4), eyeMat);
      eye.position.set(0, 4.2, 2.3);
      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.5), new THREE.MeshBasicMaterial({ color: 0x000000 }));
      pupil.position.set(0, 4.2, 2.35);
      bossGroup.add(eye, pupil);

      // 4 Giant articulated tentacles
      const tentacles: THREE.Group[] = [];
      const offsets = [
        [-2.5, -2.5],
        [2.5, -2.5],
        [-2.5, 2.5],
        [2.5, 2.5],
      ];

      offsets.forEach(([ox, oz], i) => {
        const tentacleRoot = new THREE.Group();
        tentacleRoot.position.set(ox, 1.5, oz);
        for (let seg = 0; seg < 4; seg++) {
          const segMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2 - seg * 0.2, 1.8, 1.2 - seg * 0.2), tentacleMat);
          segMesh.position.y = seg * 1.6;
          segMesh.castShadow = true;
          tentacleRoot.add(segMesh);
        }
        bossGroup.add(tentacleRoot);
        tentacles.push(tentacleRoot);
      });

      bossGroup.userData = {
        tentacles,
        animate: (t: number) => {
          head.position.y = 4.0 + Math.sin(t * 2) * 0.3;
          tentacles.forEach((tent, idx) => {
            tent.rotation.x = Math.sin(t * 3 + idx * 1.2) * 0.4;
            tent.rotation.z = Math.cos(t * 3 + idx * 1.2) * 0.4;
          });
        },
      };
    } else if (type === 'titan') {
      // Titán X-9: Colossal Cyber Robot
      const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
      const reactorMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

      // Core Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.2, 2.4), metalMat);
      torso.position.y = 5.5;
      torso.castShadow = true;
      bossGroup.add(torso);

      // Reactor Chest
      const reactor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.4), reactorMat);
      reactor.position.set(0, 5.8, 1.25);
      bossGroup.add(reactor);

      // Giant Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.8, 2.0), goldMat);
      head.position.set(0, 8.2, 0);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.2), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      visor.position.set(0, 8.2, 1.05);
      bossGroup.add(head, visor);

      // Colossal Cannons (Arms)
      const armL = new THREE.Group();
      armL.position.set(-2.6, 6.5, 0);
      const cannonL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.0, 1.4), metalMat);
      cannonL.position.y = -1.8;
      armL.add(cannonL);
      bossGroup.add(armL);

      const armR = new THREE.Group();
      armR.position.set(2.6, 6.5, 0);
      const cannonR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.0, 1.4), metalMat);
      cannonR.position.y = -1.8;
      armR.add(cannonR);
      bossGroup.add(armR);

      // Heavy Legs
      const legL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.5, 1.8), metalMat);
      legL.position.set(-1.2, 2.25, 0);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.5, 1.8), metalMat);
      legR.position.set(1.2, 2.25, 0);
      bossGroup.add(legL, legR);

      bossGroup.userData = {
        animate: (t: number) => {
          armL.rotation.x = Math.sin(t * 2) * 0.3;
          armR.rotation.x = -Math.sin(t * 2) * 0.3;
        },
      };
    } else if (type === 'malgor') {
      // Malgor: Shadow Demon Lord with horns and void aura
      const shadowMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
      const purpleMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.5 });
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });

      const torso = new THREE.Mesh(new THREE.BoxGeometry(3.0, 4.5, 2.0), shadowMat);
      torso.position.y = 5.2;
      bossGroup.add(torso);

      const head = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 2.0), purpleMat);
      head.position.set(0, 8.0, 0);
      bossGroup.add(head);

      // Massive Horns
      const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.5), glowMat);
      hornL.position.set(-1.2, 9.4, 0);
      hornL.rotation.z = -0.3;
      const hornR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.5), glowMat);
      hornR.position.set(1.2, 9.4, 0);
      hornR.rotation.z = 0.3;
      bossGroup.add(hornL, hornR);

      // Void Greatsword
      const sword = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.0, 0.8), glowMat);
      sword.position.set(2.2, 5.0, 0.8);
      bossGroup.add(sword);

      bossGroup.userData = {
        animate: (t: number) => {
          bossGroup.position.y = Math.sin(t * 2.5) * 0.35;
          sword.rotation.x = Math.sin(t * 3) * 0.2;
        },
      };
    } else if (type === 'noctar') {
      // Noctar: Dark King with obsidian crown and gothic mantle
      const armorMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.7, roughness: 0.3 });
      const capeMat = new THREE.MeshStandardMaterial({ color: 0x4c0519, roughness: 0.7 });
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.1 });

      const torso = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.4, 2.2), armorMat);
      torso.position.y = 5.0;
      bossGroup.add(torso);

      // Crown
      const crown = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 2.2), crownMat);
      crown.position.set(0, 8.2, 0);
      bossGroup.add(crown);

      // Cape
      const cape = new THREE.Mesh(new THREE.BoxGeometry(3.4, 5.5, 0.2), capeMat);
      cape.position.set(0, 4.5, -1.2);
      cape.rotation.x = 0.1;
      bossGroup.add(cape);

      bossGroup.userData = {
        animate: (t: number) => {
          cape.rotation.x = 0.1 + Math.sin(t * 3) * 0.12;
        },
      };
    } else {
      // Dragón Omega: Supreme winged voxel dragon
      const dragonMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.6 });
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x450a0a, roughness: 0.8, side: THREE.DoubleSide });
      const fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.0, 6.0), dragonMat);
      body.position.y = 5.5;
      bossGroup.add(body);

      // Neck & Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 3.2), dragonMat);
      head.position.set(0, 7.0, 4.0);
      bossGroup.add(head);

      // Glowing Eyes & Snout
      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), fireMat);
      eyeL.position.set(-1.15, 7.4, 4.2);
      const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), fireMat);
      eyeR.position.set(1.15, 7.4, 4.2);
      bossGroup.add(eyeL, eyeR);

      // Articulated Wings
      const wingL = new THREE.Group();
      wingL.position.set(-1.8, 6.5, 0);
      const wingMeshL = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.2, 3.5), wingMat);
      wingMeshL.position.x = -2.5;
      wingL.add(wingMeshL);
      bossGroup.add(wingL);

      const wingR = new THREE.Group();
      wingR.position.set(1.8, 6.5, 0);
      const wingMeshR = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.2, 3.5), wingMat);
      wingMeshR.position.x = 2.5;
      wingR.add(wingMeshR);
      bossGroup.add(wingR);

      // Tail
      const tail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 4.5), dragonMat);
      tail.position.set(0, 5.0, -4.5);
      bossGroup.add(tail);

      bossGroup.userData = {
        animate: (t: number) => {
          const wingFlap = Math.sin(t * 6) * 0.45;
          wingL.rotation.z = wingFlap;
          wingR.rotation.z = -wingFlap;
          bossGroup.position.y = Math.sin(t * 3) * 0.5;
        },
      };
    }

    return bossGroup;
  },

  /**
   * Vehicles: Sports Car, Dune Buggy, Speed Bike
   */
  createVehicle(type: 'sports' | 'buggy' | 'bike'): THREE.Group {
    const group = new THREE.Group();
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const wheelHubMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });

    if (type === 'sports') {
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.5, roughness: 0.2 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1 });

      // Chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 4.4), bodyMat);
      chassis.position.y = 0.6;
      chassis.castShadow = true;
      group.add(chassis);

      // Cabin / Roof
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.7, 2.2), glassMat);
      cabin.position.set(0, 1.3, -0.2);
      group.add(cabin);

      // Rear Spoiler
      const spoiler = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.6), bodyMat);
      spoiler.position.set(0, 1.2, -1.9);
      group.add(spoiler);

      // 4 Wheels
      const wheels: THREE.Mesh[] = [];
      const wheelPos: [number, number, number][] = [
        [-1.3, 0.45, 1.3],
        [1.3, 0.45, 1.3],
        [-1.3, 0.45, -1.3],
        [1.3, 0.45, -1.3],
      ];
      wheelPos.forEach(([wx, wy, wz]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 12), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, wy, wz);
        wheel.castShadow = true;
        group.add(wheel);
        wheels.push(wheel);
      });

      // Headlights
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const lightL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), lightMat);
      lightL.position.set(-0.8, 0.7, 2.22);
      const lightR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), lightMat);
      lightR.position.set(0.8, 0.7, 2.22);
      group.add(lightL, lightR);

      group.userData = { wheels, type: 'sports' };
    } else if (type === 'buggy') {
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.3, roughness: 0.6 });
      const rollMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });

      // Rugged Frame
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 4.0), frameMat);
      chassis.position.y = 0.8;
      chassis.castShadow = true;
      group.add(chassis);

      // Roll cage bars
      const cage = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 2.4), rollMat);
      cage.position.set(0, 1.7, 0);
      group.add(cage);

      // 4 Big All-terrain wheels
      const wheels: THREE.Mesh[] = [];
      const wheelPos: [number, number, number][] = [
        [-1.5, 0.65, 1.4],
        [1.5, 0.65, 1.4],
        [-1.5, 0.65, -1.4],
        [1.5, 0.65, -1.4],
      ];
      wheelPos.forEach(([wx, wy, wz]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.55, 12), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, wy, wz);
        wheel.castShadow = true;
        group.add(wheel);
        wheels.push(wheel);
      });

      group.userData = { wheels, type: 'buggy' };
    } else {
      // Speed Bike
      const bikeMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.7, roughness: 0.2 });
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 2.6), bikeMat);
      chassis.position.y = 0.7;
      chassis.castShadow = true;
      group.add(chassis);

      // Handlebars
      const handle = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.1), wheelHubMat);
      handle.position.set(0, 1.2, 0.6);
      group.add(handle);

      const wheels: THREE.Mesh[] = [];
      const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12), wheelMat);
      frontWheel.rotation.z = Math.PI / 2;
      frontWheel.position.set(0, 0.5, 1.1);
      group.add(frontWheel);
      wheels.push(frontWheel);

      const backWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12), wheelMat);
      backWheel.rotation.z = Math.PI / 2;
      backWheel.position.set(0, 0.5, -1.1);
      group.add(backWheel);
      wheels.push(backWheel);

      group.userData = { wheels, type: 'bike' };
    }

    return group;
  },

  /**
   * Treasures & Collectibles
   */
  createDiamond(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.4,
      roughness: 0.1,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
    });
    // Top pyramid
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.4, 6), mat);
    top.position.y = 0.2;
    top.rotation.y = Math.PI / 6;
    // Bottom inverted pyramid
    const bot = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 6), mat);
    bot.position.y = -0.3;
    bot.rotation.x = Math.PI;
    bot.rotation.y = Math.PI / 6;
    group.add(top, bot);
    return group;
  },

  createStar(): THREE.Group {
    const group = new THREE.Group();
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0xeab308,
      emissiveIntensity: 0.5,
    });
    const center = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.2), starMat);
    group.add(center);
    // 4 spikes
    const spikeGeo = new THREE.ConeGeometry(0.28, 0.5, 4);
    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(spikeGeo, starMat);
      spike.rotation.z = (i * Math.PI) / 2;
      spike.position.x = Math.cos((i * Math.PI) / 2 + Math.PI / 2) * 0.4;
      spike.position.y = Math.sin((i * Math.PI) / 2 + Math.PI / 2) * 0.4;
      group.add(spike);
    }
    return group;
  },

  createKey(): THREE.Group {
    const group = new THREE.Group();
    const keyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xb45309,
      emissiveIntensity: 0.3,
    });
    // Key ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 6, 12), keyMat);
    ring.position.y = 0.45;
    // Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9), keyMat);
    shaft.position.y = -0.15;
    // Teeth
    const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.08), keyMat);
    tooth1.position.set(0.12, -0.45, 0);
    const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.08), keyMat);
    tooth2.position.set(0.1, -0.3, 0);

    group.add(ring, shaft, tooth1, tooth2);
    return group;
  },

  createChest(): THREE.Group {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 });

    // Chest Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.0), woodMat);
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);

    // Lid (Hinged at back)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.7, -0.5);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.35, 1.02), woodMat);
    lid.position.set(0, 0.175, 0.5);
    lid.castShadow = true;
    lidGroup.add(lid);
    group.add(lidGroup);

    // Golden lock clasp
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.1), goldMat);
    lock.position.set(0, 0.65, 0.52);
    group.add(lock);

    group.userData = { lidGroup };
    return group;
  },

  createBreakableCrate(): THREE.Group {
    const group = new THREE.Group();
    const crateMat = new THREE.MeshStandardMaterial({
      map: VoxelTextures.getCrate(),
      roughness: 0.9,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), crateMat);
    mesh.position.y = 0.6;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return group;
  },
};
