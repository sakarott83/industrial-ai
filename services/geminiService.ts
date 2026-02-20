
import { GoogleGenAI, Type } from "@google/genai";
import { Company, SearchFilters, ApiProvider } from "../types";

export class InferenceService {
  private getActiveProvider(): { provider: ApiProvider; key: string } {
    const stored = localStorage.getItem('api_config');
    let provider: ApiProvider = 'gemini';
    let key = process.env.API_KEY || '';

    if (stored) {
      try {
        const config = JSON.parse(stored);
        provider = config.provider;
        if (provider === 'gemini') {
          key = process.env.API_KEY || '';
        } else {
          key = config.apiKey;
        }
      } catch (e) {
        return { provider: 'gemini', key: process.env.API_KEY || '' };
      }
    }
    return { provider, key };
  }

  async searchCompanies(filters: SearchFilters, existingCompanyNames: string[] = []): Promise<Company[]> {
    const { provider, key } = this.getActiveProvider();
    
    const exclusionText = existingCompanyNames.length > 0 
      ? `NON includere queste aziende già trovate: ${existingCompanyNames.join(", ")}. Cerca aziende DIVERSE.` 
      : "Cerca le aziende più rilevanti.";

    const prompt = `Agisci come un analista industriale esperto di Lombardia. 
    Genera un elenco dettagliato di aziende (industrie, logistica, manifattura, grandi strutture) REALI e note situate a ${filters.city} (${filters.province}).
    
    ISTRUZIONI DI RICERCA:
    1. Focalizzati su zone industriali, distretti e aree artigianali.
    2. ${exclusionText}
    3. Per ogni azienda identifica dati verosimili: P.IVA (se nota), indirizzo preciso, settore.
    4. Stima il consumo elettrico annuo (GWh) basandoti sulla tipologia di impianto.
    
    Fornisci i risultati in formato JSON strutturato con questi campi: name, vatNumber, address, city, province, industry, estimatedConsumptionGWh (numero), category (HIGH se > 1.5, LOW altrimenti).`;

    if (provider === 'cerebras') {
      return this.callCerebras(prompt, key);
    } else {
      return this.callGemini(prompt, key);
    }
  }

  private async callCerebras(prompt: string, key: string): Promise<Company[]> {
    try {
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b',
          messages: [
            { role: 'system', content: 'Sei un assistente specializzato in analisi industriale lombarda. Rispondi SEMPRE e SOLO con un oggetto JSON contenente un array chiamato "companies".' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        if (response.status === 429) throw new Error("QUOTA_EXHAUSTED");
        throw new Error(errData.error?.message || "Errore Cerebras");
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      const results = Array.isArray(parsed) ? parsed : (parsed.companies || parsed.results || []);
      
      return results.map((c: any, index: number) => ({
        ...c,
        id: `cerebras-${Date.now()}-${index}`,
        estimatedConsumptionGWh: Number(c.estimatedConsumptionGWh) || 0,
        category: (Number(c.estimatedConsumptionGWh) > 1.5) ? 'HIGH' : 'LOW'
      }));
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  private async callGemini(prompt: string, _unusedKey: string): Promise<Company[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                vatNumber: { type: Type.STRING },
                address: { type: Type.STRING },
                city: { type: Type.STRING },
                province: { type: Type.STRING },
                industry: { type: Type.STRING },
                estimatedConsumptionGWh: { type: Type.NUMBER },
                category: { type: Type.STRING }
              },
              required: ["name", "industry", "estimatedConsumptionGWh", "category"]
            }
          }
        }
      });

      const results = JSON.parse(response.text || "[]");
      return results.map((c: any, index: number) => ({
        ...c,
        id: `gemini-${Date.now()}-${index}`
      }));
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async processRawData(rawData: string): Promise<Company[]> {
    const { provider, key } = this.getActiveProvider();
    const prompt = `Trasforma questo testo grezzo in una lista JSON di aziende con stima consumi GWh:\n${rawData}`;

    if (provider === 'cerebras') {
      return this.callCerebras(prompt, key);
    } else {
      return this.callGemini(prompt, key);
    }
  }

  async chatWithSearch(message: string) {
    const { provider, key } = this.getActiveProvider();
    if (provider === 'cerebras') {
      try {
        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b',
            messages: [{ role: 'user', content: message }]
          })
        });
        const data = await response.json();
        return { text: data.choices[0].message.content };
      } catch (e) {
        return { text: "Errore di connessione con Cerebras." };
      }
    } else {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: message,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      let text = response.text || "";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        const sources = groundingChunks
          .filter((chunk: any) => chunk.web?.uri)
          .map((chunk: any) => `\n- [${chunk.web.title || 'Source'}](${chunk.web.uri})`)
          .join('');
        if (sources) {
          text += `\n\n**Fonti Verificate:**\n${sources}`;
        }
      }
      return { text };
    }
  }

  private handleError(error: any) {
    const msg = error.message?.toLowerCase() || "";
    if (msg.includes("429") || msg.includes("quota") || msg.includes("limit")) throw new Error("QUOTA_EXHAUSTED");
    if (msg.includes("key") || msg.includes("unauthorized")) throw new Error("KEY_INVALID");
  }
}

export const inference = new InferenceService();
