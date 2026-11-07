import { GameSettings, PlayerCustomization } from '../types/game';

const STORAGE_KEYS = {
  CUSTOMIZATION: 'kabert_player_custom',
  UNLOCKED_WORLD: 'kabert_unlocked_world',
  HIGH_SCORE: 'kabert_high_score',
  SETTINGS: 'kabert_game_settings',
  STATS: 'kabert_all_stats',
};

export const DEFAULT_CUSTOMIZATION: PlayerCustomization = {
  name: 'Aventurero',
  skinColor: '#fbcfe8', // Fair
  hairColor: '#451a03', // Brown
  hairStyle: 'classic',
  shirtColor: '#0284c7', // Cyan Blue
  pantsColor: '#1e3a8a', // Dark Navy
  shoesColor: '#1e293b', // Dark Slate
  accessory: 'none',
};

export const DEFAULT_SETTINGS: GameSettings = {
  quality: 'high',
  shadows: true,
  cameraSensitivity: 1.0,
  invertY: false,
  minimap: true,
  audio: {
    musicVolume: 0.6,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true,
  },
};

export const Storage = {
  getCustomization(): PlayerCustomization {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMIZATION);
      return data ? JSON.parse(data) : DEFAULT_CUSTOMIZATION;
    } catch {
      return DEFAULT_CUSTOMIZATION;
    }
  },

  saveCustomization(custom: PlayerCustomization) {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMIZATION, JSON.stringify(custom));
    } catch {
      // storage unavailable
    }
  },

  getUnlockedWorld(): number {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.UNLOCKED_WORLD);
      return val ? parseInt(val, 10) : 1;
    } catch {
      return 1;
    }
  },

  saveUnlockedWorld(worldId: number) {
    try {
      const current = Storage.getUnlockedWorld();
      if (worldId > current) {
        localStorage.setItem(STORAGE_KEYS.UNLOCKED_WORLD, worldId.toString());
      }
    } catch {
      // ignore
    }
  },

  getHighScore(): number {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  },

  saveHighScore(score: number) {
    try {
      const current = Storage.getHighScore();
      if (score > current) {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
      }
    } catch {
      // ignore
    }
  },

  getSettings(): GameSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: GameSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  },
};
