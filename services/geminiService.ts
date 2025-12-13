import { GoogleGenAI, Type } from "@google/genai";
import { Step } from "../types";

// Helper to get a fresh instance with the current key
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please select an API key.");
  }
  return new GoogleGenAI({ apiKey });
};

export const checkApiKey = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return false;
};

export const promptApiKey = async (): Promise<void> => {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  } else {
    alert("AI Studio environment not detected.");
  }
};

const getUserLocation = (): Promise<{lat: number, lon: number} | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => {
        console.warn("Location access denied or failed.", err);
        resolve(null);
      },
      { timeout: 5000 }
    );
  });
};

/**
 * Analyzes the uploaded image to identify the object.
 * Uses Gemini 3 Pro Preview for robust multimodal reasoning.
 */
export const analyzeImage = async (base64Image: string): Promise<{ objectName: string }> => {
  const ai = getAI();
  
  // Remove header if present for sending to API (though GoogleGenAI usually handles inlineData well, 
  // keeping it clean is safer if we manually strip)
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
        { text: "Identify the main object in this image that might need fixing or explaining. Return just the name of the object (e.g., 'Espresso Machine', 'Bicycle Wheel'). Keep it short." }
      ]
    }
  });

  return { objectName: response.text?.trim() || "Unknown Object" };
};

/**
 * Generates the text steps based on the user's goal.
 * Uses Gemini 3 Pro Preview.
 */
export const generateGuideSteps = async (
  base64Image: string, 
  objectName: string, 
  goal: string
): Promise<Step[]> => {
  const ai = getAI();
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const prompt = `
    I have a ${objectName}. My goal is: "${goal}".
    Please provide a 4-step guide to achieve this goal.
    
    For each step, provide:
    1. A short title.
    2. A concise description.
    3. A specific 'visual_prompt' that describes exactly what the image should look like to illustrate this step. 
       Important: The visual prompt MUST instruct to overlay text labels (like arrows or numbers) directly onto the image to explain the action.
    4. A 'reasoning' string explaining scientifically or mechanically WHY this step is necessary (e.g. 'Wood glue requires 24h pressure to bond successfully').
    5. A 'focus_box' array of 4 numbers [ymin, xmin, ymax, xmax] (values 0-100) estimating the percentage coordinates where the main action takes place in the frame.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            step: { type: Type.INTEGER },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            visual_prompt: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            focus_box: { 
              type: Type.ARRAY,
              items: { type: Type.NUMBER }
            }
          },
          required: ["step", "title", "description", "visual_prompt", "reasoning", "focus_box"]
        }
      }
    }
  });

  const rawSteps = JSON.parse(response.text || "[]");
  
  return rawSteps.map((s: any) => ({
    id: s.step,
    title: s.title,
    description: s.description,
    visualPrompt: s.visual_prompt,
    reasoning: s.reasoning,
    focusBox: s.focus_box,
    isGeneratingImage: false
  }));
};

/**
 * Generates a 2K resolution image for a specific step using Nano Banana Pro (Gemini 3 Pro Image).
 * Uses the original image as a reference.
 */
export const generateStepImage = async (
  base64Reference: string,
  visualPrompt: string
): Promise<string> => {
  const ai = getAI();
  const cleanBase64 = base64Reference.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const response = await ai.models.generateContent({
    // Model Verification: 'gemini-3-pro-image-preview' is the Nano Banana Pro model ID.
    model: "gemini-3-pro-image-preview",
    contents: {
      parts: [
        // Reference image is passed first to ground the generation
        { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
        { 
          text: `${visualPrompt}
          
          CRITICAL INSTRUCTIONS:
          1. Use the provided image as a strict REFERENCE for the object's appearance (colors, materials, shape). The generated object must look identical to the reference.
          2. Render in photorealistic style.
          3. Legibly overlay any text or arrows described in the prompt.` 
        }
      ]
    },
    config: {
      imageConfig: {
        // Nano Banana Pro capability verification: 2K resolution
        imageSize: "2K",
        aspectRatio: "16:9"
      }
    }
  });

  // Extract image from response
  // The response structure for image generation often returns parts with inlineData or similar.
  // We need to iterate to find the image part.
  const parts = response.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("No image generated.");
};

/**
 * Analyzes the current generated image for a step and suggests quick refinements.
 */
export const getRefinementSuggestions = async (
  imageBase64: string,
  stepDescription: string
): Promise<string[]> => {
  const ai = getAI();
  // Ensure we remove any data URL prefix
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const prompt = `
    I am looking at an instructional image for this step: "${stepDescription}".
    Based on the image provided, suggest 3 short, specific "Quick Chips" or refinements to improve the visual clarity or utility for the user.
    Examples: "Zoom in on the joint", "Show side profile", "Highlight the tool".
    Keep them under 5 words each.
    Return ONLY a JSON array of 3 strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/png", data: cleanBase64 } }, // Assuming png/jpeg
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to get suggestions", e);
    // Fallback if API fails
    return ["Zoom in closer", "Show different angle", "Highlight details"];
  }
};

