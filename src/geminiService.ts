import { GoogleGenAI } from "@google/genai";
import type { MirasBridge } from "./types";

let currentApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
let ai = new GoogleGenAI({ apiKey: currentApiKey });

export function setApiKey(key: string) {
  currentApiKey = key;
  ai = new GoogleGenAI({ apiKey: currentApiKey });
}

export function hasUsableApiKey() {
  return Boolean(
    currentApiKey && !/^MY_|^YOUR_|PLACEHOLDER/i.test(currentApiKey),
  );
}

export async function* rewriteMirasMemoryStream(
  promptTemplate: string,
  currentMemory: string,
  eventDescription: string,
): AsyncGenerator<string, void, unknown> {
  const prompt = promptTemplate
    .replace("{{abstract}}", currentMemory || "(nothing yet)")
    .replace("{{event}}", eventDescription);

  if (!hasUsableApiKey()) {
    yield* chunkForDisplay(stageAbstraction(eventDescription, currentMemory));
    return;
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-1.5-flash",
      contents: prompt,
    });
    let rawMemory = "";
    for await (const chunk of responseStream) {
      if (chunk.text) {
        rawMemory += chunk.text || "";
      }
    }

    const cleaned = cleanMirasMemory(
      rawMemory,
      currentMemory,
      eventDescription,
    );
    yield* chunkForDisplay(cleaned);
  } catch (error) {
    yield* chunkForDisplay(stageAbstraction(eventDescription, currentMemory));
  }
}

