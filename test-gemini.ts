import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "hello"
    });
    console.log("Response from gemini-1.5-flash:", res.text);
  } catch (e) {
    console.error("Error with gemini-1.5-flash:", e);
  }
}
run();
