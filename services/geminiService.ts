
import { GoogleGenAI, Type } from "@google/genai";

export const getLuckyNumbers = async (
  lotteryTitle: string, 
  availableNumbers: number[], 
  count: number = 5
): Promise<number[]> => {
  
  try {
    // Initialize inside function to ensure environment variables are loaded
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API_KEY not found, using fallback random numbers");
      return availableNumbers.sort(() => 0.5 - Math.random()).slice(0, count);
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      Estoy jugando a una lotería llamada "${lotteryTitle}".
      Necesito que generes ${count} números de la suerte únicos para mí.
      
      Aquí está la lista de números disponibles que puedo elegir:
      ${JSON.stringify(availableNumbers.slice(0, 200))}
      
      Reglas:
      1. Solo selecciona números de la lista proporcionada.
      2. Devuelve los números como un array JSON de enteros.
    `;

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
    if (!text) throw new Error("No response text");

    const numbers = JSON.parse(text);
    if (Array.isArray(numbers)) {
      return numbers.map((n: any) => Number(n));
    }
    
    throw new Error("Invalid format");

  } catch (error) {
    console.error("Gemini Lucky Number Error:", error);
    const shuffled = [...availableNumbers].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
};
