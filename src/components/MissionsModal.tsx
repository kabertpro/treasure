import React from 'react';
import { Compass, CheckCircle2, Circle, X, Trophy } from 'lucide-react';
import { WorldConfig } from '../types/game';

interface MissionsModalProps {
  world: WorldConfig;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({ world, onClose }) => {
  React.useEffect(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="voxel-box p-6 bg-slate-900 border-amber-500 max-w-lg w-full text-white shadow-2xl relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="font-pixel text-xs text-amber-400">REGISTRO DE MISIONES</h2>
              <p className="text-xs text-slate-400">{world.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Mission */}
        <div className="mb-4 bg-amber-950/40 border border-amber-500/60 p-3.5">
          <div className="flex items-center gap-2 text-xs font-pixel text-amber-400 mb-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>OBJETIVO PRINCIPAL</span>
          </div>
          <p className="text-sm font-bold text-slate-100">{world.mainMission}</p>
          <div className="text-[11px] text-amber-300 mt-2 flex items-center gap-1.5">
            <Circle className="w-3.5 h-3.5 text-amber-400" />
            <span>Recompensa: Desbloqueo del siguiente mundo y +500 PTS</span>
          </div>
        </div>

        {/* Secondary Missions */}
        <div className="space-y-2 mb-4">
          <h3 className="text-xs font-pixel text-slate-300 mb-2">MISIONES SECUNDARIAS:</h3>
          {world.secondaryMissions.map((mission, idx) => (
            <div key={idx} className="bg-slate-950/70 border border-slate-800 p-3 flex items-start gap-2.5">
              <Circle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-200">
                <span>{mission}</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">+150 Puntos de bonificación</span>
              </div>
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="voxel-box voxel-btn w-full p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
        >
          CERRAR REGISTRO
        </button>
      </div>
    </div>
  );
};
