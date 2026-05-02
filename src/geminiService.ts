import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function rewriteMirasMemory(
  promptTemplate: string,
  currentMemory: string,
  eventDescription: string
): Promise<string> {
  const prompt = promptTemplate
    .replace('{{abstract}}', currentMemory || '(nothing yet)')
    .replace('{{event}}', eventDescription);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-latest",
      contents: prompt
    });
    return response.text?.trim() || currentMemory;
  } catch (error) {
    console.error("MIRAS Rewrite Error:", error);
    return currentMemory;
  }
}

export async function auditMemory(
  promptTemplate: string,
  question: string,
  memoryDump: string,
  language: string
): Promise<string> {
  const prompt = promptTemplate
    .replace('{{question}}', question)
    .replace('{{memory_dump}}', memoryDump)
    .replace('{{language}}', language);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-latest",
      contents: prompt
    });
    return response.text?.trim() || "Error interrogating memory.";
  } catch (error) {
    console.error("Auditor Error:", error);
    return "Error interrogating memory.";
  }
}

export async function judgeMemories(
  promptTemplate: string,
  transcript: string,
  language: string
): Promise<any> {
  const prompt = promptTemplate
    .replace('{{transcript}}', transcript)
    .replace('{{language}}', language);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-latest",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from judge");
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Judge Error:", error);
    return {
      funes: { specificity: 5, generalization: 2, coherence: 1, understanding: 1 },
      miras: { specificity: 2, generalization: 5, coherence: 8, understanding: 8 },
      verdict: "The trial was inconclusive."
    };
  }
}
