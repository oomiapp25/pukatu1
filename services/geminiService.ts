
import { GoogleGenAI, Type } from "@google/genai";

export const getLuckyNumbers = async (
  lotteryTitle: string, 
  availableNumbers: number[], 
  count: number = 5
): Promise<number[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return availableNumbers.sort(() => 0.5 - Math.random()).slice(0, count);
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      Estoy jugando a una lotería llamada "${lotteryTitle}".
      Necesito que generes ${count} números de la suerte únicos para mí de la siguiente lista:
      ${JSON.stringify(availableNumbers.slice(0, 200))}
      Devuelve los números como un array JSON de enteros.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.INTEGER }
        }
      }
    });

    const numbers = JSON.parse(response.text || '[]');
    return Array.isArray(numbers) ? numbers.map(Number) : [];
  } catch (error) {
    return availableNumbers.sort(() => 0.5 - Math.random()).slice(0, count);
  }
};

export const generateDrawNarrative = async (
    lotteryTitle: string,
    prize: string,
    winningNumber: number
): Promise<string> => {
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) return `¡Felicidades al ganador del número ${winningNumber}!`;

        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Escribe una breve y emocionante historia (máximo 150 palabras) sobre cómo el número ${winningNumber} resultó ganador del sorteo "${lotteryTitle}" con un premio de ${prize}. Usa un tono festivo y misterioso. Menciona que la suerte estuvo del lado del poseedor del ticket.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });

        return response.text || `¡La suerte ha hablado! El número ${winningNumber} se lleva el gran premio de ${prize}.`;
    } catch (e) {
        return `¡El gran ganador es el número ${winningNumber}!`;
    }
}
