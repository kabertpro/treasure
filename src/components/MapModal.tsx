import React from 'react';
import { X, Compass, Skull, Gem, Key, MapPin } from 'lucide-react';
import { WorldConfig } from '../types/game';

interface MapModalProps {
  world: WorldConfig;
  playerPos: { x: number; z: number; rotation: number };
  onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({ world, playerPos, onClose }) => {
  React.useEffect(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, []);

  // Normalize player coords (-90 to +90) into percentage (0% to 100%)
  const normX = ((playerPos.x + 90) / 180) * 100;
  const normZ = ((playerPos.z + 90) / 180) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="voxel-box p-6 bg-slate-900 border-emerald-500 max-w-2xl w-full text-white shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="font-pixel text-xs text-emerald-400">
                MAPA TÁCTICO: {world.name.toUpperCase()}
              </h2>
              <p className="text-xs text-slate-400">{world.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Canvas Graphic */}
        <div className="relative w-full aspect-square max-h-[380px] bg-slate-950 border-2 border-slate-800 overflow-hidden mb-4">
          {/* World Stylized Terrain Background */}
          <div
            className="absolute inset-0 opacity-40 bg-radial from-slate-800 to-slate-950"
            style={{
              backgroundImage:
                'radial-gradient(#334155 1.5px, transparent 1.5px), radial-gradient(#1e293b 1.5px, #020617 1.5px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
            }}
          />

          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-20">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="border border-slate-600" />
            ))}
          </div>

          {/* Spawn Zone Marker */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-3 h-3 bg-emerald-500 border border-white" />
            <span className="text-[9px] font-pixel text-emerald-400 mt-1">BASE DE INICIO</span>
          </div>

          {/* Boss Arena (North) */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-8 h-8 bg-red-950/80 border-2 border-red-500 flex items-center justify-center animate-pulse">
              <Skull className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-[10px] font-pixel text-red-400 mt-1 font-bold">
              GUARIDA: {world.bossName.toUpperCase()}
            </span>
          </div>

          {/* Landmarks depending on World */}
          {world.id === 1 && (
            <>
              <div className="absolute top-1/4 left-1/4 text-[9px] font-pixel text-amber-300">
                RUINAS PIRATAS
              </div>
              <div className="absolute top-1/3 right-1/4 text-[9px] font-pixel text-sky-300">
                BAHÍA DEL NAUFRAGIO
              </div>
            </>
          )}
          {world.id === 2 && (
            <>
              <div className="absolute top-1/4 left-1/4 text-[9px] font-pixel text-cyan-300">
                AUTOPISTA ELEVADA
              </div>
              <div className="absolute top-1/3 right-1/4 text-[9px] font-pixel text-amber-300">
                CENTRO INDUSTRIAL
              </div>
            </>
          )}

          {/* Player Live Marker */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-150 z-20"
            style={{ left: `${Math.max(5, Math.min(95, normX))}%`, top: `${Math.max(5, Math.min(95, normZ))}%` }}
          >
            <div
              className="w-4 h-4 bg-emerald-400 border-2 border-white shadow-[0_0_8px_#22c55e]"
              style={{ transform: `rotate(${playerPos.rotation}rad)` }}
            />
            <span className="bg-slate-900/90 border border-slate-700 px-1 py-0.5 text-[8px] font-pixel text-emerald-300 mt-1">
              TÚ (X:{Math.round(playerPos.x)}, Z:{Math.round(playerPos.z)})
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-emerald-400 border border-white" />
            <span>Posición Jugador</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Skull className="w-3.5 h-3.5 text-red-400" />
            <span>Jefe Final</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gem className="w-3.5 h-3.5 text-sky-400" />
            <span>Zona de Tesoros</span>
          </div>
        </div>
      </div>
    </div>
  );
};
