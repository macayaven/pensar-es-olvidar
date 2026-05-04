import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: "hello"
    });
    console.log("Response from gemini-flash-latest:", res.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
