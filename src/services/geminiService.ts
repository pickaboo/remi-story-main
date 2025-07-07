/// <reference path="../types.ts" />

import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { GEMINI_TEXT_MODEL } from "../constants"; // GEMINI_IMAGE_MODEL was same as text, using text directly
import { UserDescriptionEntry } from "../types";

// Strict adherence to guideline: API key MUST be obtained from environment
// For Vite, environment variables prefixed with VITE_ are exposed on import.meta.env
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  // Error handling for missing API key should be done where it's critical for app operation,
  // or the SDK itself might throw an error. Alerting here can be intrusive if the service
  // isn't immediately used or if the key is conditionally provided.
  // Consider a global app initialization check or rely on SDK errors.
  console.warn("Gemini API Key (VITE_API_KEY) is not configured in .env. Gemini features will not work.");
}

// Initialize with a fallback or handle the undefined case more gracefully if API_KEY might be missing.
// For now, assume API_KEY will be provided, or calls will fail.
const ai = new GoogleGenAI({ apiKey: API_KEY! }); 

export interface GeminiAnalysisResult {
  description: string;
  geotags: string[];
  aiGeneratedPlaceholder: string;
  timestamp: string;
}

export const analyzeImageWithGemini = async (base64ImageData: string, mimeType: string): Promise<GeminiAnalysisResult> => {
  if (!API_KEY) {
    console.error("VITE_API_KEY not configured for analyzeImageWithGemini.");
    // Return a default error-indicating response that matches GeminiAnalysisResult
    return { description: "Gemini API-nyckel ej konfigurerad.", geotags: [], aiGeneratedPlaceholder: '', timestamp: new Date().toISOString() };
  }
  try {
    const imagePart: Part = {
      inlineData: {
        mimeType: mimeType,
        data: base64ImageData,
      },
    };
    const textPart: Part = {
      text: "Ge en objektiv och strikt faktabaserad beskrivning av den här bilden PÅ SVENSKA. Koncentrera dig uteslutande på vad som faktiskt syns: identifierbara objekt, personer (om några, beskriv deras uppenbara handlingar eller attribut utan spekulation), miljö/omgivning, dominerande färger och tydliga texturer. Undvik all form av tolkning, känslomässiga beskrivningar, poetiskt språk, konversationellt fluff, markdown-formatering (som asterisker eller listor), eller fraser som 'Den här bilden skildrar...' eller 'Vi ser...'. Leverera enbart den rena, direkta och neutrala observationen.\nSkriv sedan, på en ny rad, 'GEO_TAGS:' följt av en kommaseparerad lista med 2-5 potentiella geotaggar eller relevanta platsnyckelord PÅ SVENSKA baserat på bildinnehållet. Exempel: GEO_TAGS: Paris, Eiffeltornet, Frankrike"
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL, // GEMINI_TEXT_MODEL is 'gemini-2.5-flash-preview-04-17' which is vision capable
      contents: { parts: [imagePart, textPart] },
    });
    
    const rawText = response.text;

    if (rawText === undefined) {
        console.error("[GeminiService] analyzeImageWithGemini: Gemini response text is undefined.");
        return { description: "Kunde inte analysera bilden (tomt svar från AI).", geotags: [], aiGeneratedPlaceholder: '', timestamp: new Date().toISOString() };
    }

    let description = rawText;
    let geotags: string[] = [];

    const geotagMarker = "GEO_TAGS:";
    const geotagIndex = rawText.indexOf(geotagMarker);

    if (geotagIndex !== -1) {
      description = rawText.substring(0, geotagIndex).trim();
      const geotagsString = rawText.substring(geotagIndex + geotagMarker.length).trim();
      if (geotagsString) {
        geotags = geotagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    }
    
    const analysisResult: GeminiAnalysisResult = {
      description: description || '',
      geotags: geotags || [],
      aiGeneratedPlaceholder: '',
      timestamp: new Date().toISOString(),
    };

    return analysisResult;
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    // Return a default or error-indicating response that matches GeminiAnalysisResult
    return { description: "Ett fel uppstod vid bildanalys.", geotags: [], aiGeneratedPlaceholder: '', timestamp: new Date().toISOString() };
  }
};

interface StoryCompilationData {
  geminiAnalysis?: string;
  userDescriptions: UserDescriptionEntry[];
  tags?: string[];
  imageDate?: string;
}