/**
 * Searches for replacement product information using Google Search grounding.
 */
export const searchForReplacement = async (objectName: string): Promise<{ summary: string; options: Array<{ retailer: string, product: string, price: string, url: string }>; sources: Array<{title: string, uri: string}> }> => {
  const ai = getAI();

  // Attempt to get user location
  const location = await getUserLocation();
  let locationContext = "";
  if (location) {
    locationContext = `The user is located at Latitude: ${location.lat}, Longitude: ${location.lon}. 
    CRITICAL: Filter search results for retailers accessible in this location and display prices in the local currency. 
    If the location implies a specific country (e.g. UK, US), prioritize stores from that country.`;
  }

  const prompt = `
    Context: The user has a broken item identified as "${objectName}" and they want to give up and buy a NEW replacement.
    
    Task: Search for the current purchase price of a BRAND NEW, FULLY FUNCTIONAL version of this object.
    
    IMPORTANT: If the identified object name contains adjectives like "broken", "damaged", "smashed", "faulty", or "busted", you MUST ignore those adjectives for the search.
    - Example 1: If object is "Broken Chair", search for "New Office Chair".
    - Example 2: If object is "Flat Tire", search for "New Bicycle Tire".
    - Example 3: If object is "Smashed Screen", search for "New Monitor".

    ${locationContext}
    
    Find 3 specific buying options from major retailers available now.
    
    RETURN ONLY RAW JSON. NO MARKDOWN. NO CONVERSATIONAL TEXT.
    Structure:
    {
      "summary": "A short sentence summarizing the price range.",
      "options": [
        { "retailer": "Retailer Name", "product": "Product Name", "price": "Price with currency", "url": "Direct link to the product page found in search" }
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      // Important: Do NOT use responseMimeType or responseSchema with googleSearch tool
    },
  });

  let text = response.text || "{}";
  // Remove markdown code blocks if the model adds them despite instructions
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // Attempt to extract JSON from conversational text using regex
    // This is necessary because models with tools sometimes output conversational text before the JSON
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
        try {
            json = JSON.parse(match[0]);
        } catch (e2) {
            console.error("Regex JSON parse failed", e2);
        }
    }
    
    if (!json) {
        console.error("Parsing search JSON failed, falling back", e);
        // Best effort fallback: treat text as summary if it's not too long, otherwise generic message
        const summaryText = text.length < 500 ? text : "Could not parse detailed pricing, please check the sources below.";
        json = { summary: summaryText, options: [] };
    }
  }
  
  const summary = json.summary || "Here are some buying options.";
  const options = json.options || [];
  
  // Extract grounding chunks for links
  const sources: Array<{title: string, uri: string}> = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title,
          uri: chunk.web.uri
        });
      }
    });
  }

  return { summary, options, sources };
};