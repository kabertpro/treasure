import { QuestionItem } from '../types/game';

export const DEFAULT_PREGUNTAS_KAB = `P: ¿Cuánto vale una blanca en música?
A: 1 tiempo
B: 2 tiempos R
C: 3 tiempos
D: 4 tiempos

P: ¿Cuánto vale una negra en la notación musical tradicional?
A: 1 tiempo R
B: 2 tiempos
C: 4 tiempos
D: 1/2 tiempo

P: ¿Cuál es el planeta más grande de nuestro Sistema Solar?
A: Saturno
B: Tierra
C: Júpiter R
D: Marte

P: ¿Cuántos lados tiene un hexágono regular?
A: 5 lados
B: 6 lados R
C: 7 lados
D: 8 lados

P: ¿En qué continente se encuentra la Cordillera de los Andes?
A: Asia
B: Europa
C: América del Sur R
D: África

P: ¿Cuál es el elemento químico representado por el símbolo O?
A: Oro
B: Osmio
C: Oxígeno R
D: Plata

P: ¿Cuánto es 12 multiplicado por 8?
A: 84
B: 96 R
C: 108
D: 92

P: ¿Cuál es el río más caudaloso y largo del mundo?
A: Río Nilo
B: Río Misisipi
C: Río Amazonas R
D: Río Danubio

P: ¿Cuántas corcheas equivalen a una redonda completa?
A: 4 corcheas
B: 8 corcheas R
C: 16 corcheas
D: 6 corcheas

P: ¿Cuál es el gas que absorben las plantas durante la fotosíntesis?
A: Oxígeno
B: Dióxido de carbono R
C: Nitrógeno
D: Hidrógeno

P: ¿Quién pintó la famosa obra de arte 'La Gioconda' o Mona Lisa?
A: Vincent van Gogh
B: Leonardo da Vinci R
C: Pablo Picasso
D: Miguel Ángel

P: ¿Cuál es el océano más extenso de la Tierra?
A: Océano Atlántico
B: Océano Pacífico R
C: Océano Índico
D: Océano Ártico

P: ¿Cuál es la raíz cuadrada exacta del número 144?
A: 11
B: 12 R
C: 14
D: 16

P: ¿En qué año llegó el ser humano por primera vez a la Luna?
A: 1965
B: 1969 R
C: 1972
D: 1980

P: ¿Cuál es el metal más abundante en la corteza terrestre?
A: Hierro
B: Cobre
C: Aluminio R
D: Oro

P: ¿Qué instrumento musical tiene teclas blancas y negras y cuerdas percutidas?
A: Guitarra
B: Piano R
C: Violín
D: Flauta

P: ¿Cuál es la capital del estado plurinacional de Bolivia según su constitución?
A: La Paz
B: Santa Cruz
C: Sucre R
D: Cochabamba

P: ¿Cuántos segundos tiene una hora completa?
A: 1800 segundos
B: 3600 segundos R
C: 2400 segundos
D: 4800 segundos

P: ¿Qué órgano del cuerpo humano bombea la sangre a todo el organismo?
A: Cerebro
B: Pulmones
C: Corazón R
D: Hígado

P: ¿Cuál es el valor del número Pi redondeado a dos decimales?
A: 3.12
B: 3.14 R
C: 3.16
D: 3.18

P: ¿Qué tipo de energía produce el movimiento del viento?
A: Energía solar
B: Energía eólica R
C: Energía térmica
D: Energía nuclear

P: ¿Cuál es la clave musical que se utiliza comúnmente para sonidos graves?
A: Clave de Sol
B: Clave de Fa R
C: Clave de Do
D: Clave Neutra

P: ¿Cuál es el país con mayor superficie territorial del planeta?
A: Canadá
B: China
C: Rusia R
D: Estados Unidos

P: ¿Cuántos huesos aproximadamente tiene el cuerpo humano de un adulto?
A: 156 huesos
B: 206 huesos R
C: 256 huesos
D: 300 huesos`;

export interface ParseResult {
  success: boolean;
  questions: QuestionItem[];
  errors: string[];
}

export function parseKabFile(text: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const questions: QuestionItem[] = [];
  const errors: string[] = [];

  let currentQuestion: {
    text?: string;
    options: { key: 'A' | 'B' | 'C' | 'D'; text: string; isCorrect: boolean }[];
    startLine: number;
  } | null = null;

  let questionIndex = 0;

  const finalizeQuestion = () => {
    if (!currentQuestion) return;
    questionIndex++;
    const qNum = questionIndex;

    if (!currentQuestion.text || currentQuestion.text.trim() === '') {
      errors.push(`Pregunta #${qNum} (Línea ${currentQuestion.startLine}): Falta el texto de la pregunta (P:).`);
      return;
    }

    if (currentQuestion.options.length !== 4) {
      errors.push(
        `Pregunta #${qNum} ("${currentQuestion.text.slice(0, 30)}..."): Debe tener exactamente 4 alternativas (A, B, C, D). Se encontraron ${currentQuestion.options.length}.`
      );
      return;
    }

    const correctOptions = currentQuestion.options.filter(o => o.isCorrect);
    if (correctOptions.length === 0) {
      errors.push(
        `Pregunta #${qNum} ("${currentQuestion.text.slice(0, 30)}..."): No tiene ninguna respuesta correcta marcada con 'R' al final.`
      );
      return;
    }

    if (correctOptions.length > 1) {
      errors.push(
        `Pregunta #${qNum} ("${currentQuestion.text.slice(0, 30)}..."): Tiene más de una respuesta marcada con 'R' (${correctOptions.map(o => o.key).join(', ')}). Debe tener solo una.`
      );
      return;
    }

    questions.push({
      id: qNum,
      question: currentQuestion.text,
      options: currentQuestion.options.map(o => ({ key: o.key, text: o.text })),
      correctKey: correctOptions[0].key,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    if (line.startsWith('P:') || line.startsWith('p:')) {
      finalizeQuestion();
      currentQuestion = {
        text: line.substring(2).trim(),
        options: [],
        startLine: i + 1,
      };
      continue;
    }

    const optMatch = line.match(/^([A-Da-d])\s*:\s*(.+)$/);
    if (optMatch && currentQuestion) {
      const key = optMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
      let content = optMatch[2].trim();
      let isCorrect = false;

      // Check for trailing R (e.g. "2 tiempos R" or "2 tiempos r" or "2 tiempos  R")
      if (/\s+R$/i.test(content)) {
        isCorrect = true;
        content = content.replace(/\s+R$/i, '').trim();
      }

      currentQuestion.options.push({
        key,
        text: content,
        isCorrect,
      });
    }
  }

  finalizeQuestion();

  if (questions.length === 0 && errors.length === 0) {
    errors.push('No se encontraron preguntas válidas con formato P: y alternativas A:, B:, C:, D:.');
  }

  return {
    success: errors.length === 0 && questions.length > 0,
    questions,
    errors,
  };
}
