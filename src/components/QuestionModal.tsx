import React, { useState, useEffect } from 'react';
import { HelpCircle, Clock, CheckCircle2, XCircle, Award, MousePointer2 } from 'lucide-react';
import { QuestionItem } from '../types/game';

interface QuestionModalProps {
  question: QuestionItem;
  onAnswer: (isCorrect: boolean, timeBonus: number) => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({ question, onAnswer }) => {
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedKey, setSelectedKey] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

  // STRICTLY EXIT POINTER LOCK SO MOUSE IS 100% VISIBLE!
  useEffect(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    const handleLock = () => {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
    document.addEventListener('pointerlockchange', handleLock);

    const onMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      document.removeEventListener('pointerlockchange', handleLock);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  // 20-second countdown (game world is in full pause during this time)
  useEffect(() => {
    if (answered) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [answered]);

  const handleTimeOut = () => {
    if (answered) return;
    setAnswered(true);
    setIsCorrect(false);
    setTimeout(() => {
      onAnswer(false, 0);
    }, 1600);
  };

  const handleSelect = (key: 'A' | 'B' | 'C' | 'D') => {
    if (answered) return;
    setSelectedKey(key);
    setAnswered(true);

    const correct = key === question.correctKey;
    setIsCorrect(correct);

    const timeBonus = correct ? Math.round((timeLeft / 20) * 50) : 0;

    setTimeout(() => {
      onAnswer(correct, timeBonus);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4 cursor-default select-none">
      {/* High-visibility Custom Glowing Golden Cursor Tracker */}
      <div
        className="fixed pointer-events-none z-50 -translate-x-2 -translate-y-2 transition-transform duration-75"
        style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
      >
        <div className="relative flex items-center justify-center">
          <MousePointer2 className="w-8 h-8 text-yellow-300 fill-amber-400 drop-shadow-[0_0_10px_rgba(250,204,21,1)]" />
          <div className="absolute w-6 h-6 border-2 border-yellow-300 rounded-full animate-ping opacity-60" />
        </div>
      </div>

      <div className="voxel-box p-6 bg-slate-900 border-amber-500 max-w-xl w-full text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Full Pause Banner */}
        <div className="bg-red-950/80 border border-red-500/80 px-3 py-1 mb-3 text-center text-xs font-bold text-red-200 flex items-center justify-center gap-2">
          <span>⏸ JUEGO EN PAUSA TOTAL</span>
          <span>•</span>
          <span className="text-yellow-300">USA EL RATÓN DORADO PARA RESPONDER</span>
        </div>

        {/* Header: Title & Timer */}
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 border border-amber-500 text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-pixel text-xs text-amber-400">DESAFÍO EDUCATIVO KABERT</h2>
              <p className="text-xs text-emerald-400 font-bold">¡Responde correctamente para recibir +50 MUNICIONES!</p>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1.5 voxel-box px-3 py-1 bg-slate-950 border-slate-700">
            <Clock className={`w-4 h-4 ${timeLeft < 6 ? 'text-red-500 animate-pulse' : 'text-sky-400'}`} />
            <span className={`font-pixel text-sm ${timeLeft < 6 ? 'text-red-400' : 'text-sky-300'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Question Text */}
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-sm mb-5">
          <h3 className="text-lg md:text-xl font-bold text-slate-100 leading-snug">
            {question.question}
          </h3>
        </div>

        {/* 4 Choices A, B, C, D */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {question.options.map((opt) => {
            let btnStyle = 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-amber-400 text-slate-200 cursor-pointer';

            if (answered) {
              if (opt.key === question.correctKey) {
                btnStyle = 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_14px_rgba(34,197,94,0.8)]';
              } else if (opt.key === selectedKey) {
                btnStyle = 'bg-red-600 border-red-400 text-white';
              } else {
                btnStyle = 'bg-slate-900 border-slate-800 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={opt.key}
                disabled={answered}
                onClick={() => handleSelect(opt.key)}
                className={`voxel-box voxel-btn p-3.5 text-left flex items-start gap-3 transition-all hover:scale-102 ${btnStyle}`}
              >
                <span className="font-pixel text-xs px-2.5 py-1 bg-slate-950/90 border border-slate-700 rounded-none text-amber-300">
                  {opt.key}
                </span>
                <span className="text-sm font-bold flex-1 mt-0.5">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Result Feedback Banner */}
        {answered && (
          <div
            className={`p-3 rounded-none border text-center flex items-center justify-center gap-2 font-bold text-sm ${
              isCorrect
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-red-950 border-red-500 text-red-300'
            }`}
          >
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-pixel text-xs">¡RESPUESTA CORRECTA! +50 MUNICIONES Y PODERES DESBLOQUEADOS</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-400" />
                <span>RESPUESTA INCORRECTA (-15 SALUD). ¡Sigue buscando cofres!</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
