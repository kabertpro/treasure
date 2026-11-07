import React, { useRef, useState, useEffect } from 'react';
import { Target, ArrowUp, Zap, Car, Camera, Map as MapIcon, Hand } from 'lucide-react';

interface MobileControlsProps {
  onJoystickMove: (x: number, y: number) => void;
  onJump: () => void;
  onShoot: () => void;
  onAimToggle: () => void;
  onInteract: () => void;
  onToggleVehicle: () => void;
  onToggleCamera: () => void;
  onOpenMap: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onJoystickMove,
  onJump,
  onShoot,
  onAimToggle,
  onInteract,
  onToggleVehicle,
  onToggleCamera,
  onOpenMap,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [activeTouchId, setActiveTouchId] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTouchId !== null) return;
    const touch = e.changedTouches[0];
    setActiveTouchId(touch.identifier);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        setActiveTouchId(null);
        setJoystickPos({ x: 0, y: 0 });
        onJoystickMove(0, 0);
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    const base = joystickBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxRadius = rect.width / 2;
    const dist = Math.hypot(dx, dy);

    const normX = dist === 0 ? 0 : (dx / (dist > maxRadius ? dist : maxRadius));
    const normY = dist === 0 ? 0 : (dy / (dist > maxRadius ? dist : maxRadius));

    const knobX = (normX * maxRadius) * 0.8;
    const knobY = (normY * maxRadius) * 0.8;

    setJoystickPos({ x: knobX, y: knobY });
    onJoystickMove(normX, normY);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex justify-between p-4 pb-6">
      {/* 1. LEFT: Virtual Analog Joystick */}
      <div className="self-end pointer-events-auto">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="w-28 h-28 rounded-full bg-slate-900/60 border-2 border-slate-600/80 backdrop-blur-xs flex items-center justify-center relative touch-none shadow-xl"
        >
          {/* Inner Knob */}
          <div
            className="w-12 h-12 rounded-full bg-sky-500/80 border-2 border-white shadow-lg pointer-events-none transition-transform duration-75"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            }}
          />
        </div>
      </div>

      {/* 2. RIGHT: Action Buttons Clusters */}
      <div className="self-end flex flex-col gap-3 pointer-events-auto items-end">
        {/* Secondary Utility row */}
        <div className="flex gap-2 mb-1">
          <button
            onTouchStart={onToggleVehicle}
            onClick={onToggleVehicle}
            className="w-11 h-11 rounded-full bg-amber-600/80 border-2 border-amber-300 text-white flex items-center justify-center active:scale-95 shadow-md"
            title="Vehículo"
          >
            <Car className="w-5 h-5" />
          </button>
          <button
            onTouchStart={onInteract}
            onClick={onInteract}
            className="w-11 h-11 rounded-full bg-emerald-600/80 border-2 border-emerald-300 text-white flex items-center justify-center active:scale-95 shadow-md"
            title="Interactuar"
          >
            <Hand className="w-5 h-5" />
          </button>
          <button
            onTouchStart={onAimToggle}
            onClick={onAimToggle}
            className="w-11 h-11 rounded-full bg-indigo-600/80 border-2 border-indigo-300 text-white flex items-center justify-center active:scale-95 shadow-md"
            title="Apuntar"
          >
            <Target className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Buttons: Jump & Shoot */}
        <div className="flex items-center gap-3">
          {/* Jump */}
          <button
            onTouchStart={onJump}
            onClick={onJump}
            className="w-14 h-14 rounded-full bg-slate-800/85 border-2 border-slate-400 text-white font-bold flex items-center justify-center active:scale-90 shadow-xl"
          >
            <ArrowUp className="w-7 h-7 text-sky-300" />
          </button>

          {/* Shoot Laser (Big red button) */}
          <button
            onTouchStart={onShoot}
            onClick={onShoot}
            className="w-18 h-18 rounded-full bg-red-600/90 border-4 border-yellow-300 text-white font-bold flex items-center justify-center active:scale-90 shadow-[0_0_15px_rgba(239,68,68,0.7)]"
          >
            <Zap className="w-9 h-9 fill-yellow-300 text-yellow-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
