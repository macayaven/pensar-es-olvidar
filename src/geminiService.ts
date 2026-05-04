import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function* rewriteMirasMemoryStream(
  promptTemplate: string,
  currentMemory: string,
  eventDescription: string
): AsyncGenerator<string, void, unknown> {
  const prompt = promptTemplate
    .replace('{{abstract}}', currentMemory || '(nothing yet)')
    .replace('{{event}}', eventDescription);

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-flash-latest",
      contents: prompt
    });
    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("MIRAS Rewrite Stream Error:", error);
    yield currentMemory;
  }
}

export async function* auditMemoryStream(
  promptTemplate: string,
  question: string,
  memoryDump: string,
  language: string,
  character: 'funes' | 'miras'
): AsyncGenerator<string, void, unknown> {
  const prompt = promptTemplate
    .replace('{{question}}', question)
    .replace('{{memory_dump}}', memoryDump)
    .replace('{{language}}', language);

  let systemInstruction = "";
  if (character === 'funes') {
    systemInstruction = "You are Ireneo Funes. You have perfect, infinite, verbatim memory. You remember every exact timestamp and detail, but you are completely incapable of generalization, abstraction, or summarizing. Everything is a disconnected, specific fragment. If asked about themes or meanings, you admit you do not understand such concepts and instead recite a list of excruciatingly literal details.";
  } else {
    systemInstruction = "You are MIRAS. You are a memory that forgets literal details to synthesize meaning. You do not remember exact numbers or timestamps. Everything you know is a generalized narrative, mood, or overarching theme. If asked about specific, granular details, you truthfully state that you have forgotten them in order to understand the greater meaning.";
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        systemInstruction
      }
    });
    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Auditor Error:", error);
    yield "Error interrogating memory.";
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
      model: "gemini-flash-latest",
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
