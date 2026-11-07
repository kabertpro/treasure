import * as THREE from 'three';
import {
  ActivePower,
  CameraMode,
  PlayerCustomization,
  PlayerStats,
  PowerType,
  QuestionItem,
  ScreenTarget,
  VehicleState,
  WorldConfig,
} from '../types/game';
import { soundManager } from '../utils/audio';
import { AnimatedCharacterMesh, VoxelModels } from './voxelModels';
import { GeneratedWorld, WorldGenerator } from './worldGenerator';

// Preallocated math helpers to ensure ZERO garbage collection in render loop
const _vec3 = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _ray = new THREE.Raycaster();
const _box = new THREE.Box3();

export interface GameEngineCallbacks {
  onStatsChange: (stats: PlayerStats) => void;
  onActivePowerChange: (power: ActivePower | null) => void;
  onQuestionTrigger: (question: QuestionItem) => void;
  onBossChange: (boss: { name: string; title: string; hp: number; maxHp: number } | null) => void;
  onMessage: (msg: string) => void;
  onWorldComplete: (worldId: number) => void;
  onGameOver: () => void;
  onVehicleChange: (inVehicle: boolean) => void;
  onBossDefeated?: () => void;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private callbacks: GameEngineCallbacks;

  // Software GL detection
  private isSoftwareGl: boolean;
  private animFrameId: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // World and Level state
  private currentWorldConfig: WorldConfig;
  private generatedWorld: GeneratedWorld | null = null;
  private questionsPool: QuestionItem[] = [];

  // Player & Actor State
  private playerMesh: AnimatedCharacterMesh;
  private playerCustomization: PlayerCustomization;
  private playerStats: PlayerStats;
  private playerPos = new THREE.Vector3();
  private playerVelocity = new THREE.Vector3();

  // CAMERA & ROTATION SYSTEM (Seamless mouse look)
  private cameraYaw = 0; // Horizontal camera angle in radians
  private cameraPitch = 0.15; // Vertical camera angle in radians
  private playerModelYaw = 0; // Direction character mesh is facing
  private isGrounded = true;

  // Active Buffs
  private activePower: ActivePower | null = null;
  private shieldMesh: THREE.Mesh | null = null;

  // Camera Settings
  private cameraMode: CameraMode = 'third';
  private targetCamDist = 6.5;
  private currentCamDist = 6.5;

  // Input States
  private keys: Record<string, boolean> = {};
  private moveJoystick = { x: 0, y: 0 };
  private isAiming = false;
  private isShooting = false;
  private shootCooldown = 0;
  private isPointerLocked = false;

  // World Actors
  private enemies: {
    mesh: AnimatedCharacterMesh;
    pos: THREE.Vector3;
    hp: number;
    maxHp: number;
    type: string;
    speed: number;
    attackCooldown: number;
    isDead: boolean;
  }[] = [];

  private boss: {
    mesh: THREE.Group;
    pos: THREE.Vector3;
    hp: number;
    maxHp: number;
    type: string;
    phase: number;
    attackCooldown: number;
    isDead: boolean;
  } | null = null;

  // Dimensional Portal to next stage
  private portal: {
    mesh: THREE.Group;
    pos: THREE.Vector3;
    active: boolean;
  } | null = null;

  private vehicles: {
    mesh: THREE.Group;
    pos: THREE.Vector3;
    rotation: number;
    speed: number;
    type: 'sports' | 'buggy' | 'bike';
    wheels: THREE.Mesh[];
  }[] = [];
  private activeVehicleIndex: number = -1;

  private treasures: {
    mesh: THREE.Group;
    pos: THREE.Vector3;
    type: 'diamond' | 'star' | 'key' | 'chest';
    collected: boolean;
  }[] = [];

  private crates: {
    mesh: THREE.Group;
    pos: THREE.Vector3;
    hp: number;
    box: THREE.Box3;
    destroyed: boolean;
  }[] = [];

  // Projectiles & Particles
  private projectiles: {
    mesh: THREE.Mesh;
    dir: THREE.Vector3;
    life: number;
    isEnemy: boolean;
  }[] = [];

  private particles: {
    mesh: THREE.Mesh;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
  }[] = [];

  constructor(
    container: HTMLElement,
    worldConfig: WorldConfig,
    customization: PlayerCustomization,
    questions: QuestionItem[],
    callbacks: GameEngineCallbacks
  ) {
    this.container = container;
    this.currentWorldConfig = worldConfig;
    this.playerCustomization = customization;
    this.questionsPool = questions;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // Mandatory starting ammo: 10 shots! Max capacity set to 150 to accommodate +50 bonuses
    this.playerStats = {
      health: 100,
      maxHealth: 100,
      ammo: 10,
      maxAmmo: 100,
      score: 0,
      diamonds: 0,
      stars: 0,
      keys: 0,
      correctQuestions: 0,
      incorrectQuestions: 0,
      enemiesDefeated: 0,
      bossesDefeated: 0,
      startTime: Date.now(),
      elapsedTime: 0,
    };

    // Detect Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 2. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      350
    );

    // 3. Create Player Character
    this.playerMesh = VoxelModels.createPlayer(this.playerCustomization);
    this.scene.add(this.playerMesh);

    // Shield Mesh for invulnerability power
    const shieldGeo = new THREE.SphereGeometry(1.8, 12, 12);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.visible = false;
    this.playerMesh.add(this.shieldMesh);

    // 4. Load World
    this.loadWorld(worldConfig);

    // 5. Setup Listeners
    this.setupEventListeners();

