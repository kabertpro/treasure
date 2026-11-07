/**
 * KABERT TREASURE - Central Audio Manager
 * Combines HTML5 Audio for the 8 official MP3 tracks (menu.mp3, cancion1.mp3, cancion2.mp3,
 * cancion3.mp3, cancion4.mp3, cancion5.mp3, cancion6.mp3, final.mp3) with user upload support,
 * fallback procedural Web Audio chiptune synthesis, and 100% procedural sound effects.
 */

export type MusicTrackType =
  | 'menu'
  | 'cancion1'
  | 'cancion2'
  | 'cancion3'
  | 'cancion4'
  | 'cancion5'
  | 'cancion6'
  | 'final'
  | 'juego1'
  | 'juego2';

export interface TrackMetadata {
  id: MusicTrackType;
  fileName: string;
  name: string;
  description: string;
  defaultFolder: string;
}

export const OFFICIAL_TRACKS: TrackMetadata[] = [
  {
    id: 'menu',
    fileName: 'menu.mp3',
    name: 'Menú Principal & Inicio',
    description: 'Tema aventurero para la pantalla de inicio y creador de personaje.',
    defaultFolder: 'public/audio/menu.mp3',
  },
  {
    id: 'cancion1',
    fileName: 'cancion1.mp3',
    name: 'Mundo 1: Isla del Tesoro',
    description: 'Ambiente tropical, brisa marina, playas y templos de piedra.',
    defaultFolder: 'public/audio/cancion1.mp3',
  },
  {
    id: 'cancion2',
    fileName: 'cancion2.mp3',
    name: 'Mundo 2: Ciudad Perdida',
    description: 'Metrópolis voxel futurista, autopistas y drones de combate.',
    defaultFolder: 'public/audio/cancion2.mp3',
  },
  {
    id: 'cancion3',
    fileName: 'cancion3.mp3',
    name: 'Mundo 3: Montañas de Hielo / Bosque',
    description: 'Paisajes helados, cumbres nevadas y mística de exploración.',
    defaultFolder: 'public/audio/cancion3.mp3',
  },
  {
    id: 'cancion4',
    fileName: 'cancion4.mp3',
    name: 'Mundo 4: Fortaleza de Fuego / Nocturno',
    description: 'Castillos de obsidiana, murallas góticas y ríos de lava ardiente.',
    defaultFolder: 'public/audio/cancion4.mp3',
  },
  {
    id: 'cancion5',
    fileName: 'cancion5.mp3',
    name: 'Mundo 5: Reino del Cielo / Tesoro',
    description: 'Islas flotantes celestiales y la ciudadela del Dragón Omega.',
    defaultFolder: 'public/audio/cancion5.mp3',
  },
  {
    id: 'cancion6',
    fileName: 'cancion6.mp3',
    name: 'Combate Contra Jefes Finales',
    description: 'Música épica y tensa para los enfrentamientos contra Kraken, Titán, etc.',
    defaultFolder: 'public/audio/cancion6.mp3',
  },
  {
    id: 'final',
    fileName: 'final.mp3',
    name: 'Victoria Final & Créditos',
    description: 'Fanfarria triunfal de conquista, recompensa y tarjeta de honor.',
    defaultFolder: 'public/audio/final.mp3',
  },
];

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicAudio: HTMLAudioElement | null = null;
  private currentTrack: MusicTrackType | null = null;
  private musicVolume: number = 0.6;
  private sfxVolume: number = 0.8;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;

  // Custom user-loaded audio files (in-memory Blob URLs or persistent Object URLs)
  private customAudioMap: Map<string, { url: string; fileName: string }> = new Map();

  // Procedural Synth Fallback for Music when MP3 is absent
  private synthMusicInterval: number | null = null;
  private isUsingSynthMusic: boolean = false;
  private synthNoteIndex: number = 0;

  // Vehicle Engine Node
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicAudio) {
      this.musicAudio.volume = this.musicVolume;
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    } else if (this.currentTrack) {
      this.playMusic(this.currentTrack);
    }
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public getSettings() {
    return {
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      musicEnabled: this.musicEnabled,
      sfxEnabled: this.sfxEnabled,
    };
  }

  /**
   * Register a custom loaded MP3 file for a specific track ID
   */
  public registerCustomAudio(trackId: MusicTrackType, fileUrl: string, fileName: string) {
    this.customAudioMap.set(trackId, { url: fileUrl, fileName });
    if (this.currentTrack === trackId) {
      // Re-trigger current track with new audio
      this.playMusic(trackId, true);
    }
  }

  public getCustomAudio(trackId: MusicTrackType) {
    return this.customAudioMap.get(trackId);
  }

  public removeCustomAudio(trackId: MusicTrackType) {
    this.customAudioMap.delete(trackId);
    if (this.currentTrack === trackId) {
      this.playMusic(trackId, true);
    }
  }

  public getCurrentTrack(): MusicTrackType | null {
    return this.currentTrack;
  }

  public isSynthMode(): boolean {
    return this.isUsingSynthMusic;
  }

  /**
   * Plays one of the official tracks:
   * 'menu', 'cancion1', 'cancion2', 'cancion3', 'cancion4', 'cancion5', 'cancion6', 'final'
   */
  public playMusic(track: MusicTrackType, forceRestart: boolean = false) {
    // Normalization for legacy aliases
    let normalizedTrack: MusicTrackType = track;
    if (track === 'juego1') normalizedTrack = 'cancion1';
    if (track === 'juego2') normalizedTrack = 'cancion2';

    if (!this.musicEnabled) {
      this.currentTrack = normalizedTrack;
      return;
    }

    if (!forceRestart && this.currentTrack === normalizedTrack && (this.musicAudio || this.synthMusicInterval)) {
      return;
    }

    this.stopMusic();
    this.currentTrack = normalizedTrack;

    // 1. Check if user uploaded a custom track in-game
    const custom = this.customAudioMap.get(normalizedTrack);
    if (custom && custom.url) {
      this.playHtmlAudio(custom.url, normalizedTrack);
      return;
    }

    // 2. Candidate paths in public folder
    const fileName = `${normalizedTrack}.mp3`;
    const candidatePaths = [
      `audio/${fileName}`,
      `/audio/${fileName}`,
      `music/${fileName}`,
      `/music/${fileName}`,
      fileName,
    ];

    this.tryPlayCandidatePaths(candidatePaths, 0, normalizedTrack);
  }

  private tryPlayCandidatePaths(paths: string[], index: number, track: MusicTrackType) {
    if (index >= paths.length) {
      // All file path attempts exhausted, fallback to procedural chiptune synth
      this.startProceduralMusic(track);
      return;
    }

    const path = paths[index];
    const audio = new Audio();
    audio.src = path;
    audio.loop = true;
    audio.volume = this.musicVolume;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.musicAudio = audio;
          this.isUsingSynthMusic = false;
        })
        .catch(() => {
          // Try next path
          this.tryPlayCandidatePaths(paths, index + 1, track);
        });
    } else {
      audio.onerror = () => {
        this.tryPlayCandidatePaths(paths, index + 1, track);
      };
      this.musicAudio = audio;
    }
  }

  private playHtmlAudio(src: string, track: MusicTrackType) {
    const audio = new Audio();
    audio.src = src;
    audio.loop = true;
    audio.volume = this.musicVolume;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.musicAudio = audio;
          this.isUsingSynthMusic = false;
        })
        .catch(() => {
          this.startProceduralMusic(track);
        });
    } else {
      audio.onerror = () => {
        this.startProceduralMusic(track);
      };
      this.musicAudio = audio;
    }
  }

  public stopMusic() {
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
      this.musicAudio = null;
    }
    if (this.synthMusicInterval) {
      window.clearInterval(this.synthMusicInterval);
      this.synthMusicInterval = null;
    }
    this.isUsingSynthMusic = false;
  }

  /**
   * Procedural Web Audio Music Synthesizer
   * Generates tailored 8-bit / 16-bit voxel melodies dynamically for each world mood!
   */
  private startProceduralMusic(track: MusicTrackType) {
    this.stopMusic();
    this.initContext();
    if (!this.ctx || !this.musicEnabled) return;

    this.isUsingSynthMusic = true;
    this.synthNoteIndex = 0;

    // Melody scale frequencies tailored for each of the 8 tracks
    const scales: Record<string, number[]> = {
      menu: [261.63, 329.63, 392.0, 523.25, 440.0, 392.0, 329.63, 293.66], // C major pleasant & adventuring
      cancion1: [293.66, 369.99, 440.0, 554.37, 440.0, 369.99, 329.63, 369.99], // D tropical island breeze
      cancion2: [220.0, 261.63, 329.63, 392.0, 329.63, 261.63, 246.94, 220.0], // A minor cyber urban mistery
      cancion3: [349.23, 440.0, 523.25, 659.25, 523.25, 440.0, 392.0, 349.23], // F major crystal ice echo
      cancion4: [164.81, 196.0, 220.0, 246.94, 220.0, 196.0, 174.61, 164.81], // E phrygian deep lava fortress
      cancion5: [196.0, 246.94, 293.66, 392.0, 440.0, 392.0, 293.66, 246.94], // G ethereal floating kingdom
      cancion6: [146.83, 174.61, 220.0, 293.66, 220.0, 174.61, 138.59, 146.83], // D dramatic boss battle tension
      final: [196.0, 246.94, 293.66, 392.0, 493.88, 392.0, 293.66, 246.94], // Grand hero victory fanfare
    };

    const key = scales[track] ? track : 'menu';
    const notes = scales[key];
    const tempoMs =
      track === 'cancion6' ? 175 :
      track === 'final' ? 210 :
      track === 'menu' ? 280 :
      240;

    this.synthMusicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicEnabled) return;

      const freq = notes[this.synthNoteIndex % notes.length];
      const bassFreq = freq / 2;

      // Play soft lead note
      this.playSynthTone(freq, 'triangle', 0.18, this.musicVolume * 0.12);

      // Play bass pulse
      if (this.synthNoteIndex % 2 === 0) {
        this.playSynthTone(bassFreq, 'sine', 0.28, this.musicVolume * 0.16);
      }

      this.synthNoteIndex++;
    }, tempoMs);
  }

  private playSynthTone(freq: number, type: OscillatorType, duration: number, vol: number) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // AudioContext safety
    }
  }

  // ==========================================
  // PROCEDURAL SOUND EFFECTS (WEB AUDIO API)
  // ==========================================

  public playStep() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90 + Math.random() * 40, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(this.sfxVolume * 0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playJump() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playLand() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playShoot() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(this.sfxVolume * 0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  public playHit() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(240, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playExplosion() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sfxVolume * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  public playDiamond() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const freqs = [659.25, 830.61, 987.77, 1318.51]; // E major arpeggio
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(this.sfxVolume * 0.28, this.ctx!.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.05 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + idx * 0.05);
      osc.stop(this.ctx!.currentTime + idx * 0.05 + 0.18);
    });
  }

  public playStar() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C major chime
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(this.sfxVolume * 0.3, this.ctx!.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + idx * 0.06);
      osc.stop(this.ctx!.currentTime + idx * 0.06 + 0.25);
    });
  }

  public playChestOpen() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public playKeyPickup() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(784, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1046, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  public playQuestionPrompt() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const freqs = [440, 554, 659];
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(this.sfxVolume * 0.3, this.ctx!.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + idx * 0.08);
      osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.2);
    });
  }

  public playCorrect() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const chord = [523.25, 659.25, 783.99, 1046.5]; // C major fanfare
    chord.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, this.ctx!.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + idx * 0.06);
      osc.stop(this.ctx!.currentTime + idx * 0.06 + 0.4);
    });
  }

  public playWrong() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.setValueAtTime(140, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  public playShieldBounce() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playPowerup() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(this.sfxVolume * 0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }

  public playBossRoar() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(160, this.ctx.currentTime + 0.3);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.85);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.85);
  }

  public startVehicleEngine() {
    if (this.isEngineRunning || !this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(this.sfxVolume * 0.15, this.ctx.currentTime);

      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch {
      // ignore
    }
  }

  public updateVehiclePitch(speedFraction: number) {
    if (this.engineOsc && this.ctx && this.isEngineRunning) {
      const targetFreq = 50 + speedFraction * 130;
      this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
    }
  }

  public stopVehicleEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {
        // ignore
      }
      this.engineOsc = null;
    }
    if (this.engineGain) {
      this.engineGain.disconnect();
      this.engineGain = null;
    }
    this.isEngineRunning = false;
  }

  public playClick() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(this.sfxVolume * 0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  public playVictory() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, this.ctx!.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.12 + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + idx * 0.12);
      osc.stop(this.ctx!.currentTime + idx * 0.12 + 0.5);
    });
  }

  public playGameOver() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const notes = [392.0, 369.99, 349.23, 329.63, 293.66, 261.63];
    notes.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime + idx * 0.16);

      gain.gain.setValueAtTime(this.sfxVolume * 0.3, this.ctx!.currentTime + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.16 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + idx * 0.16);
      osc.stop(this.ctx!.currentTime + idx * 0.16 + 0.4);
    });
  }
}

export const soundManager = new SoundManager();
