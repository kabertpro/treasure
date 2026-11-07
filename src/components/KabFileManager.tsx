import React, { useState } from 'react';
import { FileText, Upload, Check, AlertTriangle, X, Play, RefreshCw } from 'lucide-react';
import { DEFAULT_PREGUNTAS_KAB, parseKabFile } from '../data/questionsData';
import { QuestionItem } from '../types/game';

interface KabFileManagerProps {
  currentQuestions: QuestionItem[];
  onUpdateQuestions: (questions: QuestionItem[]) => void;
  onClose: () => void;
}

export const KabFileManager: React.FC<KabFileManagerProps> = ({
  currentQuestions,
  onUpdateQuestions,
  onClose,
}) => {
  const [inputText, setInputText] = useState(DEFAULT_PREGUNTAS_KAB);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        validateAndApply(content);
      }
    };
    reader.readAsText(file);
  };

  const validateAndApply = (text: string) => {
    const result = parseKabFile(text);
    if (result.success) {
      setValidationErrors([]);
      onUpdateQuestions(result.questions);
      setSuccessMsg(`¡Banco cargado exitosamente! ${result.questions.length} preguntas validadas.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setValidationErrors(result.errors);
      setSuccessMsg(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="voxel-box p-6 bg-slate-900 border-sky-500 max-w-2xl w-full text-white shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-400" />
            <div>
              <h2 className="font-pixel text-xs text-sky-400">GESTOR DE PREGUNTAS (.kab)</h2>
              <p className="text-xs text-slate-400">
                Actualmente activas: <span className="text-amber-400 font-bold">{currentQuestions.length} preguntas</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Buttons & Format Guide */}
        <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
          <label className="voxel-box voxel-btn px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Seleccionar archivo .kab de tu PC</span>
            <input
              type="file"
              accept=".kab,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              setInputText(DEFAULT_PREGUNTAS_KAB);
              validateAndApply(DEFAULT_PREGUNTAS_KAB);
            }}
            className="voxel-box voxel-btn px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar 24 por defecto</span>
          </button>
        </div>

        {/* Format Rules Explainer */}
        <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-none mb-3 text-[11px] text-slate-300">
          <p className="font-bold text-amber-300 mb-1">Formato de archivo .kab:</p>
          <code className="text-slate-400 font-mono">
            P: ¿Pregunta? | A: Opción 1 | B: Opción 2 R (Correcta con 'R' al final) | C: Opción 3 | D: Opción 4
          </code>
        </div>

        {/* Error Alerts */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-red-950/80 border border-red-500 mb-3 max-h-32 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Errores de validación detectados ({validationErrors.length}):</span>
            </div>
            <ul className="list-disc list-inside text-xs text-red-300 space-y-0.5">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500 mb-3 flex items-center gap-2 text-xs font-bold text-emerald-300">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Raw Text Editor */}
        <div className="flex-1 min-h-[160px] flex flex-col mb-4">
          <label className="text-xs font-bold text-slate-400 mb-1">Editor directo de texto (.kab):</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 w-full bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none rounded-none"
            rows={8}
          />
        </div>

        {/* Action Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
          <button
            onClick={() => validateAndApply(inputText)}
            className="voxel-box voxel-btn px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Validar y Aplicar Banco</span>
          </button>
        </div>
      </div>
    </div>
  );
};
