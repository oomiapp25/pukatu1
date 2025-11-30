import { GoogleGenAI } from "@google/genai";

let apiKey = '';
try {
  // Safely attempt to access process.env. 
  // In Vite/React without proper config, this might throw ReferenceError if process is not defined.
  if (typeof process !== 'undefined' && process.env) {
    apiKey = process.env.API_KEY || '';
  }
} catch (e) {
  console.warn("Environment variable access failed, using fallback.");
}

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey });

export const getLuckyNumbers = async (
  lotteryTitle: string, 
  availableNumbers: number[], 
  count: number = 3
): Promise<number[]> => {
  
  if (!apiKey) {
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