export const compileStoryWithGemini = async (data: StoryCompilationData): Promise<string> => {
  if (!API_KEY) {
    console.error("VITE_API_KEY not configured for compileStoryWithGemini.");
    throw new Error("Gemini API Key not configured");
  }
  try {
    let prompt = `Du är en mästerlig historieberättare. Din uppgift är att väva samman den information som tillhandahålls om en bild till ett enda, fängslande berättande stycke PÅ SVENSKA, lämpligt för ett bildspel. Berättelsen ska vara engagerande, målande och flyta naturligt.

**Prioritera och integrera Användarnas Berättelser.** Dessa är personliga redogörelser och bör utgöra kärnan i berättelsen om de finns tillgängliga.

**Formateringsregler:**
*   Producera ett enda textblock. Använd inte markdown som \`*\`, \`#\`, eller listpunkter.
*   Undvik fraser som "Baserat på informationen..." eller "Berättelsen skulle kunna vara...". Berätta direkt historien.
*   Tonen ska vara stilfull och beskrivande.
*   ALL output ska vara PÅ SVENSKA.

Information:
Bildens datum: ${data.imageDate || 'Ej specificerat'}
Taggar: ${data.tags && data.tags.length > 0 ? data.tags.join(', ') : 'Inga'}
AI Bildanalys (använd för kontext om det hjälper, men Användarnas Berättelser har företräde): "${data.geminiAnalysis || 'Ej tillhandahållen'}"

Användarnas Berättelser:
${data.userDescriptions && data.userDescriptions.length > 0
  ? data.userDescriptions.map(ud => `- Användare (ID: ${ud.userId}) berättade: "${ud.description}"`).join('\n')
  : 'Inga användarberättelser tillhandahållna.'
}

Skapa nu berättelsen:`;

    const textPart: Part = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: { parts: [textPart] }, 
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    const textOutput = response.text;
    if (textOutput === undefined) {
        console.error("[GeminiService] compileStoryWithGemini: Gemini response text is undefined.");
        throw new Error("Berättelsen kunde inte kompileras då inget textinnehåll mottogs från AI-tjänsten.");
    }

    let storyText = textOutput.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = storyText.match(fenceRegex);
    if (match && match[2]) {
      storyText = match[2].trim();
    }
    return storyText;

  } catch (error) {
    console.error("Error compiling story with Gemini:", error);
    throw new Error(`Fel vid kompilering av berättelse: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateEngagingQuestionFromAnalysis = async (analysisText: string): Promise<string> => {
  if (!API_KEY) {
    console.error("VITE_API_KEY not configured for generateEngagingQuestionFromAnalysis.");
    return "Vad får den här bilden dig att tänka på?";
  }
  if (!analysisText || analysisText.trim() === "") {
     return "Vad får den här bilden dig att tänka på?";
  }

  try {
    const prompt = `Du är en varm och inbjudande historieinspiratör. Baserat på AI-analysen av en bild, gör följande PÅ SVENSKA:
1.  Börja med en kort (1-2 meningar), positiv och allmän kommentar om bilden. Exempelvis: "Vilken härlig stämning på den bilden!" eller "Det ser ut som ett fint ögonblick."
2.  Följ sedan upp med EN KORT (max 15 ord), allmän och öppen fråga som uppmuntrar användaren att dela en bredare personlig berättelse, ett minne, vilka som var med, vad de gjorde, eller känslor kopplade till bilden. Exempel på frågor: "Vad gjorde ni där?", "Vilka fler var med och delade det ögonblicket?", "Berätta mer om den dagen!", "Vad kände du just då?".

Formatera svaret som en enda sammanhängande text. Undvik markdown. Den totala längden bör vara ungefär 20-30 ord.

Exempel på HELA svaret:
- Analys nämner "solnedgång över ett hav med segelbåtar": "Åh, vilken vacker solnedgång med segelbåtarna! Vad kände du när du såg det?"
- Analys nämner "en grupp vänner som skrattar runt en lägereld": "Det ser verkligen mysigt ut vid lägerelden! Vilket är ditt bästa minne från den kvällen?"
- Analys nämner "ett barn som leker med en hund i en park": "Vilken gullig hund och vilket glatt barn! Vad var det roligaste som hände i parken?"

AI-analys: "${analysisText}"

Din kommentar och fråga:`;

    const textPart: Part = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: { parts: [textPart] },
      config: {
        temperature: 0.75, 
        topP: 0.95,
      }
    });
    
    const textOutput = response.text;
    if (textOutput === undefined) {
        console.error("[GeminiService] generateEngagingQuestionFromAnalysis: Gemini response text is undefined.");
        return "Vad är din historia bakom den här bilden?"; // Fallback
    }

    let questionText = textOutput.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = questionText.match(fenceRegex);
    if (match && match[2]) {
      questionText = match[2].trim();
    }

    if (questionText.split(' ').length > 35 || questionText.length === 0) { 
        return "Berätta mer om det här ögonblicket!";
    }

    return questionText;

  } catch (error) {
    console.error("Error generating engaging question with Gemini:", error);
    return "Vad är din historia bakom den här bilden?"; // Fallback on error
  }
};
