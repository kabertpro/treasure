import React, { useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Download, RotateCcw, Home, Skull, Gem, CheckCircle, XCircle } from 'lucide-react';
import { PlayerCustomization, PlayerStats } from '../types/game';

interface EndGameModalProps {
  isVictory: boolean;
  stats: PlayerStats;
  customization: PlayerCustomization;
  completedWorldsCount: number;
  onRestart: () => void;
  onExitToMenu: () => void;
}

export const EndGameModal: React.FC<EndGameModalProps> = ({
  isVictory,
  stats,
  customization,
  completedWorldsCount,
  onRestart,
  onExitToMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Trigger celebration confetti on victory
  useEffect(() => {
    if (isVictory) {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
      });
    }
    generateCertificate();
  }, [isVictory]);

  const generateCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions: 800 x 500 Certificate
    canvas.width = 800;
    canvas.height = 500;

    // Outer Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 800, 500);

    // Voxel Gold Border
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#d97706';
    ctx.strokeRect(10, 10, 780, 480);

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fde047';
    ctx.strokeRect(20, 20, 760, 460);

    // Inner Pattern
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(26, 26, 748, 448);

    // Header Title
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 34px "Rajdhani", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KABERT TREASURE - CERTIFICADO DE AVENTURA', 400, 75);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '16px "Rajdhani", sans-serif';
    ctx.fillText('KABERT LAB by LMKE • Luis Miguel Kapa Escobar • WhatsApp: +591 65596602', 400, 105);

    // Divider
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 125);
    ctx.lineTo(740, 125);
    ctx.stroke();

    // Player Hero Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Rajdhani", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`HÉROE: ${customization.name.toUpperCase()}`, 60, 170);

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 22px "Rajdhani", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(isVictory ? '¡CONQUISTADOR SUPREMO!' : 'AVENTURA FINALIZADA', 740, 170);

    // Stats Grid
    const statRows = [
      { label: 'Puntuación Total:', val: `${stats.score.toLocaleString()} PTS`, color: '#facc15' },
      { label: 'Mundos Conquistados:', val: `${completedWorldsCount} / 5`, color: '#38bdf8' },
      { label: 'Enemigos Derrotados:', val: `${stats.enemiesDefeated}`, color: '#ef4444' },
      { label: 'Grandes Jefes Vencidos:', val: `${stats.bossesDefeated}`, color: '#f97316' },
      { label: 'Preguntas Correctas:', val: `${stats.correctQuestions}`, color: '#22c55e' },
      { label: 'Preguntas Incorrectas:', val: `${stats.incorrectQuestions}`, color: '#94a3b8' },
      { label: 'Diamantes Encontrados:', val: `${stats.diamonds}`, color: '#38bdf8' },
      { label: 'Estrellas Mágicas:', val: `${stats.stars}`, color: '#facc15' },
    ];

    let rowX = 60;
    let rowY = 220;
    statRows.forEach((item, idx) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '18px "Rajdhani", sans-serif';
      ctx.fillText(item.label, rowX, rowY);

      ctx.fillStyle = item.color;
      ctx.font = 'bold 20px "Rajdhani", sans-serif';
      ctx.fillText(item.val, rowX + 220, rowY);

      if (idx % 2 === 1) {
        rowX = 60;
        rowY += 42;
      } else {
        rowX = 420;
      }
    });

    // Seal at bottom
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'center';
    ctx.font = 'italic 16px "Rajdhani", sans-serif';
    ctx.fillText('«Explora. Descubre. Responde. ¡Conquista!»', 400, 440);
  };

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `KABERT-TREASURE-TARJETA-${customization.name}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="voxel-box p-6 bg-slate-900 border-amber-500 max-w-2xl w-full text-white shadow-2xl relative my-auto">
        {/* Title */}
        <div className="text-center mb-4">
          <div className="inline-block p-3 bg-amber-500/20 border-2 border-amber-400 mb-2">
            {isVictory ? <Trophy className="w-10 h-10 text-amber-400" /> : <Skull className="w-10 h-10 text-red-500" />}
          </div>
          <h2 className="font-pixel text-lg md:text-xl text-amber-400">
            {isVictory ? '¡VICTORIA ÉPICA KABERT!' : 'FIN DE LA PARTIDA'}
          </h2>
          <p className="text-xs text-slate-400">
            {isVictory
              ? 'Has derrotado al Dragón Omega y conquistado el tesoro supremo'
              : 'Has caído en combate pero tu valentía será recordada'}
          </p>
        </div>

        {/* Certificate Canvas Preview */}
        <div className="bg-slate-950 border border-slate-800 p-2 rounded-none mb-4 overflow-hidden flex justify-center">
          <canvas ref={canvasRef} className="w-full max-w-xl h-auto border border-slate-700 shadow-md" />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-between items-center border-t border-slate-800 pt-3">
          <button
            onClick={handleDownloadPNG}
            className="voxel-box voxel-btn px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Tarjeta (PNG)</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onRestart}
              className="voxel-box voxel-btn px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jugar de Nuevo</span>
            </button>
            <button
              onClick={onExitToMenu}
              className="voxel-box voxel-btn px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Menú Principal</span>
            </button>
          </div>
        </div>

        {/* Direct WhatsApp and Web Links */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <a
            href="https://wa.me/59165596602?text=¡Hola%20Luis%20Miguel!%20Acabo%20de%20completar%20mi%20partida%20en%20KABERT%20TREASURE!"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
          >
            WhatsApp Directo: +591 65596602
          </a>
          <a
            href="https://ais-pre-3d57wlwc6dwup3ub577bc5-878358812835.us-east1.run.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 font-bold transition-colors"
          >
            KABERT LAB by LMKE Web
          </a>
        </div>
      </div>
    </div>
  );
};
