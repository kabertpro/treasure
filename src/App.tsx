import React, { useState, useEffect, useRef } from 'react';
import {
  ActivePower,
  CameraMode,
  GameState,
  PlayerCustomization,
  PlayerStats,
  QuestionItem,
  ScreenTarget,
  WorldConfig,
} from './types/game';
import { WORLDS_DATA } from './game/worldsData';
import { DEFAULT_PREGUNTAS_KAB, parseKabFile } from './data/questionsData';
import { DEFAULT_CUSTOMIZATION, DEFAULT_SETTINGS, Storage } from './utils/storage';
import { soundManager } from './utils/audio';
import { GameEngine } from './game/GameEngine';

// Components
import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { CharacterCreator } from './components/CharacterCreator';
import { QuestionModal } from './components/QuestionModal';
import { KabFileManager } from './components/KabFileManager';
import { MapModal } from './components/MapModal';
import { MissionsModal } from './components/MissionsModal';
import { MissionDossierModal } from './components/MissionDossierModal';
import { PauseModal } from './components/PauseModal';
import { EndGameModal } from './components/EndGameModal';
import { MobileControls } from './components/MobileControls';
import { MusicManagerModal } from './components/MusicManagerModal';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [customization, setCustomization] = useState<PlayerCustomization>(() => Storage.getCustomization());
  const [unlockedWorldId, setUnlockedWorldId] = useState<number>(() => Storage.getUnlockedWorld());
  const [currentWorldId, setCurrentWorldId] = useState<number>(1);
  const [settings, setSettings] = useState(() => Storage.getSettings());
  const [questions, setQuestions] = useState<QuestionItem[]>(() => {
    const res = parseKabFile(DEFAULT_PREGUNTAS_KAB);
    return res.questions;
  });

  // Game Engine dynamic stats
  const [stats, setStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    ammo: 10,
    maxAmmo: 10,
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
  });

  const [activePower, setActivePower] = useState<ActivePower | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('third');
  const [inVehicle, setInVehicle] = useState<boolean>(false);
  const [activeQuestion, setActiveQuestion] = useState<QuestionItem | null>(null);
  const [bossInfo, setBossInfo] = useState<{ name: string; title: string; hp: number; maxHp: number } | null>(null);
  const [hudMessage, setHudMessage] = useState<string | null>(null);
  const [screenTargets, setScreenTargets] = useState<ScreenTarget[]>([]);
  const [bossBearing, setBossBearing] = useState<{ angle: number; distance: number; name: string } | null>(null);
  const [portalActive, setPortalActive] = useState<boolean>(false);

  // Minimap Tracker State
  const [minimapData, setMinimapData] = useState<{
    player: { x: number; z: number; rotation: number };
    enemies: { x: number; z: number }[];
    treasures: { x: number; z: number; type: string }[];
    boss: { x: number; z: number } | null;
  }>({
    player: { x: 0, z: 0, rotation: 0 },
    enemies: [],
    treasures: [],
    boss: null,
  });

  // Modals inside playing state
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isKabManagerOpen, setIsKabManagerOpen] = useState(false);
  const [isMusicStationOpen, setIsMusicStationOpen] = useState(false);

  // Check Touch Screen
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Play Menu Audio on initial load
  useEffect(() => {
    if (gameState === 'menu' || gameState === 'character_create') {
      soundManager.playMusic('menu');
    }
  }, [gameState]);

  const activeWorldConfig = WORLDS_DATA.find((w) => w.id === currentWorldId) || WORLDS_DATA[0];

  // Start or change game
  const startGame = (worldId: number) => {
    setCurrentWorldId(worldId);
    setGameState('playing');
    setIsPauseOpen(false);
    setIsMapOpen(false);
    setIsMissionsOpen(false);
    setIsDossierOpen(false);
  };

  // Initialize GameEngine when entering 'playing'
  useEffect(() => {
    if (gameState !== 'playing' || !canvasMountRef.current) return;

    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }

    const engine = new GameEngine(
      canvasMountRef.current,
      activeWorldConfig,
      customization,
      questions,
      {
        onStatsChange: (newStats) => setStats(newStats),
        onActivePowerChange: (power) => setActivePower(power),
        onQuestionTrigger: (q) => {
          if (document.pointerLockElement) {
            document.exitPointerLock();
          }
          setIsDossierOpen(false);
          setIsMapOpen(false);
          setIsMissionsOpen(false);
          setActiveQuestion(q);
        },
        onBossChange: (b) => setBossInfo(b),
        onMessage: (msg) => {
          setHudMessage(msg);
          setTimeout(() => setHudMessage(null), 3500);
        },
        onWorldComplete: (wId) => {
          if (wId < 5) {
            const nextWorld = wId + 1;
            setUnlockedWorldId((prev) => Math.max(prev, nextWorld));
            Storage.saveUnlockedWorld(nextWorld);
            setTimeout(() => {
              setCurrentWorldId(nextWorld);
              engineRef.current?.loadWorld(WORLDS_DATA[nextWorld - 1]);
            }, 3000);
          } else {
            // Victory on World 5
            setGameState('victory');
            Storage.saveHighScore(stats.score + 500);
          }
        },
        onGameOver: () => {
          setGameState('game_over');
          Storage.saveHighScore(stats.score);
        },
        onVehicleChange: (veh) => setInVehicle(veh),
        onBossDefeated: () => {
          setPortalActive(true);
        },
      }
    );

    engineRef.current = engine;

    // Minimap and screen targets sync interval
    const minimapInterval = setInterval(() => {
      if (engineRef.current) {
        setMinimapData(engineRef.current.getMinimapData());
        const { targets, bossBearing: bearing } = engineRef.current.getScreenTargets();
        setScreenTargets(targets);
        setBossBearing(bearing);
        setPortalActive(engineRef.current.isPortalReady());
      }
    }, 80);

    return () => {
      clearInterval(minimapInterval);
      engine.dispose();
      engineRef.current = null;
    };
  }, [gameState, currentWorldId]);

  // Global Keyboard shortcuts (M for map, Tab/J for dossier, Esc for pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      if (e.code === 'KeyM') {
        setIsMapOpen((prev) => !prev);
      }
      if (e.code === 'Tab' || e.code === 'KeyJ') {
        e.preventDefault();
        setIsDossierOpen((prev) => {
          const next = !prev;
          if (next) {
            engineRef.current?.pause();
          } else {
            engineRef.current?.resume();
          }
          return next;
        });
      }
      if (e.code === 'Escape') {
        setIsPauseOpen((prev) => {
          const next = !prev;
          if (next) engineRef.current?.pause();
          else engineRef.current?.resume();
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-game">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        className={`w-full h-full ${gameState === 'playing' ? 'block' : 'hidden'}`}
      />

      {/* Main Menu Screen */}
      {gameState === 'menu' && (
        <MainMenu
          customization={customization}
          unlockedWorldId={unlockedWorldId}
          onStartGame={(worldId) => startGame(worldId)}
          onOpenCharacterCreator={() => setGameState('character_create')}
          onOpenKabManager={() => setIsKabManagerOpen(true)}
          onOpenMusicStation={() => setIsMusicStationOpen(true)}
          onOpenSettings={() => setIsPauseOpen(true)}
        />
      )}

      {/* Character Creator Screen */}
      {gameState === 'character_create' && (
        <CharacterCreator
          initialCustomization={customization}
          onSave={(newCustom) => {
            setCustomization(newCustom);
            Storage.saveCustomization(newCustom);
            setGameState('menu');
          }}
          onBack={() => setGameState('menu')}
        />
      )}

      {/* In-Game HUD Overlay */}
      {gameState === 'playing' && (
        <>
          <HUD
            stats={stats}
            world={activeWorldConfig}
            activePower={activePower}
            cameraMode={cameraMode}
            inVehicle={inVehicle}
            bossInfo={bossInfo}
            message={hudMessage}
            portalActive={portalActive}
            screenTargets={screenTargets}
            bossBearing={bossBearing}
            onToggleCamera={() => {
              engineRef.current?.toggleCamera();
              setCameraMode((prev) => (prev === 'third' ? 'first' : 'third'));
            }}
            onToggleVehicle={() => engineRef.current?.toggleVehicle()}
            onOpenMap={() => setIsMapOpen(true)}
            onOpenMissions={() => setIsMissionsOpen(true)}
            onOpenDossier={() => {
              engineRef.current?.pause();
              setIsDossierOpen(true);
            }}
            onPause={() => {
              engineRef.current?.pause();
              setIsPauseOpen(true);
            }}
            onInteract={() => engineRef.current?.interactNearPlayer()}
            onEnterPortal={() => engineRef.current?.enterPortal()}
            minimapData={minimapData}
          />

          {/* Mobile On-Screen Controls */}
          {isTouchDevice && (
            <MobileControls
              onJoystickMove={(x, y) => engineRef.current?.setJoystick(x, y)}
              onJump={() => engineRef.current?.triggerJump()}
              onShoot={() => engineRef.current?.triggerShoot()}
              onAimToggle={() => engineRef.current?.setAim(true)}
              onInteract={() => engineRef.current?.interactNearPlayer()}
              onToggleVehicle={() => engineRef.current?.toggleVehicle()}
              onToggleCamera={() => {
                engineRef.current?.toggleCamera();
                setCameraMode((prev) => (prev === 'third' ? 'first' : 'third'));
              }}
              onOpenMap={() => setIsMapOpen(true)}
            />
          )}
        </>
      )}

      {/* Question Challenge Modal */}
      {activeQuestion && (
        <QuestionModal
          question={activeQuestion}
          onAnswer={(isCorrect, timeBonus) => {
            engineRef.current?.handleQuestionAnswer(isCorrect, timeBonus);
            setActiveQuestion(null);
          }}
        />
      )}

      {/* Tactical Map Modal */}
      {isMapOpen && (
        <MapModal
          world={activeWorldConfig}
          playerPos={minimapData.player}
          onClose={() => setIsMapOpen(false)}
        />
      )}

      {/* Missions Modal */}
      {isMissionsOpen && (
        <MissionsModal
          world={activeWorldConfig}
          onClose={() => setIsMissionsOpen(false)}
        />
      )}

      {/* Tactical Mission Dossier Modal */}
      {isDossierOpen && (
        <MissionDossierModal
          world={activeWorldConfig}
          stats={stats}
          bossHp={bossInfo}
          onClose={() => {
            setIsDossierOpen(false);
            engineRef.current?.resume();
          }}
        />
      )}

      {/* Pause & Settings Modal */}
      {isPauseOpen && (
        <PauseModal
          settings={settings}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            Storage.saveSettings(newSettings);
          }}
          onResume={() => {
            setIsPauseOpen(false);
            engineRef.current?.resume();
          }}
          onRestartWorld={() => {
            setIsPauseOpen(false);
            engineRef.current?.loadWorld(activeWorldConfig);
          }}
          onOpenMusicStation={() => setIsMusicStationOpen(true)}
          onExitToMenu={() => {
            setIsPauseOpen(false);
            engineRef.current?.dispose();
            engineRef.current = null;
            setGameState('menu');
          }}
        />
      )}

      {/* Music & Audio Station Modal */}
      {isMusicStationOpen && (
        <MusicManagerModal onClose={() => setIsMusicStationOpen(false)} />
      )}

      {/* .kab Questions Bank Manager */}
      {isKabManagerOpen && (
        <KabFileManager
          currentQuestions={questions}
          onUpdateQuestions={(newQuestions) => setQuestions(newQuestions)}
          onClose={() => setIsKabManagerOpen(false)}
        />
      )}

      {/* End Game Modal (Victory / Game Over) */}
      {(gameState === 'victory' || gameState === 'game_over') && (
        <EndGameModal
          isVictory={gameState === 'victory'}
          stats={stats}
          customization={customization}
          completedWorldsCount={gameState === 'victory' ? 5 : currentWorldId - 1}
          onRestart={() => {
            setStats({
              health: 100,
              maxHealth: 100,
              ammo: 10,
              maxAmmo: 10,
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
            });
            startGame(1);
          }}
          onExitToMenu={() => setGameState('menu')}
        />
      )}
    </div>
  );
}
