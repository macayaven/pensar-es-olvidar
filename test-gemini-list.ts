import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const list = await ai.models.list();
    for await (const m of list) {
        console.log(m.name);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
