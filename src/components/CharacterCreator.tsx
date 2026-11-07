import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { User, Sparkles, Check, ArrowLeft, Palette } from 'lucide-react';
import { PlayerCustomization } from '../types/game';
import { VoxelModels } from '../game/voxelModels';
import { soundManager } from '../utils/audio';

interface CharacterCreatorProps {
  initialCustomization: PlayerCustomization;
  onSave: (custom: PlayerCustomization) => void;
  onBack: () => void;
}

const PRESETS: { name: string; custom: PlayerCustomization }[] = [
  {
    name: 'Kabert Clásico',
    custom: {
      name: 'Kabert',
      skinColor: '#fbcfe8',
      hairColor: '#451a03',
      hairStyle: 'classic',
      shirtColor: '#0284c7',
      pantsColor: '#1e3a8a',
      shoesColor: '#1e293b',
      accessory: 'none',
    },
  },
  {
    name: 'Ciber Comando',
    custom: {
      name: 'Titan-7',
      skinColor: '#e2e8f0',
      hairColor: '#0f172a',
      hairStyle: 'helmet',
      shirtColor: '#475569',
      pantsColor: '#0f172a',
      shoesColor: '#0284c7',
      accessory: 'glasses',
    },
  },
  {
    name: 'Pirata Aventurero',
    custom: {
      name: 'Barbanegra',
      skinColor: '#fed7aa',
      hairColor: '#1c1917',
      hairStyle: 'classic',
      shirtColor: '#dc2626',
      pantsColor: '#78350f',
      shoesColor: '#451a03',
      accessory: 'bandana',
    },
  },
  {
    name: 'Héroe de la Noche',
    custom: {
      name: 'Sombra',
      skinColor: '#cbd5e1',
      hairColor: '#3b0764',
      hairStyle: 'spiky',
      shirtColor: '#581c87',
      pantsColor: '#1e1b4b',
      shoesColor: '#0f172a',
      accessory: 'cape',
    },
  },
];

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({
  initialCustomization,
  onSave,
  onBack,
}) => {
  const [custom, setCustom] = useState<PlayerCustomization>(initialCustomization);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    meshGroup: THREE.Group | null;
  } | null>(null);

  // Setup 3D preview scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 1.4, 4.2);
    camera.lookAt(0, 1.2, 0);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(hemiLight, dirLight);

    sceneRef.current = { renderer, scene, camera, meshGroup: null };

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (sceneRef.current?.meshGroup) {
        sceneRef.current.meshGroup.rotation.y += 0.012;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update 3D model whenever customization changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene } = sceneRef.current;

    if (sceneRef.current.meshGroup) {
      scene.remove(sceneRef.current.meshGroup);
    }

    const newMesh = VoxelModels.createPlayer(custom);
    newMesh.position.y = 0;
    scene.add(newMesh);
    sceneRef.current.meshGroup = newMesh;
  }, [custom]);

  const handlePreset = (preset: PlayerCustomization) => {
    setCustom(preset);
    soundManager.playClick();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-4 md:p-6 overflow-y-auto">
      {/* Top Header */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-2">
        <button
          onClick={onBack}
          className="voxel-box voxel-btn px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>VOLVER</span>
        </button>
        <div className="text-center">
          <h1 className="font-pixel text-sm md:text-lg text-amber-400">CREADOR DE PERSONAJE</h1>
          <p className="text-xs text-slate-400">Diseña tu héroe voxel para la aventura</p>
        </div>
        <button
          onClick={() => {
            soundManager.playPowerup();
            onSave(custom);
          }}
          className="voxel-box voxel-btn px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
        >
          <Check className="w-4 h-4" />
          <span>GUARDAR Y JUGAR</span>
        </button>
      </div>

      {/* Main Content: 3D Preview on Left, Customizer on Right */}
      <div className="w-full max-w-5xl flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* 3D Preview Canvas */}
        <div className="md:col-span-5 h-[320px] md:h-[460px] voxel-box bg-slate-900 border-amber-500/60 relative flex items-center justify-center">
          <div ref={mountRef} className="w-full h-full" />
          <div className="absolute bottom-3 text-center text-[10px] font-pixel text-slate-400 bg-slate-950/70 px-3 py-1">
            ROTACIÓN 360° AUTOMÁTICA
          </div>
        </div>

        {/* Customization Options */}
        <div className="md:col-span-7 voxel-box p-5 bg-slate-900 border-slate-700 max-h-[460px] overflow-y-auto space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-bold text-amber-400 font-pixel block mb-2">
              PERSONAJES PREDISEÑADOS:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePreset(p.custom)}
                  className="voxel-box voxel-btn p-2 bg-slate-800 hover:bg-slate-700 text-xs text-left font-bold text-slate-200"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Nombre del Aventurero:</label>
            <input
              type="text"
              value={custom.name}
              maxLength={16}
              onChange={(e) => setCustom({ ...custom, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 p-2 text-sm text-white font-bold focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Skin Color Palette */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Tono de Piel:</label>
            <div className="flex gap-2">
              {['#fbcfe8', '#fed7aa', '#d97706', '#78350f', '#cbd5e1', '#86efac'].map((color) => (
                <button
                  key={color}
                  onClick={() => setCustom({ ...custom, skinColor: color })}
                  className={`w-7 h-7 rounded-none border-2 ${
                    custom.skinColor === color ? 'border-white scale-110 shadow-lg' : 'border-slate-800'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Hair Style & Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Estilo de Cabello/Casco:</label>
              <select
                value={custom.hairStyle}
                onChange={(e) => setCustom({ ...custom, hairStyle: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 p-2 text-xs text-white"
              >
                <option value="classic">Clásico Steve</option>
                <option value="spiky">Puntiagudo Anime</option>
                <option value="cap">Gorra con Visera</option>
                <option value="helmet">Casco Táctico</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Color de Cabello:</label>
              <div className="flex gap-1.5 mt-1">
                {['#451a03', '#1c1917', '#d97706', '#e2e8f0', '#0284c7', '#dc2626'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setCustom({ ...custom, hairColor: color })}
                    className={`w-6 h-6 border-2 ${
                      custom.hairColor === color ? 'border-white scale-110' : 'border-slate-800'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Shirt, Pants & Shoes Colors */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Camiseta:</label>
              <input
                type="color"
                value={custom.shirtColor}
                onChange={(e) => setCustom({ ...custom, shirtColor: e.target.value })}
                className="w-full h-8 bg-transparent cursor-pointer border border-slate-700"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Pantalón:</label>
              <input
                type="color"
                value={custom.pantsColor}
                onChange={(e) => setCustom({ ...custom, pantsColor: e.target.value })}
                className="w-full h-8 bg-transparent cursor-pointer border border-slate-700"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Calzado:</label>
              <input
                type="color"
                value={custom.shoesColor}
                onChange={(e) => setCustom({ ...custom, shoesColor: e.target.value })}
                className="w-full h-8 bg-transparent cursor-pointer border border-slate-700"
              />
            </div>
          </div>

          {/* Accessory */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Accesorio Especial:</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'none', label: 'Ninguno' },
                { id: 'glasses', label: 'Gafas de Sol' },
                { id: 'bandana', label: 'Bandana' },
                { id: 'cape', label: 'Capa Roja' },
              ].map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setCustom({ ...custom, accessory: acc.id as any })}
                  className={`voxel-box p-2 text-center text-xs font-bold ${
                    custom.accessory === acc.id
                      ? 'bg-amber-600 text-white border-amber-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
