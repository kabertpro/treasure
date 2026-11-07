import React, { useState } from 'react';
import {
  FileText,
  Target,
  Skull,
  Award,
  CheckCircle2,
  X,
  Compass,
  Zap,
  HelpCircle,
  Shield,
  ArrowRight,
  Flame,
  Sparkles,
} from 'lucide-react';
import { PlayerStats, WorldConfig } from '../types/game';

interface MissionDossierModalProps {
  world: WorldConfig;
  stats: PlayerStats;
  bossHp: { hp: number; maxHp: number } | null;
  onClose: () => void;
}

export const MissionDossierModal: React.FC<MissionDossierModalProps> = ({
  world,
  stats,
  bossHp,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'objetivo' | 'enemigos' | 'jefe' | 'secundarias'>('objetivo');

  // Ensure pointer lock is released when dossier modal opens
  React.useEffect(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150">
      <div className="voxel-box p-5 sm:p-6 bg-slate-900 border-amber-500 max-w-2xl w-full text-white shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">
        {/* Dossier Header */}
        <div className="flex justify-between items-start mb-3 border-b-2 border-amber-500/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border-2 border-amber-400 text-amber-400">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-xs text-amber-400 uppercase tracking-widest">
                  FICHA TÁCTICA DE MISIÓN
                </span>
                <span className="bg-emerald-950 border border-emerald-500 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5">
                  ESTAGE {world.id} EN CURSO
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-wide">
                MUNDO {world.id}: {world.name.toUpperCase()}
              </h2>
              <p className="text-xs text-slate-400">{world.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="voxel-box voxel-btn p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            title="Cerrar Ficha (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          <button
            onClick={() => setActiveTab('objetivo')}
            className={`voxel-box p-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'objetivo'
                ? 'bg-amber-600 text-white border-amber-300 shadow-md'
                : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Objetivo &</span> Guía
          </button>

          <button
            onClick={() => setActiveTab('enemigos')}
            className={`voxel-box p-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'enemigos'
                ? 'bg-amber-600 text-white border-amber-300 shadow-md'
                : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Enemigos</span>
          </button>

          <button
            onClick={() => setActiveTab('jefe')}
            className={`voxel-box p-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'jefe'
                ? 'bg-amber-600 text-white border-amber-300 shadow-md'
                : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <Skull className="w-3.5 h-3.5" />
            <span>Jefe Final</span>
          </button>

          <button
            onClick={() => setActiveTab('secundarias')}
            className={`voxel-box p-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'secundarias'
                ? 'bg-amber-600 text-white border-amber-300 shadow-md'
                : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Desafíos</span>
          </button>
        </div>

        {/* Tab 1: Objetivo Principal & Pasos para Ganar */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {activeTab === 'objetivo' && (
            <div className="space-y-3">
              {/* Highlight Box */}
              <div className="bg-amber-950/40 border-2 border-amber-500/80 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-pixel text-amber-400 mb-1">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>MISIÓN PRINCIPAL PARA GANAR EL NIVEL:</span>
                </div>
                <p className="text-base font-bold text-white leading-snug">
                  {world.mainMission}
                </p>
                <div className="mt-2 text-xs text-amber-200 font-medium">
                  {world.howToWin}
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div>
                <h3 className="font-pixel text-xs text-sky-400 mb-2">
                  PASOS EXACTOS PARA COMPLETAR EL ESTAGE:
                </h3>
                <div className="space-y-2">
                  {world.guideSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 border border-slate-800 p-2.5 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-xs">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-200 font-medium leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Portal Info */}
              <div className="bg-emerald-950/40 border border-emerald-500 p-3 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="text-xs text-emerald-200">
                  <span className="font-bold text-white block">PORTAL AL SIGUIENTE ESTAGE:</span>
                  Al vencer al Jefe del sector se materializará el Portal Dimensional. Crúzalo para avanzar al siguiente mundo con toda tu puntuación y munición acumulada.
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Enemigos & A quién disparar */}
          {activeTab === 'enemigos' && (
            <div className="space-y-3">
              <div className="bg-slate-950/80 border border-slate-800 p-3">
                <h3 className="font-pixel text-xs text-red-400 mb-2">
                  BLANCOS Y OBJETIVOS EN ESTE MUNDO:
                </h3>
                <p className="text-xs text-slate-300 mb-3">
                  Apunta con el ratón hacia las etiquetas rojas en pantalla para destruir a los enemigos antes de que te alcancen.
                </p>

                <div className="space-y-2">
                  <div className="bg-slate-900 border border-red-900/60 p-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-sm text-red-300 block">Esbirros Patrulleros (Piratas, Drones, Sombras)</span>
                      <span className="text-xs text-slate-400">Te persiguen cuando estás a menos de 30 metros</span>
                    </div>
                    <span className="bg-red-950 text-red-300 border border-red-700 text-xs px-2 py-1 font-bold">
                      2 a 3 Disparos
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-red-900/60 p-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-sm text-amber-300 block">Guardianes de Élite (Golems, Caballeros)</span>
                      <span className="text-xs text-slate-400">Armadura pesada que custodia las entradas del templo</span>
                    </div>
                    <span className="bg-amber-950 text-amber-300 border border-amber-700 text-xs px-2 py-1 font-bold">
                      4 a 5 Disparos
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-amber-800/60 p-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-sm text-yellow-300 block">Cajas de Suministros (Madera)</span>
                      <span className="text-xs text-slate-400">Dispara directamente para romperlas</span>
                    </div>
                    <span className="bg-amber-900 text-yellow-200 border border-yellow-700 text-xs px-2 py-1 font-bold">
                      1 Disparo (+2 Balas)
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-sky-800/60 p-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-sm text-sky-300 block">Cofres Educativos Dorados</span>
                      <span className="text-xs text-slate-400">Acércate y presiona 'E' para responder</span>
                    </div>
                    <span className="bg-sky-950 text-sky-200 border border-sky-600 text-xs px-2 py-1 font-bold">
                      ¡+50 BALAS POR ACIERTO!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Jefe Final */}
          {activeTab === 'jefe' && (
            <div className="space-y-3">
              <div className="bg-red-950/40 border-2 border-red-600 p-4">
                <div className="flex items-center gap-2 text-xs font-pixel text-red-400 mb-1">
                  <Skull className="w-5 h-5 text-red-400" />
                  <span>COLOSO FINAL DEL SECTOR:</span>
                </div>
                <h3 className="text-xl font-black text-white">{world.bossName.toUpperCase()}</h3>
                <p className="text-xs text-amber-300 font-bold mb-3">{world.bossTitle}</p>

                <div className="bg-slate-950 p-3 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Salud Total:</span>
                    <span className="font-pixel text-red-400">{world.bossHp} HP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Ubicación:</span>
                    <span className="text-amber-300 font-bold">Sector Norte (Sigue la brújula)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Fase 2 de Furia:</span>
                    <span className="text-orange-400 font-bold">Se activa al bajar del 50% de HP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Recompensa:</span>
                    <span className="text-emerald-400 font-bold">+500 PTS y Apertura del Portal</span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-200">
                  <span className="font-bold text-amber-300 block mb-1">Estrategia recomendada:</span>
                  Dispara a distancia, muévete de lado a lado para esquivar sus proyectiles y utiliza vehículos o el poder de Vuelo/Escudo para mantenerte a salvo.
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Misiones Secundarias */}
          {activeTab === 'secundarias' && (
            <div className="space-y-2">
              <h3 className="font-pixel text-xs text-slate-300 mb-2">
                OBJETIVOS SECUNDARIOS DISPONIBLES:
              </h3>
              {world.secondaryMissions.map((mission, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 border border-slate-800 p-3 flex items-start gap-2.5"
                >
                  <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-bold text-white block">{mission}</span>
                    <span className="text-xs text-amber-300 font-semibold mt-1 block">
                      Recompensa: +150 Puntos para la Tarjeta de Aventura
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Puedes abrir esta ficha en cualquier momento pulsando la tecla <b>Tab</b> o <b>J</b>
          </span>
          <button
            onClick={onClose}
            className="voxel-box voxel-btn px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg ml-auto"
          >
            <span>VOLVER AL JUEGO</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
