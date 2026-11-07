import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Upload,
  Play,
  Square,
  Volume2,
  Trash2,
  X,
  FolderOpen,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { OFFICIAL_TRACKS, TrackMetadata, soundManager, MusicTrackType } from '../utils/audio';

interface MusicManagerModalProps {
  onClose: () => void;
}

export const MusicManagerModal: React.FC<MusicManagerModalProps> = ({ onClose }) => {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(() => soundManager.getCurrentTrack());
  const [customLoadedTracks, setCustomLoadedTracks] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    OFFICIAL_TRACKS.forEach((t) => {
      const custom = soundManager.getCustomAudio(t.id);
      if (custom) {
        map[t.id] = custom.fileName;
      }
    });
    return map;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetUploadTrack, setTargetUploadTrack] = useState<MusicTrackType | null>(null);

  // Ensure pointer lock is released when music modal is open
  useEffect(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, []);

  const handlePlayPreview = (trackId: MusicTrackType) => {
    soundManager.playMusic(trackId, true);
    setPlayingTrackId(trackId);
  };

  const handleStopPreview = () => {
    soundManager.stopMusic();
    setPlayingTrackId(null);
  };

  const handleUploadClick = (trackId: MusicTrackType) => {
    setTargetUploadTrack(trackId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUploadTrack) return;

    const objectUrl = URL.createObjectURL(file);
    soundManager.registerCustomAudio(targetUploadTrack, objectUrl, file.name);

    setCustomLoadedTracks((prev) => ({
      ...prev,
      [targetUploadTrack]: file.name,
    }));

    // Auto-play the newly uploaded track
    handlePlayPreview(targetUploadTrack);
  };

  const handleRemoveCustom = (trackId: MusicTrackType) => {
    soundManager.removeCustomAudio(trackId);
    setCustomLoadedTracks((prev) => {
      const copy = { ...prev };
      delete copy[trackId];
      return copy;
    });
    if (playingTrackId === trackId) {
      handlePlayPreview(trackId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150">
      {/* Hidden File Input for MP3 uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="voxel-box p-5 sm:p-6 bg-slate-900 border-amber-500 max-w-3xl w-full text-white shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 border-b-2 border-amber-500/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border-2 border-amber-400 text-amber-400">
              <Music className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-xs text-amber-400 uppercase tracking-widest">
                  ESTACIÓN DE MÚSICA & AUDIO
                </span>
                <span className="bg-sky-950 border border-sky-500 text-sky-300 text-[10px] font-bold px-1.5 py-0.5">
                  8 PISTAS MP3
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-wide">
                CARGA DE AUDIOS Y BANDA SONORA
              </h2>
              <p className="text-xs text-slate-400">
                Coloca archivos en <code className="text-amber-300">/public/audio/</code> o cárgalos en vivo desde tu dispositivo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="voxel-box voxel-btn p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Banner */}
        <div className="bg-slate-950/90 border border-slate-800 p-3 mb-4 rounded-xs text-xs space-y-1.5 text-slate-300">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>Carpeta dedicada para tus canciones:</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Puedes depositar tus audios en la carpeta <span className="text-amber-300 font-mono font-bold">public/audio/</span> o <span className="text-amber-300 font-mono font-bold">public/music/</span> de tu proyecto con los nombres indicados abajo. Si no subes algún archivo, el juego reproducirá automáticamente su <strong>sintetizador retro 8-bit procedural</strong> para que la música nunca se detenga.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold pt-1 border-t border-slate-800/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Todos los efectos de sonido (disparos, diamantes, saltos, explosiones) se mantienen 100% activos.</span>
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {OFFICIAL_TRACKS.map((track) => {
            const isPlaying = playingTrackId === track.id;
            const customFileName = customLoadedTracks[track.id];

            return (
              <div
                key={track.id}
                className={`voxel-box p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isPlaying
                    ? 'bg-amber-950/40 border-amber-400 shadow-md'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`p-2 border mt-0.5 ${
                      isPlaying
                        ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    <Music className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-600/60 px-1.5 py-0.5">
                        {track.fileName}
                      </span>
                      <h4 className="font-bold text-sm text-white truncate">{track.name}</h4>
                      {customFileName ? (
                        <span className="text-[10px] bg-emerald-950 border border-emerald-500 text-emerald-300 px-1.5 py-0.2 font-semibold">
                          Cargado: {customFileName}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-400 px-1.5 py-0.2">
                          Carpeta / Synth Voxel
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{track.description}</p>
                  </div>
                </div>

                {/* Track Controls */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {isPlaying ? (
                    <button
                      onClick={handleStopPreview}
                      className="voxel-box voxel-btn px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>Detener</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePlayPreview(track.id)}
                      className="voxel-box voxel-btn px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-200" />
                      <span>Probar</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleUploadClick(track.id)}
                    className="voxel-box voxel-btn px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                    title="Cargar archivo MP3 desde tu equipo"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cargar MP3</span>
                  </button>

                  {customFileName && (
                    <button
                      onClick={() => handleRemoveCustom(track.id)}
                      className="p-1.5 bg-slate-800 hover:bg-red-900 border border-slate-700 hover:border-red-500 text-slate-400 hover:text-red-300 transition-colors"
                      title="Restaurar a MP3 de carpeta o Synth"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>KABERT LAB by LMKE • Sistema Multi-Pista Voxel</span>
          </div>

          <button
            onClick={onClose}
            className="voxel-box voxel-btn px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
          >
            GUARDAR Y SALIR
          </button>
        </div>
      </div>
    </div>
  );
};
