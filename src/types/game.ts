export type GameState = 
  | 'menu'
  | 'character_create'
  | 'playing'
  | 'paused'
  | 'question'
  | 'map'
  | 'missions'
  | 'game_over'
  | 'victory';

export type CameraMode = 'first' | 'third' | 'vehicle';

export type GraphicQuality = 'low' | 'medium' | 'high';

export interface PlayerCustomization {
  name: string;
  skinColor: string;
  hairColor: string;
  hairStyle: 'classic' | 'spiky' | 'cap' | 'helmet';
  shirtColor: string;
  pantsColor: string;
  shoesColor: string;
  accessory: 'none' | 'glasses' | 'bandana' | 'cape';
  presetId?: string;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  ammo: number; // Strictly starting at 10, max 10
  maxAmmo: number; // 10
  score: number;
  diamonds: number;
  stars: number;
  keys: number;
  correctQuestions: number;
  incorrectQuestions: number;
  enemiesDefeated: number;
  bossesDefeated: number;
  startTime: number;
  elapsedTime: number;
}

export type PowerType = 'flight' | 'speed' | 'shield' | 'treasure_vision';

export interface ActivePower {
  type: PowerType;
  duration: number; // remaining seconds
  totalDuration: number;
  name: string;
}

export interface QuestionItem {
  id: number;
  question: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctKey: 'A' | 'B' | 'C' | 'D';
  category?: string;
}

export interface ScreenTarget {
  id: string;
  type: 'boss' | 'enemy' | 'chest' | 'crate' | 'portal';
  name: string;
  hp?: number;
  maxHp?: number;
  distance: number;
  screenX: number;
  screenY: number;
  visible: boolean;
}

export interface WorldConfig {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  skyColor: number;
  fogColor: number;
  groundColor: number;
  stoneColor: number;
  accentColor: number;
  musicTrack:
    | 'cancion1.mp3'
    | 'cancion2.mp3'
    | 'cancion3.mp3'
    | 'cancion4.mp3'
    | 'cancion5.mp3'
    | 'cancion6.mp3'
    | 'final.mp3'
    | 'menu.mp3'
    | 'juego1.mp3'
    | 'juego2.mp3';
  bossName: string;
  bossTitle: string;
  bossHp: number;
  bossType: 'kraken' | 'titan' | 'malgor' | 'noctar' | 'dragon';
  mainMission: string;
  howToWin: string;
  guideSteps: string[];
  secondaryMissions: string[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  isMain: boolean;
  completed: boolean;
  targetCount?: number;
  currentCount?: number;
}

export interface VehicleState {
  type: 'sports' | 'buggy' | 'bike';
  position: [number, number, number];
  rotation: number;
  speed: number;
  active: boolean;
}

export interface AudioSettings {
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

export interface GameSettings {
  quality: GraphicQuality;
  shadows: boolean;
  cameraSensitivity: number;
  invertY: boolean;
  minimap: boolean;
  audio: AudioSettings;
}