function cleanMirasMemory(
  rawMemory: string,
  currentMemory: string,
  eventDescription: string,
) {
  // More lenient cleaning: just trim and ensure basic Borgesian mood if AI completely fails
  const normalized = rawMemory
    .replace(/\s+/g, " ")
    .replace(/^["']|["']$/g, "")
    .trim();

  if (!normalized || normalized.length < 5) {
    return stageAbstraction(eventDescription, currentMemory);
  }

  // If it's too long or has too many digits (Funes-like), we try to prune it
  const digitsCount = (normalized.match(/\d/g) || []).length;
  if (normalized.split(" ").length > 80 || digitsCount > 5) {
    return stageAbstraction(eventDescription, currentMemory);
  }

  return normalized;
}

export function buildMirasBridge(
  caption: string,
  currentMemory: string,
): MirasBridge {
  const lowerCaption = caption.toLowerCase();
  let question =
    "What shape appears before there is enough memory to call it a story?";

  if (currentMemory) {
    if (lowerCaption.includes("door") || lowerCaption.includes("threshold")) {
      question =
        "Does the door lead away from the world, or further into the memory of it?";
    } else if (
      lowerCaption.includes("light") ||
      lowerCaption.includes("bloom")
    ) {
      question =
        "Is the light a detail to be counted, or the atmosphere that makes counting irrelevant?";
    } else {
      question =
        "What must this new detail become so the old memory can still hold together?";
    }
  }

  return {
    question,
    answer: stageAbstraction(caption, currentMemory),
    timestamp: Date.now(),
  };
}

export async function* auditMemoryStream(
  promptTemplate: string,
  question: string,
  memoryDump: string,
  language: string,
  character: "funes" | "miras",
): AsyncGenerator<string, void, unknown> {
  const prompt = promptTemplate
    .replace("{{question}}", question)
    .replace("{{memory_dump}}", memoryDump)
    .replace("{{language}}", language);

  if (!hasUsableApiKey()) {
    yield fallbackAuditAnswer(question, memoryDump, character);
    return;
  }

  let systemInstruction = "";
  if (character === "funes") {
    systemInstruction =
      "You are Ireneo Funes. You have perfect, infinite, verbatim memory. You remember every detail, but you are completely incapable of generalization, abstraction, or summarizing. Everything is a disconnected, specific fragment. If asked about themes or meanings, you admit you do not understand such concepts. CRITICAL: While you retain exact memory of sequences, you must express timestamps and coordinates using literary, archival phrasing (e.g., 'the third trace', 'that morning instant', 'the exact mark in folio 5'). NEVER output raw telemetry, literal numerical timestamps, or server logs.";
  } else {
    systemInstruction =
      "You are MIRAS. You are a memory that forgets literal details to synthesize meaning. You do not remember exact numbers or timestamps. Everything you know is a generalized narrative, mood, or overarching theme. If asked about specific, granular details, you truthfully state that you have forgotten them in order to understand the greater meaning.";
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    yield fallbackAuditAnswer(question, memoryDump, character);
  }
}

export async function judgeMemories(
  promptTemplate: string,
  transcript: string,
  language: string,
): Promise<any> {
  const prompt = promptTemplate
    .replace("{{transcript}}", transcript)
    .replace("{{language}}", language);

  if (!hasUsableApiKey()) {
    return fallbackJudge();
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    const text = response.text || "";
    const responseText = text
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    if (!responseText) throw new Error("Empty response from judge");
    return JSON.parse(responseText);
  } catch (error) {
    return fallbackJudge();
  }
}

function stageAbstraction(eventDescription: string, currentMemory: string) {
  const lower = eventDescription.toLowerCase();

  if (/train|landscape|station|rushing/.test(lower)) {
    return "The departure has become motion: the abandoned rooms are no longer remembered as items, but as a pressure carried into the unknown.";
  }

  if (/door|footsteps|stairwell|shut/.test(lower)) {
    return "The private world crosses a threshold. Leaving is no longer an action but the shape that organizes every remembered trace.";
  }

  if (/keys|counter|dust|paintings|bare/.test(lower)) {
    return "Absence gathers into a pattern of rooms, objects, and missing walls; the place is understood by what it can no longer hold.";
  }

  if (/box|armchair|empty|hallway/.test(lower)) {
    return "A life is being reduced to outlines: the objects matter less than the first sensation of departure.";
  }

  return currentMemory
    ? "The new perception folds into the same pressure of departure, where memory keeps relation and mood instead of inventory."
    : "A departure begins: objects remain concrete, but the mind keeps only the pressure of leaving.";
}

function* chunkForDisplay(text: string) {
  const words = text.split(/(\s+)/).filter((part) => part.length > 0);
  for (const word of words) {
    yield word;
  }
}

function fallbackAuditAnswer(
  question: string,
  memoryDump: string,
  character: "funes" | "miras",
) {
  if (character === "funes") {
    const fragments = memoryDump.split("\n").filter(Boolean).slice(0, 3);
    return fragments.length
      ? `I remember particulars, not meanings: ${fragments.join("; ")}.`
      : "I remember the absence of a record as precisely as any record.";
  }

  if (/scene 5/i.test(question)) {
    return "I no longer possess scene 5 as a separate fact. I kept only its pressure inside the larger departure.";
  }

  return memoryDump
    ? `I remember the shape, not the inventory: ${memoryDump}`
    : "I kept no literal record. I kept only the idea that memory becomes thought by surrendering detail.";
}

function fallbackJudge() {
  return {
    analysis: {
      title: "The shape that survived the loss",
      thesis:
        "The trial shows that memory becomes thought only when it can let go of the inventory and keep the relation between things.",
      evidence: [
        "Funes can preserve the captions, digits, dates, and times, but his answer remains a cabinet of fragments.",
        "MIRAS loses the exact numerals and timestamps, yet keeps a coherent movement through absence, departure, and threshold.",
        "The counted world becomes meaningful only when the count stops being the point.",
      ],
      funesReading:
        "Funes is magnificent as a record and tragic as a mind: nothing disappears, so nothing can become figure against ground.",
      mirasReading:
        "MIRAS is weaker as storage but stronger as interpretation: forgetting makes room for a pattern to appear.",
      synthesis:
        "The piece does not crown forgetting because detail is useless. It shows that detail needs an act of selection before it can become understanding.",
      closing:
        "What remains is not less memory, but memory transformed into thought.",
    },
    funes: {
      specificity: 10,
      generalization: 1,
      coherence: 3,
      understanding: 2,
      justification:
        "Funes preserves exact fragments, but the fragments never become a usable account of what happened.",
    },
    miras: {
      specificity: 3,
      generalization: 9,
      coherence: 8,
      understanding: 9,
      justification:
        "MIRAS loses exact particulars, but the loss creates a coherent account of departure and change.",
    },
    verdict: "MIRAS remembers less, and therefore thinks more.",
  };
}
