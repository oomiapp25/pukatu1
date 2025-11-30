import { GoogleGenAI } from "@google/genai";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
// We assume process.env.API_KEY is available and valid in the execution context.
const apiKey = process.env.API_KEY;

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
if (apiKey) {
    try {
        ai = new GoogleGenAI({ apiKey });
    } catch (e) {
        console.warn("Failed to initialize GoogleGenAI", e);
    }
}

export const getLuckyNumbers = async (
  lotteryTitle: string, 
  availableNumbers: number[], 
  count: number = 3
): Promise<number[]> => {
  
  if (!ai) {
    console.warn("No API Key found for Gemini. returning random numbers.");
    const shuffled = [...availableNumbers].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  try {
    const prompt = `
      Estoy jugando a una lotería llamada "${lotteryTitle}".
      Necesito que generes ${count} números de la suerte únicos para mí.
      
      Aquí está la lista de números disponibles que puedo elegir:
      ${JSON.stringify(availableNumbers.slice(0, 500))} (lista truncada por brevedad)
      
      Reglas:
      1. Solo selecciona números de la lista proporcionada.
      2. Devuelve SOLO un array JSON de enteros. Sin texto, sin markdown.
      3. Ejemplo de salida: [5, 23, 89]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    
    // Clean up potential markdown formatting
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const numbers = JSON.parse(cleanedText);

    if (Array.isArray(numbers)) {
      return numbers.map(n => Number(n));
    }
    
    throw new Error("Invalid format");

  } catch (error) {
    console.error("Gemini Lucky Number Error:", error);
    // Fallback mechanism
    const shuffled = [...availableNumbers].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
};