    // Start Loop
    this.isRunning = true;
    this.tick = this.tick.bind(this);
    this.tick();
  }

  public loadWorld(config: WorldConfig) {
    this.currentWorldConfig = config;

    // Clear existing actors from scene
    if (this.generatedWorld) {
      this.scene.remove(this.generatedWorld.terrainGroup);
    }
    this.enemies.forEach((e) => this.scene.remove(e.mesh));
    this.enemies = [];
    if (this.boss) {
      this.scene.remove(this.boss.mesh);
      this.boss = null;
    }
    if (this.portal) {
      this.scene.remove(this.portal.mesh);
      this.portal = null;
    }
    this.vehicles.forEach((v) => this.scene.remove(v.mesh));
    this.vehicles = [];
    this.treasures.forEach((t) => this.scene.remove(t.mesh));
    this.treasures = [];
    this.crates.forEach((c) => this.scene.remove(c.mesh));
    this.crates = [];
    this.projectiles.forEach((p) => this.scene.remove(p.mesh));
    this.projectiles = [];
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.particles = [];
    this.activeVehicleIndex = -1;
    this.callbacks.onVehicleChange(false);
    this.callbacks.onBossChange(null);

    // Set Sky & Horizon Fog
    this.scene.background = new THREE.Color(config.skyColor);
    this.scene.fog = new THREE.FogExp2(config.fogColor, 0.012);

    // Lighting Rig
    const oldLights = this.scene.children.filter((c) => c instanceof THREE.Light);
    oldLights.forEach((l) => this.scene.remove(l));

    const hemiLight = new THREE.HemisphereLight(config.skyColor, config.groundColor, 0.85);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    dirLight.position.set(40, 80, 50);
    dirLight.castShadow = !this.isSoftwareGl;
    if (dirLight.castShadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 200;
      const d = 80;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
    }
    this.scene.add(dirLight);

    // Generate World Geometry
    this.generatedWorld = WorldGenerator.generate(config);
    this.scene.add(this.generatedWorld.terrainGroup);

    // Position Player
    this.playerPos.copy(this.generatedWorld.spawnPoint);
    this.playerMesh.position.copy(this.playerPos);
    this.playerVelocity.set(0, 0, 0);
    this.cameraYaw = 0;
    this.cameraPitch = 0.15;
    this.playerModelYaw = 0;

    // Spawn Enemies
    this.generatedWorld.enemySpawns.forEach((spawn) => {
      const mesh = VoxelModels.createEnemy(spawn.type);
      mesh.position.copy(spawn.pos);
      this.scene.add(mesh);

      const hpMap: Record<string, number> = {
        pirate: 2, // 2 shots
        robot: 3,  // 3 shots
        shadow: 3,
        knight: 4, // 4 shots
        golem: 5,  // 5 shots
      };

      this.enemies.push({
        mesh,
        pos: spawn.pos.clone(),
        hp: hpMap[spawn.type] || 3,
        maxHp: hpMap[spawn.type] || 3,
        type: spawn.type,
        speed: spawn.type === 'robot' ? 4.5 : 3.5,
        attackCooldown: 0,
        isDead: false,
      });
    });

    // Spawn Boss
    const bossMesh = VoxelModels.createBoss(config.bossType);
    bossMesh.position.copy(this.generatedWorld.bossSpawnPoint);
    this.scene.add(bossMesh);
    this.boss = {
      mesh: bossMesh,
      pos: this.generatedWorld.bossSpawnPoint.clone(),
      hp: config.bossHp,
      maxHp: config.bossHp,
      type: config.bossType,
      phase: 1,
      attackCooldown: 2.0,
      isDead: false,
    };
    this.callbacks.onBossChange({
      name: config.bossName,
      title: config.bossTitle,
      hp: this.boss.hp,
      maxHp: this.boss.maxHp,
    });

    // Spawn Vehicles
    this.generatedWorld.vehicleSpawns.forEach((vSpawn) => {
      const vMesh = VoxelModels.createVehicle(vSpawn.type);
      vMesh.position.copy(vSpawn.pos);
      this.scene.add(vMesh);
      this.vehicles.push({
        mesh: vMesh,
        pos: vSpawn.pos.clone(),
        rotation: 0,
        speed: 0,
        type: vSpawn.type,
        wheels: (vMesh.userData.wheels as THREE.Mesh[]) || [],
      });
    });

    // Spawn Treasures
    this.generatedWorld.treasureSpawns.forEach((tSpawn) => {
      let tMesh: THREE.Group;
      if (tSpawn.type === 'diamond') tMesh = VoxelModels.createDiamond();
      else if (tSpawn.type === 'star') tMesh = VoxelModels.createStar();
      else if (tSpawn.type === 'key') tMesh = VoxelModels.createKey();
      else tMesh = VoxelModels.createChest();

      tMesh.position.copy(tSpawn.pos);
      this.scene.add(tMesh);
      this.treasures.push({
        mesh: tMesh,
        pos: tSpawn.pos.clone(),
        type: tSpawn.type,
        collected: false,
      });
    });

    // Spawn Breakable Crates
    this.generatedWorld.crateSpawns.forEach((cPos) => {
      const cMesh = VoxelModels.createBreakableCrate();
      cMesh.position.copy(cPos);
      this.scene.add(cMesh);

      const box = new THREE.Box3();
      box.setFromObject(cMesh);
      this.crates.push({
        mesh: cMesh,
        pos: cPos.clone(),
        hp: 1,
        box,
        destroyed: false,
      });
    });

    // Trigger Ambient Music
    soundManager.playMusic(config.musicTrack.replace('.mp3', '') as any);
    this.callbacks.onMessage(`¡${config.name}! ${config.mainMission}`);
  }

  // ==========================================
  // CONTROLS & SEAMLESS MOUSE EVENT HANDLING
  // ==========================================

  private setupEventListeners() {
    const canvas = this.renderer.domElement;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Camera toggle: V key
      if (e.code === 'KeyV') {
        this.toggleCamera();
      }
      // Vehicle toggle: F key
      if (e.code === 'KeyF') {
        this.toggleVehicle();
      }
      // Interact: E key
      if (e.code === 'KeyE') {
        this.interactNearPlayer();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Pointer Lock & Mouse Look
    canvas.addEventListener('click', () => {
      if (!this.isPaused && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock().catch(() => {
          // Pointer lock prevented by browser, fallback to drag
        });
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === canvas;
    });

    let isPointerDragging = false;
    let lastX = 0;
    let lastY = 0;

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isShooting = true;
      } else if (e.button === 2) {
        this.isAiming = true;
      }
      isPointerDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isShooting = false;
      if (e.button === 2) this.isAiming = false;
      isPointerDragging = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Continuous Mouse Look Rotation
    window.addEventListener('mousemove', (e) => {
      if (this.isPaused) return;

      let dx = 0;
      let dy = 0;

      if (this.isPointerLocked) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (isPointerDragging) {
        dx = e.clientX - lastX;
        dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
      }

      if (dx !== 0 || dy !== 0) {
        const sensitivity = 0.0032;
        this.cameraYaw -= dx * sensitivity;
        this.cameraPitch = Math.max(-0.75, Math.min(0.85, this.cameraPitch - dy * sensitivity));
      }
    });

    // Window Resize
    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  public rotateCamera(yawDelta: number, pitchDelta: number) {
    this.cameraYaw -= yawDelta;
    this.cameraPitch = Math.max(-0.75, Math.min(0.85, this.cameraPitch - pitchDelta));
  }

  public setJoystick(x: number, y: number) {
    this.moveJoystick.x = x;
    this.moveJoystick.y = y;
  }

  public triggerJump() {
    if (this.isGrounded || this.activePower?.type === 'flight') {
      this.playerVelocity.y = this.activePower?.type === 'flight' ? 12 : 8.5;
      this.isGrounded = false;
      soundManager.playJump();
    }
  }

  public triggerShoot() {
    this.shootWeapon();
  }

  public setAim(aiming: boolean) {
    this.isAiming = aiming;
  }

  public toggleCamera() {
    if (this.activeVehicleIndex !== -1) {
      this.cameraMode = this.cameraMode === 'vehicle' ? 'first' : 'vehicle';
    } else {
      this.cameraMode = this.cameraMode === 'third' ? 'first' : 'third';
    }
    soundManager.playClick();
  }

  public toggleVehicle() {
    if (this.activeVehicleIndex !== -1) {
      // Exit Vehicle
      const veh = this.vehicles[this.activeVehicleIndex];
      this.playerPos.set(veh.pos.x + 2, 0.5, veh.pos.z);
      this.playerMesh.visible = true;
      this.activeVehicleIndex = -1;
      this.cameraMode = 'third';
      soundManager.stopVehicleEngine();
      this.callbacks.onVehicleChange(false);
      this.callbacks.onMessage('Saliste del vehículo.');
    } else {
      // Find nearest vehicle
      let closestIdx = -1;
      let closestDist = 5.0;
      this.vehicles.forEach((v, idx) => {
        const d = this.playerPos.distanceTo(v.pos);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = idx;
        }
      });

      if (closestIdx !== -1) {
        this.activeVehicleIndex = closestIdx;
        this.playerMesh.visible = false;
        this.cameraMode = 'vehicle';
        soundManager.startVehicleEngine();
        this.callbacks.onVehicleChange(true);
        this.callbacks.onMessage('¡Conduciendo vehículo! (F para salir)');
      }
    }
  }

  public interactNearPlayer() {
    // Check Dimensional Portal
    if (this.portal && this.playerPos.distanceTo(this.portal.pos) < 5.0) {
      this.enterPortal();
      return;
    }

    // Check nearby chests
    this.treasures.forEach((t) => {
      if (!t.collected && t.type === 'chest') {
        const dist = this.playerPos.distanceTo(t.pos);
        if (dist < 4.0) {
          this.openChest(t);
        }
      }
    });
  }

  public enterPortal() {
    soundManager.playVictory();
    this.callbacks.onMessage('¡Cruzando el Portal Dimensional hacia el siguiente Mundo!');
    this.callbacks.onWorldComplete(this.currentWorldConfig.id);
  }

  // ==========================================
  // WEAPONS & SHOOTING LOGIC (PRECISION AIMING)
  // ==========================================

  private shootWeapon() {
    if (this.shootCooldown > 0) return;
    if (this.playerStats.ammo <= 0) {
      this.callbacks.onMessage('¡Sin munición! Abre cofres con preguntas para obtener +50 municiones.');
      soundManager.playWrong();
      return;
    }

    // Strictly decrement ammo
    this.playerStats.ammo--;
    this.callbacks.onStatsChange({ ...this.playerStats });
    this.shootCooldown = 0.22;

    soundManager.playShoot();

    // Shoot in the EXACT direction the camera is looking!
    this.camera.getWorldDirection(_forward);

    // Bullet starts slightly in front of camera
    const bulletOrigin = this.camera.position.clone().addScaledVector(_forward, 0.8);

    // Create glowing laser bullet mesh
    const bulletMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    bulletMesh.position.copy(bulletOrigin);
    this.scene.add(bulletMesh);

    this.projectiles.push({
      mesh: bulletMesh,
      dir: _forward.clone().multiplyScalar(55),
      life: 1.5,
      isEnemy: false,
    });

    // Precision Raycast hit checking
    _ray.set(this.camera.position, _forward);

    // 1. Check Crates
    for (const crate of this.crates) {
      if (!crate.destroyed && crate.box.containsPoint(bulletOrigin.clone().addScaledVector(_forward, 2.5))) {
        this.destroyCrate(crate);
        break;
      }
    }

    // 2. Check Enemies
    for (const enemy of this.enemies) {
      if (!enemy.isDead && enemy.pos.distanceTo(bulletOrigin) < 45) {
        const toEnemy = enemy.pos.clone().add(new THREE.Vector3(0, 1.2, 0)).sub(this.camera.position);
        const dot = toEnemy.clone().normalize().dot(_forward);
        if (dot > 0.88 && toEnemy.length() < 35) {
          this.damageEnemy(enemy, 1);
          break;
        }
      }
    }

    // 3. Check Boss
    if (this.boss && !this.boss.isDead) {
      const toBoss = this.boss.pos.clone().add(new THREE.Vector3(0, 3.5, 0)).sub(this.camera.position);
      const dot = toBoss.clone().normalize().dot(_forward);
      if (dot > 0.82 && toBoss.length() < 55) {
        this.damageBoss(40);
      }
    }
  }

  private destroyCrate(crate: { mesh: THREE.Group; pos: THREE.Vector3; destroyed: boolean }) {
    crate.destroyed = true;
    this.scene.remove(crate.mesh);
    soundManager.playExplosion();
    this.spawnVoxelDebris(crate.pos, 0x92400e, 12);

    // Grant ammo
    this.playerStats.ammo = Math.min(this.playerStats.maxAmmo, this.playerStats.ammo + 2);
    this.playerStats.score += 25;
    this.callbacks.onMessage('¡Caja destruida! +2 Balas y +25 PTS');
    this.callbacks.onStatsChange({ ...this.playerStats });
  }

  private damageEnemy(
    enemy: {
      mesh: AnimatedCharacterMesh;
      pos: THREE.Vector3;
      hp: number;
      type: string;
      isDead: boolean;
    },
    dmg: number
  ) {
    enemy.hp -= dmg;
    soundManager.playHit();
    this.spawnVoxelDebris(enemy.pos, 0xef4444, 4);

    if (enemy.hp <= 0) {
      enemy.isDead = true;
      this.scene.remove(enemy.mesh);
      this.spawnVoxelDebris(enemy.pos, 0xf59e0b, 16);
      soundManager.playExplosion();
      this.playerStats.enemiesDefeated++;
      this.playerStats.score += 100;
      this.callbacks.onStatsChange({ ...this.playerStats });
      this.callbacks.onMessage(`¡${enemy.type.toUpperCase()} DERROTADO! +100 PTS`);
    }
  }

  private damageBoss(dmg: number) {
    if (!this.boss || this.boss.isDead) return;
    this.boss.hp = Math.max(0, this.boss.hp - dmg);
    soundManager.playHit();
    this.spawnVoxelDebris(this.boss.pos, 0xf97316, 8);

    // Phase 2 transition when HP < 50%
    if (this.boss.hp < this.boss.maxHp * 0.5 && this.boss.phase === 1) {
      this.boss.phase = 2;
      soundManager.playBossRoar();
      this.callbacks.onMessage(`¡CUIDADO! ¡${this.boss.type.toUpperCase()} ENTRA EN FASE DE FURIA!`);
    }

    this.callbacks.onBossChange({
      name: this.currentWorldConfig.bossName,
      title: this.currentWorldConfig.bossTitle,
      hp: this.boss.hp,
      maxHp: this.boss.maxHp,
    });

    if (this.boss.hp <= 0) {
      this.boss.isDead = true;
      this.scene.remove(this.boss.mesh);
      this.spawnVoxelDebris(this.boss.pos, 0xfacc15, 50);
      soundManager.playVictory();
      this.playerStats.bossesDefeated++;
      this.playerStats.score += 500;
      this.callbacks.onStatsChange({ ...this.playerStats });
      this.callbacks.onBossChange(null);

      // Spawn Dimensional Stargate Portal
      this.spawnDimensionalPortal(this.boss.pos);
      this.callbacks.onMessage(`¡VICTORIA! ¡${this.currentWorldConfig.bossName} DERROTADO! ¡ENTRA AL PORTAL DIMENSIONAL!`);
      if (this.callbacks.onBossDefeated) {
        this.callbacks.onBossDefeated();
      }
    }
  }

  private spawnDimensionalPortal(pos: THREE.Vector3) {
    const portalGroup = new THREE.Group();

    // Golden arch frame
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xb45309,
      emissiveIntensity: 0.5,
    });
    const archL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 7, 1.2), frameMat);
    archL.position.set(-3.5, 3.5, 0);
    const archR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 7, 1.2), frameMat);
    archR.position.set(3.5, 3.5, 0);
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.2, 1.2), frameMat);
    archTop.position.set(0, 7.5, 0);
    portalGroup.add(archL, archR, archTop);

    // Glowing energy swirl in center
    const energyMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const portalEnergy = new THREE.Mesh(new THREE.PlaneGeometry(6, 6.8), energyMat);
    portalEnergy.position.set(0, 3.6, 0);
    portalGroup.add(portalEnergy);

    // Light pillar into sky
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.4,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 120, 12), beamMat);
    beam.position.set(0, 60, 0);
    portalGroup.add(beam);

    portalGroup.position.copy(pos);
    this.scene.add(portalGroup);
    this.portal = {
      mesh: portalGroup,
      pos: pos.clone(),
      active: true,
    };
  }

  // ==========================================
  // CHESTS & QUESTIONS (+50 AMMO PER ANSWER)
  // ==========================================

  private openChest(chest: { mesh: THREE.Group; pos: THREE.Vector3; collected: boolean }) {
    chest.collected = true;
    const lidGroup = chest.mesh.userData.lidGroup as THREE.Group | undefined;
    if (lidGroup) {
      lidGroup.rotation.x = -Math.PI / 2.2;
    }
    soundManager.playChestOpen();

    if (this.questionsPool.length > 0) {
      const q = this.questionsPool[Math.floor(Math.random() * this.questionsPool.length)];
      this.pause();
      soundManager.playQuestionPrompt();
      this.callbacks.onQuestionTrigger(q);
    } else {
      this.grantChestReward();
    }
  }

  public handleQuestionAnswer(isCorrect: boolean, timeBonus: number) {
    this.resume();
    if (isCorrect) {
      soundManager.playCorrect();
      this.playerStats.correctQuestions++;
      const earned = 100 + timeBonus;
      this.playerStats.score += earned;

      // MANDATORY REQUIREMENT: Grant +50 Ammo on every correct answer!
      this.playerStats.ammo += 50;
      this.playerStats.maxAmmo = Math.max(100, this.playerStats.ammo);
      this.callbacks.onStatsChange({ ...this.playerStats });
      this.callbacks.onMessage(`¡RESPUESTA CORRECTA! +50 MUNICIONES Y +${earned} PTS`);

      this.grantChestReward();
    } else {
      soundManager.playWrong();
      this.playerStats.incorrectQuestions++;
      this.playerStats.health = Math.max(10, this.playerStats.health - 15);
      this.callbacks.onMessage('Respuesta incorrecta (-15 Salud). ¡Sigue adelante!');
      this.callbacks.onStatsChange({ ...this.playerStats });
    }
  }

  private grantChestReward() {
    const roll = Math.random();
    if (roll < 0.3) {
      this.activatePower('flight', 20);
      this.callbacks.onMessage('¡PODER DE VUELO DESBLOQUEADO (20s)!');
    } else if (roll < 0.6) {
      this.activatePower('shield', 25);
      this.callbacks.onMessage('¡ESCUDO DE ENERGÍA DESBLOQUEADO (25s)!');
    } else if (roll < 0.85) {
      this.activatePower('speed', 25);
      this.callbacks.onMessage('¡SUPER VELOCIDAD DESBLOQUEADA (25s)!');
    } else {
      this.playerStats.diamonds += 3;
      soundManager.playDiamond();
      this.callbacks.onMessage('¡+3 DIAMANTES EXTRA!');
    }
    this.callbacks.onStatsChange({ ...this.playerStats });
  }

  public activatePower(type: PowerType, durationSecs: number) {
    const names: Record<PowerType, string> = {
      flight: 'Vuelo',
      speed: 'Super Velocidad',
      shield: 'Escudo Protector',
      treasure_vision: 'Visión de Tesoros',
    };
    this.activePower = {
      type,
      duration: durationSecs,
      totalDuration: durationSecs,
      name: names[type],
    };
    if (this.shieldMesh) {
      this.shieldMesh.visible = type === 'shield';
    }
    soundManager.playPowerup();
    this.callbacks.onActivePowerChange(this.activePower);
  }

  private spawnVoxelDebris(pos: THREE.Vector3, color: number, count: number) {
    const mat = new THREE.MeshBasicMaterial({ color });
    const geo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    for (let i = 0; i < count; i++) {
      const pMesh = new THREE.Mesh(geo, mat);
      pMesh.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 0.8, (Math.random() - 0.5) * 0.8));
      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 8 + 2, (Math.random() - 0.5) * 6),
        life: 0.8,
        maxLife: 0.8,
      });
    }
  }

  // ==========================================
  // MAIN GAME LOOP (TICK)
  // ==========================================

  private tick() {
    if (!this.isRunning) return;

    const dt = Math.min(this.clock.getDelta(), 0.1);

    if (!this.isPaused) {
      this.update(dt);
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      setTimeout(() => {
        this.animFrameId = requestAnimationFrame(this.tick);
      }, 40);
    } else {
      this.animFrameId = requestAnimationFrame(this.tick);
    }
  }

  private update(dt: number) {
    const time = this.clock.getElapsedTime();

    // 1. Update Powers
    if (this.activePower) {
      this.activePower.duration -= dt;
      if (this.activePower.duration <= 0) {
        this.activePower = null;
        if (this.shieldMesh) this.shieldMesh.visible = false;
        this.callbacks.onActivePowerChange(null);
      } else {
        this.callbacks.onActivePowerChange({ ...this.activePower });
      }
    }

    // 2. Physics & Player Movement
    if (this.activeVehicleIndex !== -1) {
      this.updateVehiclePhysics(dt);
    } else {
      this.updatePlayerPhysics(dt, time);
    }

    // 3. Camera Positioning
    this.updateCamera(dt);

    // 4. Shooting Cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }
    if (this.isShooting && this.shootCooldown <= 0) {
      this.shootWeapon();
    }

    // 5. Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.mesh.position.addScaledVector(p.dir, dt);
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // 6. Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.mesh.position.addScaledVector(part.vel, dt);
      part.vel.y -= 18 * dt;
      part.life -= dt;
      if (part.life <= 0) {
        this.scene.remove(part.mesh);
        this.particles.splice(i, 1);
      }
    }

    // 7. Collectibles & Chests
    this.treasures.forEach((t) => {
      if (!t.collected) {
        t.mesh.rotation.y += dt * 2;
        t.mesh.position.y = t.pos.y + Math.sin(time * 3 + t.pos.x) * 0.15;

        // Auto pickup diamonds, stars and keys on proximity
        if (this.playerPos.distanceTo(t.mesh.position) < 2.2) {
          this.collectTreasure(t);
        }
      }
    });

    // 8. Dimensional Portal Proximity Check
    if (this.portal && this.portal.active) {
      this.portal.mesh.rotation.y += dt * 1.5;
      if (this.playerPos.distanceTo(this.portal.pos) < 3.8) {
        this.enterPortal();
      }
    }

    // 9. Enemies & Boss AI
    this.updateEnemies(dt, time);
    this.updateBoss(dt, time);
  }

  private collectTreasure(t: { mesh: THREE.Group; pos: THREE.Vector3; type: string; collected: boolean }) {
    if (t.type === 'chest') return;
    t.collected = true;
    this.scene.remove(t.mesh);

    if (t.type === 'diamond') {
      soundManager.playDiamond();
      this.playerStats.diamonds++;
      this.playerStats.score += 50;
      this.callbacks.onMessage('¡Diamante recogido! +50 Puntos');
    } else if (t.type === 'star') {
      soundManager.playStar();
      this.playerStats.stars++;
      this.playerStats.score += 150;
      this.callbacks.onMessage('¡Estrella de Poder! +150 Puntos');
    } else if (t.type === 'key') {
      soundManager.playKeyPickup();
      this.playerStats.keys++;
      this.callbacks.onMessage('¡Llave Antigua conseguida! Abre puertas del mundo');
    }
    this.callbacks.onStatsChange({ ...this.playerStats });
  }

  private updatePlayerPhysics(dt: number, time: number) {
    let moveForward = 0;
    let moveRight = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveForward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveForward -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveRight -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveRight += 1;

    // Mobile virtual joystick
    moveForward -= this.moveJoystick.y;
    moveRight += this.moveJoystick.x;

    const isRunning = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    let moveSpeed = isRunning ? 9.5 : 6.5;
    if (this.activePower?.type === 'speed') moveSpeed *= 2.2;

    const inputLen = Math.hypot(moveForward, moveRight);
    const isMoving = inputLen > 0.1;

    if (isMoving) {
      const normF = moveForward / (inputLen || 1);
      const normR = moveRight / (inputLen || 1);

      // MOVEMENT IS RELATIVE TO CAMERA YAW! (GTA / Vice City style)
      _forward.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
      _right.set(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

      const targetMove = _forward.clone().multiplyScalar(normF).add(_right.clone().multiplyScalar(normR)).multiplyScalar(moveSpeed);

      this.playerVelocity.x = THREE.MathUtils.damp(this.playerVelocity.x, targetMove.x, 16, dt);
      this.playerVelocity.z = THREE.MathUtils.damp(this.playerVelocity.z, targetMove.z, 16, dt);

      // Smoothly rotate character model to face movement direction
      const desiredAngle = Math.atan2(targetMove.x, targetMove.z);
      this.playerModelYaw = THREE.MathUtils.damp(this.playerModelYaw, desiredAngle, 14, dt);

      if (this.isGrounded && Math.random() < 0.15) {
        soundManager.playStep();
      }
    } else {
      this.playerVelocity.x = THREE.MathUtils.damp(this.playerVelocity.x, 0, 20, dt);
      this.playerVelocity.z = THREE.MathUtils.damp(this.playerVelocity.z, 0, 20, dt);
    }

    // When aiming or shooting, face camera direction immediately
    if (this.isAiming || this.isShooting) {
      this.playerModelYaw = this.cameraYaw + Math.PI;
    }

    // Jump / Flight
    if (this.activePower?.type === 'flight') {
      if (this.keys['Space']) this.playerVelocity.y = 8.5;
      else if (this.keys['ShiftLeft']) this.playerVelocity.y = -8.5;
      else this.playerVelocity.y = THREE.MathUtils.damp(this.playerVelocity.y, 0, 10, dt);
    } else {
      this.playerVelocity.y -= 22 * dt;
    }

    // Apply Position
    const nextPos = this.playerPos.clone().addScaledVector(this.playerVelocity, dt);

    if (nextPos.y <= 0.1) {
      nextPos.y = 0.1;
      this.playerVelocity.y = 0;
      if (!this.isGrounded) soundManager.playLand();
      this.isGrounded = true;
    }

    // World Bounds
    if (this.generatedWorld) {
      nextPos.x = Math.max(this.generatedWorld.bounds.minX + 4, Math.min(this.generatedWorld.bounds.maxX - 4, nextPos.x));
      nextPos.z = Math.max(this.generatedWorld.bounds.minZ + 4, Math.min(this.generatedWorld.bounds.maxZ - 4, nextPos.z));
    }

    this.playerPos.copy(nextPos);
    this.playerMesh.position.copy(this.playerPos);
    this.playerMesh.rotation.y = this.playerModelYaw;

    // Run Voxel Character Animation
    this.playerMesh.updateAnimation(time, isMoving, this.isAiming || this.isShooting);
  }

  private updateVehiclePhysics(dt: number) {
    const veh = this.vehicles[this.activeVehicleIndex];
    if (!veh) return;

    let steer = 0;
    let accel = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) accel += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) accel -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) steer += 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) steer -= 1;

    accel -= this.moveJoystick.y;
    steer -= this.moveJoystick.x;

    const maxSpeed = veh.type === 'sports' ? 26.0 : veh.type === 'bike' ? 22.0 : 18.0;
    const accelRate = 18.0;

    if (accel !== 0) {
      veh.speed = Math.max(-10, Math.min(maxSpeed, veh.speed + accel * accelRate * dt));
    } else {
      veh.speed = THREE.MathUtils.damp(veh.speed, 0, 4, dt);
    }

    if (Math.abs(veh.speed) > 0.5) {
      veh.rotation += steer * 2.2 * (veh.speed / maxSpeed) * dt;
    }

    soundManager.updateVehiclePitch(Math.abs(veh.speed) / maxSpeed);

    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), veh.rotation);
    veh.pos.addScaledVector(forward, veh.speed * dt);

    veh.wheels.forEach((w) => {
      w.rotation.x += (veh.speed / 2.0) * dt;
    });

    veh.mesh.position.copy(veh.pos);
    veh.mesh.rotation.y = veh.rotation;
    this.playerPos.copy(veh.pos);
  }

  private updateCamera(dt: number) {
    if (this.cameraMode === 'first') {
      // 1st Person: Camera directly at player eyes, synchronized rotation
      this.camera.position.set(this.playerPos.x, this.playerPos.y + 1.85, this.playerPos.z);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.cameraYaw + Math.PI;
      this.camera.rotation.x = this.cameraPitch;
      this.playerMesh.visible = false;
    } else if (this.cameraMode === 'vehicle' && this.activeVehicleIndex !== -1) {
      // Vehicle Chase Cam
      const veh = this.vehicles[this.activeVehicleIndex];
      const camOffset = new THREE.Vector3(0, 3.8, -8.0).applyAxisAngle(new THREE.Vector3(0, 1, 0), veh.rotation);
      const targetCamPos = veh.pos.clone().add(camOffset);
      this.camera.position.lerp(targetCamPos, dt * 8);
      this.camera.lookAt(veh.pos.clone().add(new THREE.Vector3(0, 1.5, 0)));
    } else {
      // 3rd Person: Smooth spherical orbit behind player
      this.playerMesh.visible = true;

      // Spherical coordinate offset based on cameraYaw and cameraPitch
      const cx = Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.currentCamDist;
      const cy = Math.sin(this.cameraPitch) * this.currentCamDist + 2.2;
      const cz = Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.currentCamDist;

      const desiredCamPos = this.playerPos.clone().add(new THREE.Vector3(cx, cy, cz));
      this.camera.position.lerp(desiredCamPos, dt * 16);
      this.camera.lookAt(this.playerPos.clone().add(new THREE.Vector3(0, 1.6, 0)));
    }
  }

  private updateEnemies(dt: number, time: number) {
    this.enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      const dist = enemy.pos.distanceTo(this.playerPos);

      if (dist < 32 && dist > 1.8) {
        const dir = this.playerPos.clone().sub(enemy.pos).normalize();
        enemy.pos.addScaledVector(dir, enemy.speed * dt);
        enemy.mesh.position.copy(enemy.pos);
        enemy.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        enemy.mesh.updateAnimation(time, true, false);
      } else if (dist <= 1.8) {
        enemy.mesh.updateAnimation(time, false, true);
        enemy.attackCooldown -= dt;
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 1.2;
          this.damagePlayer(15);
        }
      } else {
        enemy.mesh.updateAnimation(time, false, false);
      }
    });
  }

  private updateBoss(dt: number, time: number) {
    if (!this.boss || this.boss.isDead) return;

    if (this.boss.mesh.userData.animate) {
      this.boss.mesh.userData.animate(time);
    }

    const dist = this.boss.pos.distanceTo(this.playerPos);
    this.boss.mesh.lookAt(this.playerPos.x, this.boss.pos.y, this.playerPos.z);

    this.boss.attackCooldown -= dt;
    if (this.boss.attackCooldown <= 0 && dist < 50) {
      this.boss.attackCooldown = this.boss.phase === 2 ? 1.4 : 2.5;
      this.triggerBossAttack();
    }
  }

  private triggerBossAttack() {
    if (!this.boss || this.boss.isDead) return;
    soundManager.playBossRoar();

    const spawnPos = this.boss.pos.clone().add(new THREE.Vector3(0, 4.5, 0));
    const toPlayer = this.playerPos.clone().sub(spawnPos).normalize();

    const projMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    projMesh.position.copy(spawnPos);
    this.scene.add(projMesh);

    this.projectiles.push({
      mesh: projMesh,
      dir: toPlayer.multiplyScalar(20),
      life: 2.5,
      isEnemy: true,
    });

    setTimeout(() => {
      if (this.boss && !this.boss.isDead && this.playerPos.distanceTo(projMesh.position) < 3.2) {
        this.damagePlayer(25);
      }
    }, 1100);
  }

  private damagePlayer(amount: number) {
    if (this.activePower?.type === 'shield') {
      soundManager.playShieldBounce();
      this.callbacks.onMessage('¡El Escudo de Energía absorbió el ataque!');
      return;
    }

    this.playerStats.health = Math.max(0, this.playerStats.health - amount);
    soundManager.playHit();
    this.callbacks.onStatsChange({ ...this.playerStats });

    if (this.playerStats.health <= 0) {
      soundManager.playGameOver();
      this.callbacks.onGameOver();
    }
  }

  // ==========================================
  // SCREEN TARGETS & WAYPOINTS FOR HUD
  // ==========================================

  public getScreenTargets(): {
    targets: ScreenTarget[];
    bossBearing: { angle: number; distance: number; name: string } | null;
  } {
    const targets: ScreenTarget[] = [];
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Helper to project 3D point to 2D screen coordinates
    const projectToScreen = (worldPos: THREE.Vector3) => {
      const p = worldPos.clone().project(this.camera);
      return {
        x: (p.x * 0.5 + 0.5) * width,
        y: (-(p.y * 0.5) + 0.5) * height,
        inFront: p.z < 1,
      };
    };

    // 1. Boss Target Marker
    if (this.boss && !this.boss.isDead) {
      const proj = projectToScreen(this.boss.pos.clone().add(new THREE.Vector3(0, 7.5, 0)));
      const dist = Math.round(this.playerPos.distanceTo(this.boss.pos));
      if (proj.inFront && proj.x >= 0 && proj.x <= width && proj.y >= 0 && proj.y <= height) {
        targets.push({
          id: 'boss',
          type: 'boss',
          name: `JEFE: ${this.currentWorldConfig.bossName.toUpperCase()}`,
          hp: this.boss.hp,
          maxHp: this.boss.maxHp,
          distance: dist,
          screenX: proj.x,
          screenY: proj.y,
          visible: true,
        });
      }
    }

    // 2. Dimensional Portal
    if (this.portal && this.portal.active) {
      const proj = projectToScreen(this.portal.pos.clone().add(new THREE.Vector3(0, 5, 0)));
      const dist = Math.round(this.playerPos.distanceTo(this.portal.pos));
      if (proj.inFront && proj.x >= 0 && proj.x <= width && proj.y >= 0 && proj.y <= height) {
        targets.push({
          id: 'portal',
          type: 'portal',
          name: 'PORTAL DIMENSIONAL (SIGUIENTE MUNDO)',
          distance: dist,
          screenX: proj.x,
          screenY: proj.y,
          visible: true,
        });
      }
    }

    // 3. Question Chests (+50 ammo)
    this.treasures.forEach((t, idx) => {
      if (!t.collected && t.type === 'chest') {
        const dist = Math.round(this.playerPos.distanceTo(t.pos));
        if (dist < 40) {
          const proj = projectToScreen(t.pos.clone().add(new THREE.Vector3(0, 2.0, 0)));
          if (proj.inFront && proj.x >= 0 && proj.x <= width && proj.y >= 0 && proj.y <= height) {
            targets.push({
              id: `chest_${idx}`,
              type: 'chest',
              name: 'COFRE (+50 BALAS)',
              distance: dist,
              screenX: proj.x,
              screenY: proj.y,
              visible: true,
            });
          }
        }
      }
    });

    // 4. Enemies within 35m
    this.enemies.forEach((enemy, idx) => {
      if (!enemy.isDead) {
        const dist = Math.round(this.playerPos.distanceTo(enemy.pos));
        if (dist < 35) {
          const proj = projectToScreen(enemy.pos.clone().add(new THREE.Vector3(0, 2.6, 0)));
          if (proj.inFront && proj.x >= 0 && proj.x <= width && proj.y >= 0 && proj.y <= height) {
            targets.push({
              id: `enemy_${idx}`,
              type: 'enemy',
              name: enemy.type.toUpperCase(),
              hp: enemy.hp,
              maxHp: enemy.maxHp,
              distance: dist,
              screenX: proj.x,
              screenY: proj.y,
              visible: true,
            });
          }
        }
      }
    });

    // Boss Compass Angle (relative to camera forward)
    let bossBearing: { angle: number; distance: number; name: string } | null = null;
    if (this.boss && !this.boss.isDead) {
      const dx = this.boss.pos.x - this.playerPos.x;
      const dz = this.boss.pos.z - this.playerPos.z;
      const targetAngle = Math.atan2(dx, dz);
      // Angle relative to camera
      const relAngle = targetAngle - (this.cameraYaw + Math.PI);
      bossBearing = {
        angle: relAngle,
        distance: Math.round(this.playerPos.distanceTo(this.boss.pos)),
        name: this.currentWorldConfig.bossName,
      };
    }

    return { targets, bossBearing };
  }

  public getPlayerStats(): PlayerStats {
    return { ...this.playerStats };
  }

  public getMinimapData(): {
    player: { x: number; z: number; rotation: number };
    enemies: { x: number; z: number }[];
    treasures: { x: number; z: number; type: string }[];
    boss: { x: number; z: number } | null;
  } {
    return {
      player: { x: this.playerPos.x, z: this.playerPos.z, rotation: this.cameraYaw },
      enemies: this.enemies.filter((e) => !e.isDead).map((e) => ({ x: e.pos.x, z: e.pos.z })),
      treasures: this.treasures.filter((t) => !t.collected).map((t) => ({ x: t.pos.x, z: t.pos.z, type: t.type })),
      boss: this.boss && !this.boss.isDead ? { x: this.boss.pos.x, z: this.boss.pos.z } : null,
    };
  }

  public isPortalReady(): boolean {
    return !!(this.portal && this.portal.active);
  }

  public pause() {
    this.isPaused = true;
    this.isShooting = false;
    this.isAiming = false;
    this.keys = {};
    this.moveJoystick = { x: 0, y: 0 };
    this.playerVelocity.set(0, 0, 0);
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  public resume() {
    this.isPaused = false;
    this.clock.getDelta(); // flush delta so no time skips
  }

  public dispose() {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);
    soundManager.stopVehicleEngine();
    soundManager.stopMusic();
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
  }
}
