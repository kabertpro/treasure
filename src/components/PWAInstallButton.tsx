import React, { useState } from 'react';
import { Download, Smartphone, Monitor, CheckCircle2, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'primary' | 'compact' | 'pill';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'primary',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already installed in standalone mode, show a small badge or hide
  if (isInstalled) {
    if (variant === 'compact') return null;
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/70 border border-emerald-500 text-emerald-300 text-xs font-bold rounded-sm">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>JUEGO INSTALADO</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`voxel-box voxel-btn font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
          variant === 'primary'
            ? 'p-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs shadow-lg'
            : variant === 'compact'
            ? 'px-3 py-1.5 bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-400 text-emerald-200 text-xs'
            : 'px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs'
        } ${className}`}
        title="Instalar KABERT TREASURE en tu PC o Teléfono Móvil"
      >
        <div className="flex items-center gap-1.5">
          <img src="/icon.svg" alt="Icono KABERT" className="w-4 h-4 drop-shadow" />
          <Download className="w-3.5 h-3.5 text-emerald-200" />
        </div>
        <span className="font-pixel text-[11px] tracking-wide">
          {isInstallable ? 'INSTALAR JUEGO (PC / MÓVIL)' : 'CÓMO INSTALAR JUEGO'}
        </span>
      </button>

      {/* Guide Modal for iOS Safari / Manual Installation */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="voxel-box p-6 bg-slate-900 border-emerald-500 max-w-md w-full text-white shadow-2xl relative">
            <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <img src="/icon.svg" alt="KABERT" className="w-8 h-8 rounded-sm border border-emerald-500" />
                <div>
                  <h3 className="font-pixel text-xs text-emerald-400">INSTALAR KABERT TREASURE</h3>
                  <p className="text-xs text-slate-400">Juega a pantalla completa sin barras de navegador</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="voxel-box p-1 bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 mb-5">
              {isIOS ? (
                <div className="bg-slate-950 border border-slate-800 p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Smartphone className="w-4 h-4" />
                    <span>Instalación en iPhone / iPad (Safari):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-1">
                    <li className="flex items-start gap-2">
                      <Share2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <span>Presiona el botón <strong>Compartir</strong> en la barra inferior de Safari.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Baja y toca <strong>«Agregar a pantalla de inicio»</strong>.</span>
                    </li>
                    <li>Toca <strong>«Agregar»</strong> en la esquina superior derecha.</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-950 border border-slate-800 p-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5">
                      <Monitor className="w-4 h-4" />
                      <span>En Computadora (Chrome / Edge / Brave):</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Haz clic en el icono de <strong>Instalar aplicación</strong> que aparece en la barra de direcciones superior del navegador (o en el menú de 3 puntos ➜ <em>«Instalar KABERT TREASURE»</em>).
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-3">
                    <div className="flex items-center gap-2 text-sky-400 font-bold mb-1.5">
                      <Smartphone className="w-4 h-4" />
                      <span>En Teléfono Android (Chrome):</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Toca el menú de <strong>3 puntos</strong> de Chrome y selecciona <strong>«Agregar a la pantalla principal»</strong> o <strong>«Instalar aplicación»</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="voxel-box voxel-btn w-full p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </>
  );
};
