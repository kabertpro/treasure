import React, { useEffect } from 'react';
import { Play, Volume2, VolumeX, RotateCcw, Home, Music, Phone, Globe, Sparkles } from 'lucide-react';
import { GameSettings } from '../types/game';
import { soundManager } from '../utils/audio';

interface PauseModalProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onResume: () => void;
  onRestartWorld: () => void;
  onExitToMenu: () => void;
  onOpenMusicStation?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  settings,
  onUpdateSettings,
  onResume,
  onRestartWorld,
  onExitToMenu,
  onOpenMusicStation,
}) => {
  // Ensure pointer lock is released when pause menu is open
  useEffect(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="voxel-box p-6 bg-slate-900 border-amber-500 max-w-lg w-full text-white shadow-2xl relative flex flex-col space-y-4">
        {/* Title */}
        <div className="text-center border-b border-slate-700 pb-3">
          <h2 className="font-pixel text-base text-amber-400">JUEGO EN PAUSA</h2>
          <p className="text-xs text-slate-400">Ajustes y opciones de aventura</p>
        </div>

        {/* Audio Controls */}
        <div className="bg-slate-950/70 p-3 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-sky-400" />
              Música de Fondo
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.audio.musicVolume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                soundManager.setMusicVolume(vol);
                onUpdateSettings({ ...settings, audio: { ...settings.audio, musicVolume: vol } });
              }}
              className="w-32 accent-amber-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              Efectos de Sonido
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.audio.sfxVolume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                soundManager.setSfxVolume(vol);
                onUpdateSettings({ ...settings, audio: { ...settings.audio, sfxVolume: vol } });
              }}
              className="w-32 accent-amber-500"
            />
          </div>

          <div className="flex justify-between gap-2 pt-1 border-t border-slate-800/80">
            <button
              onClick={() => {
                const next = !settings.audio.musicEnabled;
                soundManager.setMusicEnabled(next);
                onUpdateSettings({ ...settings, audio: { ...settings.audio, musicEnabled: next } });
              }}
              className={`voxel-box voxel-btn px-3 py-1.5 text-xs font-bold flex-1 flex items-center justify-center gap-1.5 ${
                settings.audio.musicEnabled ? 'bg-sky-900 border-sky-500 text-sky-200' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {settings.audio.musicEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Música: {settings.audio.musicEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => {
                const next = !settings.audio.sfxEnabled;
                soundManager.setSfxEnabled(next);
                onUpdateSettings({ ...settings, audio: { ...settings.audio, sfxEnabled: next } });
              }}
              className={`voxel-box voxel-btn px-3 py-1.5 text-xs font-bold flex-1 flex items-center justify-center gap-1.5 ${
                settings.audio.sfxEnabled ? 'bg-emerald-900 border-emerald-500 text-emerald-200' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {settings.audio.sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Efectos: {settings.audio.sfxEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Graphics Quality */}
        <div className="bg-slate-950/70 p-3 border border-slate-800">
          <span className="text-xs font-bold text-slate-300 block mb-2">Rendimiento Gráfico:</span>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as const).map((q) => (
              <button
                key={q}
                onClick={() => onUpdateSettings({ ...settings, quality: q })}
                className={`voxel-box voxel-btn py-1.5 text-xs font-bold ${
                  settings.quality === q
                    ? 'bg-amber-600 text-white border-amber-400'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {q === 'low' ? 'Baja' : q === 'medium' ? 'Media' : 'Alta (60 FPS)'}
              </button>
            ))}
          </div>
        </div>

        {/* In-Game Music Station Button */}
        {onOpenMusicStation && (
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenMusicStation();
            }}
            className="voxel-box voxel-btn p-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
          >
            <Music className="w-4 h-4 text-purple-200" />
            <span>ESTACIÓN DE MÚSICA (MP3 & CARPETA)</span>
          </button>
        )}

        {/* Direct Links (WhatsApp & Web) */}
        <div className="bg-slate-950/90 border border-slate-800 p-2.5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
          <a
            href="https://wa.me/59165596602?text=Hola%20Luis%20Miguel,%20te%20escribo%20desde%20el%20videojuego%20KABERT%20TREASURE!"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-bold"
            title="Abrir chat directo de WhatsApp"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp: +591 65596602</span>
          </a>

          <a
            href="https://ais-pre-3d57wlwc6dwup3ub577bc5-878358812835.us-east1.run.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition-colors font-bold"
            title="Visitar Web Oficial"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>KABERT LAB by LMKE</span>
          </a>
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onResume}
            className="voxel-box voxel-btn p-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            <span>REANUDAR</span>
          </button>
          <button
            onClick={onExitToMenu}
            className="voxel-box voxel-btn p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>MENÚ PRINCIPAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
