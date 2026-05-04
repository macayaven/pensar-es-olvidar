import { GoogleGenAI } from '@google/genai';
import { type JudgeVerdict } from './types';
import { renderMirasRetention, renderAuditorQuery, renderJudge } from './prompts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function rewriteMirasMemory(
  currentMemory: string,
  eventDescription: string,
  language: string,
): Promise<string> {
  const prompt = renderMirasRetention({
    abstract: currentMemory || '(nothing yet)',
    event: eventDescription,
    language,
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });
    return response.text?.trim() || currentMemory;
  } catch (error) {
    console.error('MIRAS Rewrite Error:', error);
    return currentMemory;
  }
}

export async function auditMemory(
  question: string,
  memoryDump: string,
  language: string,
): Promise<string> {
  const prompt = renderAuditorQuery({ question, memory_dump: memoryDump, language });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });
    return response.text?.trim() || 'Error interrogating memory.';
  } catch (error) {
    console.error('Auditor Error:', error);
    return 'Error interrogating memory.';
  }
}

export async function judgeMemories(transcript: string, language: string): Promise<JudgeVerdict> {
  const prompt = renderJudge({ transcript, language });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text;
    if (!responseText) throw new Error('Empty response from judge');
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Judge Error:', error);
    return {
      funes: { specificity: 5, generalization: 2, coherence: 1, understanding: 1 },
      miras: { specificity: 2, generalization: 5, coherence: 8, understanding: 8 },
      verdict: 'The trial was inconclusive.',
    };
  }
}
