import React, { useEffect, useRef, useState } from 'react';
import {
  Heart,
  Crosshair,
  Shield,
  Zap,
  Wind,
  Compass,
  Map as MapIcon,
  Pause,
  Key,
  Gem,
  Star,
  Eye,
  Car,
  Camera,
  Target,
  Skull,
  HelpCircle,
  ArrowRight,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import { ActivePower, CameraMode, PlayerStats, ScreenTarget, WorldConfig } from '../types/game';

interface HUDProps {
  stats: PlayerStats;
  world: WorldConfig;
  activePower: ActivePower | null;
  cameraMode: CameraMode;
  inVehicle: boolean;
  bossInfo: { name: string; title: string; hp: number; maxHp: number } | null;
  message: string | null;
  portalActive: boolean;
  screenTargets: ScreenTarget[];
  bossBearing: { angle: number; distance: number; name: string } | null;
  onToggleCamera: () => void;
  onToggleVehicle: () => void;
  onOpenMap: () => void;
  onOpenMissions: () => void;
  onOpenDossier: () => void;
  onPause: () => void;
  onInteract: () => void;
  onEnterPortal: () => void;
  minimapData: {
    player: { x: number; z: number; rotation: number };
    enemies: { x: number; z: number }[];
    treasures: { x: number; z: number; type: string }[];
    boss: { x: number; z: number } | null;
  };
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  world,
  activePower,
  cameraMode,
  inVehicle,
  bossInfo,
  message,
  portalActive,
  screenTargets,
  bossBearing,
  onToggleCamera,
  onToggleVehicle,
  onOpenMap,
  onOpenMissions,
  onOpenDossier,
  onPause,
  onInteract,
  onEnterPortal,
  minimapData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Draw real-time dynamic minimap on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const half = size / 2;
    const scale = 0.55;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    // World boundary box
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(half - 90 * scale, half - 90 * scale, 180 * scale, 180 * scale);

    // Draw Treasures
    minimapData.treasures.forEach((t) => {
      const tx = half + t.x * scale;
      const ty = half + t.z * scale;
      if (t.type === 'diamond') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(tx - 2, ty - 2, 4, 4);
      } else if (t.type === 'star') {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(tx - 2, ty - 2, 4, 4);
      } else if (t.type === 'key') {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(tx - 2, ty - 2, 4, 4);
      } else {
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(tx - 3, ty - 3, 6, 6);
      }
    });

    // Draw Enemies
    ctx.fillStyle = '#ef4444';
    minimapData.enemies.forEach((e) => {
      const ex = half + e.x * scale;
      const ey = half + e.z * scale;
      ctx.beginPath();
      ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Boss
    if (minimapData.boss) {
      const bx = half + minimapData.boss.x * scale;
      const by = half + minimapData.boss.z * scale;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw Player
    const px = half + minimapData.player.x * scale;
    const py = half + minimapData.player.z * scale;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(minimapData.player.rotation);

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 5);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [minimapData]);

  // Compute compass rotation arrow degrees
  const compassAngleDeg = bossBearing ? Math.round((bossBearing.angle * 180) / Math.PI) : 0;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none overflow-hidden">
      {/* ======================================================== */}
      {/* 1. TOP BAR: Health, Ammo (+50 Indicator), Waypoint Compass & Score */}
      {/* ======================================================== */}
      <div className="flex items-start justify-between w-full gap-2">
        {/* Left: Health, Ammo & Collectibles */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {/* Health Bar */}
          <div className="voxel-box p-2 bg-slate-900/95 pointer-events-auto flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
            <div className="flex flex-col">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-300">
                <span>SALUD</span>
                <span>{stats.health} / {stats.maxHealth}</span>
              </div>
              <div className="w-36 h-2.5 bg-slate-950 border border-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200"
                  style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Ammo Meter: Highlighted with +50 Indicator */}
          <div className="voxel-box p-2 bg-slate-900/95 pointer-events-auto flex items-center gap-2 border-sky-500/80">
            <Target className="w-5 h-5 text-sky-400" />
            <div className="flex flex-col">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-200">
                <span>MUNICIÓN</span>
                <span className="text-amber-300 font-pixel text-xs">{stats.ammo} / {stats.maxAmmo}</span>
              </div>
              <div className="w-36 h-2.5 bg-slate-950 border border-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-600 to-amber-400 transition-all duration-150"
                  style={{ width: `${Math.min(100, (stats.ammo / stats.maxAmmo) * 100)}%` }}
                />
              </div>
              <span className="text-[9px] text-amber-300 font-bold mt-0.5">
                ★ Responde cofres para +50 municiones
              </span>
            </div>
          </div>

          {/* Collectibles Counters */}
          <div className="flex gap-1.5 pointer-events-auto">
            <div className="voxel-box px-2 py-0.5 bg-slate-900/90 flex items-center gap-1 text-xs font-bold text-sky-300">
              <Gem className="w-3.5 h-3.5 fill-sky-400 text-sky-400" />
              <span>{stats.diamonds}</span>
            </div>
            <div className="voxel-box px-2 py-0.5 bg-slate-900/90 flex items-center gap-1 text-xs font-bold text-amber-300">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{stats.stars}</span>
            </div>
            <div className="voxel-box px-2 py-0.5 bg-slate-900/90 flex items-center gap-1 text-xs font-bold text-yellow-400">
              <Key className="w-3.5 h-3.5" />
              <span>{stats.keys}</span>
            </div>
          </div>
        </div>

        {/* Center: Top Directional Waypoint Compass & Guide Button */}
        <div className="flex flex-col items-center gap-1.5 max-w-md text-center pointer-events-auto">
          {/* Compass Waypoint */}
          {!portalActive && bossBearing && (
            <div className="voxel-box px-4 py-1.5 bg-slate-900/95 border-amber-500 flex items-center gap-2 shadow-lg">
              <div
                className="w-5 h-5 flex items-center justify-center transition-transform duration-100"
                style={{ transform: `rotate(${compassAngleDeg}deg)` }}
              >
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs font-bold text-amber-300 font-pixel">
                OBJETIVO: {bossBearing.name.toUpperCase()} [{bossBearing.distance}m]
              </span>
            </div>
          )}

          {/* Portal Waypoint Banner (When Boss defeated) */}
          {portalActive && (
            <button
              onClick={onEnterPortal}
              className="voxel-box voxel-box-gold voxel-btn px-4 py-2 bg-emerald-600 border-yellow-300 text-white font-pixel text-xs flex items-center gap-2 animate-bounce cursor-pointer shadow-2xl"
            >
              <Sparkles className="w-4 h-4 text-yellow-200" />
              <span>¡PORTAL ABIERTO! CLIC AQUÍ PARA VIAJAR AL SIGUIENTE MUNDO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Prompt / Notification Banner */}
          {message && (
            <div className="voxel-box px-4 py-1 bg-slate-900/95 text-amber-300 text-xs font-bold border-amber-400 shadow-md animate-in fade-in">
              {message}
            </div>
          )}

          {/* Active Power Badge */}
          {activePower && (
            <div className="voxel-box px-3 py-1 bg-sky-950/95 border-sky-400 text-sky-200 text-xs font-bold flex items-center gap-2">
              {activePower.type === 'flight' && <Wind className="w-4 h-4 text-sky-400 animate-spin" />}
              {activePower.type === 'shield' && <Shield className="w-4 h-4 text-cyan-400" />}
              {activePower.type === 'speed' && <Zap className="w-4 h-4 text-amber-400" />}
              {activePower.type === 'treasure_vision' && <Eye className="w-4 h-4 text-purple-400" />}
              <span>{activePower.name}: {Math.ceil(activePower.duration)}s</span>
            </div>
          )}

          {/* "FICHA DE MISIÓN Y GUÍA" Permanent Access Button */}
          <button
            onClick={onOpenDossier}
            className="voxel-box voxel-btn px-3 py-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md border-amber-300"
            title="Abrir Ficha de Misión y Guía (Tab o J)"
          >
            <Compass className="w-3.5 h-3.5 text-yellow-200" />
            <span>📋 FICHA DE MISIÓN Y GUÍA</span>
          </button>
        </div>

        {/* Right: World, Score & Minimap */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 pointer-events-auto">
          <div className="voxel-box p-2 bg-slate-900/95 flex flex-col items-end">
            <div className="text-[10px] font-pixel text-amber-400">
              MUNDO {world.id}: {world.name}
            </div>
            <div className="text-base font-black text-white tracking-wider">
              {stats.score.toLocaleString()} <span className="text-xs text-amber-400">PTS</span>
            </div>
          </div>

          {/* Minimap */}
          <div className="voxel-box p-1 bg-slate-950 rounded-sm relative">
            <canvas ref={canvasRef} width={100} height={100} className="rounded-sm" />
            <div className="absolute bottom-1 right-1 bg-slate-950/80 px-1 text-[8px] font-pixel text-slate-400">
              RADAR
            </div>
          </div>

          {/* Utility Buttons */}
          <div className="flex gap-1">
            <button
              onClick={onToggleCamera}
              className="voxel-box voxel-btn p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1"
              title="Cambiar Cámara (V)"
            >
              <Camera className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">{cameraMode === 'first' ? '1ª' : '3ª'}</span>
            </button>
            <button
              onClick={onToggleVehicle}
              className={`voxel-box voxel-btn p-2 text-xs flex items-center gap-1 ${
                inVehicle ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title="Subir/Bajar Vehículo (F)"
            >
              <Car className="w-4 h-4 text-amber-400" />
            </button>
            <button
              onClick={onOpenMap}
              className="voxel-box voxel-btn p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1"
              title="Ver Mapa (M)"
            >
              <MapIcon className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={onPause}
              className="voxel-box voxel-btn p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1"
              title="Pausar (Esc)"
            >
              <Pause className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. 3D PROJECTED TARGET BADGES ON SCREEN (Who to shoot & what to open) */}
      {/* ======================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {screenTargets.map((target) => (
          <div
            key={target.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-75"
            style={{ left: `${target.screenX}px`, top: `${target.screenY}px` }}
          >
            {target.type === 'boss' && (
              <div className="voxel-box px-2 py-0.5 bg-red-950/90 border-red-500 text-red-300 text-[10px] font-pixel flex items-center gap-1 animate-pulse">
                <Skull className="w-3.5 h-3.5 text-red-400" />
                <span>{target.name} [{target.distance}m]</span>
              </div>
            )}
            {target.type === 'portal' && (
              <div className="voxel-box px-3 py-1 bg-emerald-950/95 border-emerald-400 text-emerald-300 text-[11px] font-pixel flex items-center gap-1.5 animate-bounce shadow-xl">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>PORTAL AL SIGUIENTE MUNDO [{target.distance}m]</span>
              </div>
            )}
            {target.type === 'enemy' && (
              <div className="voxel-box px-1.5 py-0.5 bg-slate-900/85 border-red-500/80 text-red-400 text-[9px] font-bold flex items-center gap-1">
                <span>👹 {target.name} ({target.hp} HP)</span>
              </div>
            )}
            {target.type === 'chest' && (
              <div className="voxel-box px-2 py-0.5 bg-amber-950/90 border-amber-400 text-amber-300 text-[9px] font-pixel flex items-center gap-1 animate-pulse">
                <span>🎁 COFRE: Presiona E (+50 Balas)</span>
              </div>
            )}
            {target.type === 'crate' && (
              <div className="voxel-box px-1.5 py-0.5 bg-slate-900/80 border-slate-600 text-slate-300 text-[8px] font-bold">
                <span>📦 Caja (Disparar)</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ======================================================== */}
      {/* 3. BOSS HEALTH BAR (When engaging boss) */}
      {/* ======================================================== */}
      {bossInfo && (
        <div className="w-full flex justify-center pointer-events-auto my-1">
          <div className="voxel-box p-2.5 bg-red-950/95 border-red-600 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-1">
              <div>
                <span className="font-pixel text-xs text-red-400 uppercase tracking-widest">{bossInfo.name}</span>
                <span className="text-xs text-slate-300 ml-2">({bossInfo.title})</span>
              </div>
              <span className="font-pixel text-xs text-amber-300">{bossInfo.hp} / {bossInfo.maxHp}</span>
            </div>
            <div className="w-full h-3.5 bg-slate-950 border border-red-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 transition-all duration-150"
                style={{ width: `${Math.max(0, (bossInfo.hp / bossInfo.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TACTICAL RETICLE & POINTER LOCK HINT */}
      {/* ======================================================== */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-8 h-8 flex items-center justify-center opacity-85">
          <div className="w-2 h-2 bg-sky-400 border border-white shadow-[0_0_8px_#38bdf8]" />
          <div className="absolute w-6 h-0.5 bg-white/60" />
          <div className="absolute h-6 w-0.5 bg-white/60" />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. BOTTOM BAR: Mission Brief & Interaction Trigger */}
      {/* ======================================================== */}
      <div className="flex justify-between items-end w-full">
        {/* Mission Brief - Clic to open Dossier */}
        <div
          onClick={onOpenDossier}
          className="voxel-box p-2 bg-slate-900/95 pointer-events-auto max-w-sm cursor-pointer hover:bg-slate-800/95 transition-colors border-amber-500/60"
        >
          <div className="flex items-center justify-between text-[11px] text-amber-400 font-pixel mb-0.5">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>MISIÓN PRINCIPAL:</span>
            </div>
            <span className="text-[9px] bg-amber-950 px-1 text-amber-300 border border-amber-700">VER FICHA</span>
          </div>
          <div className="text-xs text-slate-200 font-semibold leading-tight">
            {world.mainMission}
          </div>
        </div>

        {/* Mouse Pointer Lock Hint */}
        <div className="hidden md:block voxel-box px-3 py-1 bg-slate-900/80 text-[10px] text-slate-400">
          Haz clic en pantalla para apuntar con el ratón • Esc para liberar
        </div>

        {/* Interact Button */}
        <button
          onClick={onInteract}
          className="voxel-box voxel-btn px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs pointer-events-auto flex items-center gap-2 shadow-lg"
        >
          <span>INTERACTUAR</span>
          <span className="bg-amber-800 px-1.5 py-0.5 rounded text-[10px] font-pixel">E</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 6. MODAL "¿CÓMO GANAR ESTE NIVEL?" */}
      {/* ======================================================== */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 pointer-events-auto">
          <div className="voxel-box p-6 bg-slate-900 border-amber-500 max-w-lg w-full text-white shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="font-pixel text-xs text-amber-400">
                    GUÍA DEL NIVEL: {world.name.toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-400">Cómo ganar y pasar al siguiente stage</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="voxel-box px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold"
              >
                CERRAR
              </button>
            </div>

            {/* Quick Summary */}
            <div className="bg-amber-950/50 border border-amber-500/60 p-3 mb-3">
              <h4 className="text-xs font-pixel text-amber-300 mb-1">CÓMO PASAR DE NIVEL:</h4>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {world.howToWin}
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-2 mb-4 text-xs">
              <h4 className="text-xs font-pixel text-sky-400">PASOS A SEGUIR:</h4>
              {world.guideSteps.map((step, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-slate-800 p-2.5 flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-500 text-slate-950 font-bold rounded-none flex items-center justify-center shrink-0 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="text-slate-200 font-medium">{step}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="voxel-box voxel-btn w-full p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              ¡ENTENDIDO, VAMOS A CONQUISTARLO!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
