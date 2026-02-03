
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini with the API key from environment variables as per strict guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getLuckyNumbers = async (
  lotteryTitle: string, 
  availableNumbers: number[], 
  count: number = 3
): Promise<number[]> => {
  
  try {
    const prompt = `
      Estoy jugando a una lotería llamada "${lotteryTitle}".
      Necesito que generes ${count} números de la suerte únicos para mí.
      
      Aquí está la lista de números disponibles que puedo elegir:
      ${JSON.stringify(availableNumbers.slice(0, 500))} (lista truncada por brevedad)
      
      Reglas:
      1. Solo selecciona números de la lista proporcionada.
      2. Devuelve los números como un array JSON de enteros.
    `;

    // Using gemini-3-flash-preview for basic text tasks as per model guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.INTEGER
          }
        }
      }
    });

    const text = response.text;
    
    if (!text) {
        throw new Error("No text response from Gemini");
    }

    const numbers = JSON.parse(text);

    if (Array.isArray(numbers)) {
      return numbers.map((n: any) => Number(n));
    }
    
    throw new Error("Invalid format");

  } catch (error) {
    console.error("Gemini Lucky Number Error:", error);
    // Fallback mechanism: return random numbers if Gemini fails
    const shuffled = [...availableNumbers].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
};
