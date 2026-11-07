import React, { useState } from 'react';
import {
  Play,
  Globe,
  User,
  FileText,
  Settings,
  Music,
  Info,
  Sparkles,
  Lock,
  CheckCircle2,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { PlayerCustomization, WorldConfig } from '../types/game';
import { WORLDS_DATA } from '../game/worldsData';
import { soundManager } from '../utils/audio';
import { PWAInstallButton } from './PWAInstallButton';

interface MainMenuProps {
  customization: PlayerCustomization;
  unlockedWorldId: number;
  onStartGame: (worldId: number) => void;
  onOpenCharacterCreator: () => void;
  onOpenKabManager: () => void;
  onOpenMusicStation: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  customization,
  unlockedWorldId,
  onStartGame,
  onOpenCharacterCreator,
  onOpenKabManager,
  onOpenMusicStation,
  onOpenSettings,
}) => {
  const [showWorldSelector, setShowWorldSelector] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col justify-between p-4 md:p-8 select-none overflow-y-auto">
      {/* Background Stylized Voxel Grid Effect */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#0284c7 2px, transparent 2px), radial-gradient(#38bdf8 2px, #020617 2px)',
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px',
        }}
      />

      {/* Top Bar: Player Profile, Install App Button & Quick Badges */}
      <div className="relative z-10 flex flex-wrap justify-between items-center gap-3 w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-3 voxel-box px-3.5 py-2 bg-slate-900/90 border-slate-700">
          <div className="w-8 h-8 rounded-none border border-amber-400 flex items-center justify-center bg-slate-800">
            <User className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-300">{customization.name}</div>
            <div className="text-[10px] text-emerald-400 font-pixel">
              MUNDO {unlockedWorldId} DESBLOQUEADO
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton variant="compact" />

          <button
            onClick={() => {
              soundManager.playClick();
              setShowCredits(true);
            }}
            className="voxel-box voxel-btn px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-amber-400 flex items-center gap-1.5"
          >
            <Info className="w-4 h-4" />
            <span>CRÉDITOS</span>
          </button>
        </div>
      </div>

      {/* Hero Center Title Section */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center my-6">
        <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-none">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>KABERT LAB by LMKE PRESENTA</span>
        </div>

        <h1 className="font-pixel text-3xl sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)] tracking-wider mb-2">
          KABERT TREASURE
        </h1>

        <p className="text-sm md:text-base text-sky-300 font-semibold tracking-widest uppercase mb-6">
          Explora. Descubre. Responde. ¡Conquista!
        </p>

        {/* Primary Action Buttons */}
        <div className="w-full max-w-sm flex flex-col gap-2.5">
          {/* Main Play Button */}
          <button
            onClick={() => {
              soundManager.playPowerup();
              onStartGame(unlockedWorldId);
            }}
            className="voxel-box voxel-box-gold voxel-btn p-3.5 text-white font-pixel text-sm flex items-center justify-center gap-2.5 cursor-pointer shadow-xl hover:scale-102 transition-transform"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>JUGAR AVENTURA</span>
          </button>

          {/* Select World */}
          <button
            onClick={() => {
              soundManager.playClick();
              setShowWorldSelector(true);
            }}
            className="voxel-box voxel-btn p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2"
          >
            <Globe className="w-4 h-4 text-sky-400" />
            <span>SELECCIONAR MUNDO (1 - 5)</span>
          </button>

          {/* Customize Character */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenCharacterCreator();
            }}
            className="voxel-box voxel-btn p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span>PERSONALIZAR PERSONAJE</span>
          </button>

          {/* Educational Questions Bank */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenKabManager();
            }}
            className="voxel-box voxel-btn p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>BANCO DE PREGUNTAS (.kab)</span>
          </button>

          {/* Music & Audio Station */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenMusicStation();
            }}
            className="voxel-box voxel-btn p-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md"
          >
            <Music className="w-4 h-4 text-purple-200" />
            <span>ESTACIÓN DE MÚSICA (MP3 & CARPETA)</span>
          </button>

          {/* PWA Install Button (Hero Location) */}
          <PWAInstallButton variant="primary" />

          {/* Settings */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenSettings();
            }}
            className="voxel-box voxel-btn p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span>OPCIONES Y VOLUMEN</span>
          </button>
        </div>
      </div>

      {/* Footer Credentials with Direct Clickable Links */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 border-t border-slate-800 pt-3 gap-2">
        <div className="flex items-center gap-2">
          <a
            href="https://ais-pre-3d57wlwc6dwup3ub577bc5-878358812835.us-east1.run.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 font-bold hover:text-amber-300 transition-colors flex items-center gap-1"
            title="Visitar sitio oficial"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>KABERT LAB by LMKE</span>
          </a>
          <span>•</span>
          <span>Autor: Luis Miguel Kapa Escobar</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://wa.me/59165596602?text=Hola%20Luis%20Miguel,%20te%20escribo%20desde%20el%20videojuego%20KABERT%20TREASURE!"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-600 hover:border-emerald-400 text-emerald-300 hover:text-white transition-all font-bold rounded-xs"
            title="Abrir chat directo de WhatsApp con el autor"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp: +591 65596602</span>
            <ExternalLink className="w-3 h-3 text-emerald-400" />
          </a>
        </div>
      </div>

      {/* ======================================================== */}
      {/* WORLD SELECTOR MODAL */}
      {/* ======================================================== */}
      {showWorldSelector && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="voxel-box p-6 bg-slate-900 border-amber-500 max-w-3xl w-full text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
              <div>
                <h2 className="font-pixel text-sm text-amber-400">LOS CINCO GRANDES MUNDOS</h2>
                <p className="text-xs text-slate-400">Explora cada territorio y vence a su colosal jefe</p>
              </div>
              <button
                onClick={() => setShowWorldSelector(false)}
                className="voxel-box px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold"
              >
                CERRAR
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {WORLDS_DATA.map((w) => {
                const isUnlocked = w.id <= unlockedWorldId;
                return (
                  <div
                    key={w.id}
                    className={`voxel-box p-4 flex flex-col justify-between transition-all ${
                      isUnlocked
                        ? 'bg-slate-800/90 border-slate-600 hover:border-amber-400'
                        : 'bg-slate-950/80 border-slate-800 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-pixel text-[11px] text-amber-400">
                          MUNDO {w.id}
                        </span>
                        {isUnlocked ? (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 font-bold border border-emerald-600">
                            DESBLOQUEADO
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-900 text-slate-500 px-2 py-0.5 font-bold border border-slate-700 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> BLOQUEADO
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-white">{w.name}</h3>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{w.description}</p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-700 flex justify-between items-center">
                      <span className="text-[11px] text-amber-300 font-semibold">
                        Jefe: {w.bossName}
                      </span>
                      <button
                        disabled={!isUnlocked}
                        onClick={() => {
                          setShowWorldSelector(false);
                          soundManager.playPowerup();
                          onStartGame(w.id);
                        }}
                        className={`voxel-box px-3 py-1 text-xs font-bold ${
                          isUnlocked
                            ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        {isUnlocked ? 'ENTRAR' : 'BLOQUEADO'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CREDITS & DEVELOPER MODAL WITH DIRECT LINKS */}
      {/* ======================================================== */}
      {showCredits && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="voxel-box p-6 bg-slate-900 border-amber-500 max-w-md w-full text-white shadow-2xl relative text-center">
            <h2 className="font-pixel text-base text-amber-400 mb-2">KABERT TREASURE</h2>
            <p className="text-xs text-sky-300 font-semibold mb-4">«Explora. Descubre. Responde. ¡Conquista!»</p>

            <div className="bg-slate-950 border border-slate-800 p-4 text-xs text-slate-300 space-y-3 mb-4 text-left">
              <div>
                <span className="text-slate-400 font-bold block">Desarrollado por:</span>
                <span className="text-white font-bold text-sm">KABERT LAB by LMKE</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Autor:</span>
                <span className="text-white font-bold text-sm">Luis Miguel Kapa Escobar</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-1">Contacto WhatsApp Directo:</span>
                <a
                  href="https://wa.me/59165596602?text=Hola%20Luis%20Miguel,%20te%20escribo%20desde%20el%20videojuego%20KABERT%20TREASURE!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-950 border border-emerald-500 hover:border-emerald-300 text-emerald-300 hover:text-white rounded-xs font-bold text-sm transition-all"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>+591 65596602 (Abrir WhatsApp)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-1">Página Web Oficial:</span>
                <a
                  href="https://ais-pre-3d57wlwc6dwup3ub577bc5-878358812835.us-east1.run.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-sky-950 border border-sky-500 hover:border-sky-300 text-sky-300 hover:text-white rounded-xs font-bold text-xs transition-all"
                >
                  <Globe className="w-4 h-4 text-sky-400" />
                  <span>KABERT LAB Portafolio Web</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                Construido con tecnología Three.js WebGL Voxel Engine, Web Audio API y PWA instalable para PC y Móviles. 100% portable y autónomo.
              </div>
            </div>

            <button
              onClick={() => setShowCredits(false)}
              className="voxel-box voxel-btn w-full p-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
            >
              CERRAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
