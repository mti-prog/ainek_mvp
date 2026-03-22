import { GoogleGenAI, Modality } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, clothingName, clothingImageUrl } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const personImageData = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const parts: object[] = [];

    // Always add person photo first
    parts.push({
      inlineData: { mimeType: "image/jpeg", data: personImageData },
    });

    // Add clothing image if available
    if (clothingImageUrl && clothingImageUrl.startsWith("data:image/")) {
      const clothingData = clothingImageUrl.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: { mimeType: "image/jpeg", data: clothingData },
      });
      parts.push({
        text: `TASK: Virtual clothing try-on. 
IMAGE 1: The person whose photo must be preserved exactly.
IMAGE 2: The clothing item to put on them.

STRICT RULES:
- Keep the EXACT SAME person from Image 1 (same face, same body, same skin tone, same hair)
- Keep the EXACT SAME camera angle and pose from Image 1  
- Keep the EXACT SAME background from Image 1
- Keep the EXACT SAME lighting from Image 1
- ONLY change the clothing to the item shown in Image 2
- Do NOT generate a new person or change the viewpoint
- Result must look like the original photo but with different clothes

Output: The edited photo of the same person wearing the new clothing.`,
      });
    } else {
      parts.push({
        text: `TASK: Virtual clothing try-on.
IMAGE: The person whose photo must be preserved exactly.
CLOTHING TO ADD: "${clothingName}"

STRICT RULES:
- Keep the EXACT SAME person (same face, same body, same skin tone, same hair)
- Keep the EXACT SAME camera angle and pose
- Keep the EXACT SAME background
- Keep the EXACT SAME lighting
- ONLY change the clothing to "${clothingName}"
- Do NOT generate a new person or change the viewpoint
- Result must look like the original photo but with different clothes

Output: The edited photo of the same person wearing "${clothingName}".`,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [{ role: "user", parts: parts as never }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        temperature: 0.2,
      },
    });

    let generatedImageBase64: string | null = null;
    let textResponse: string | null = null;

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        generatedImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textResponse = part.text;
      }
    }

    if (!generatedImageBase64) {
      return NextResponse.json(
        { error: "Model did not return an image. Try again.", text: textResponse },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      generatedImage: generatedImageBase64,
      text: textResponse,
    });

  } catch (error) {
    console.error("Gemini API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to generate try-on image", details: message },
      { status: 500 }
    );
  }
}