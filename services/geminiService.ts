
import { GoogleGenAI } from "@google/genai";
import { HealthRecord } from "../types";

// Lazy initialization to prevent crash if API key is missing on startup
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const analyzeHealthRecords = async (records: HealthRecord[], patientName: string) => {
  const ai = getAI();
  if (!ai) {
    return "AI Analysis is currently unavailable. Please check your GEMINI_API_KEY configuration.";
  }

  const recordsSummary = records.map(r => 
    `Date: ${new Date(r.timestamp).toLocaleDateString()}, Type: ${r.type}, Data: ${r.data}`
  ).join('\n');

  const prompt = `
    As an AI Clinical Assistant, analyze the following medical records for patient "${patientName}".
    The records are retrieved from an immutable blockchain ledger.
    
    Records:
    ${recordsSummary}

    Please provide your analysis in the following format:
    1. **Problem**: Identify the main health issue(s) based on the records.
    2. **Cure/Treatment**: Suggest how it can be cured or managed.
    3. **Precautions**: List the precautions the patient must take.
    
    Format the output using clear Markdown headings and bullet points. Keep it concise and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to analyze records. Please try again later.";
  }
};
