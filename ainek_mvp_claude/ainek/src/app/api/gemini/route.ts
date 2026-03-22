import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, clothingName } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const prompt = `You are a virtual fitting room AI. The user wants to try on: "${clothingName}".
Generate a photorealistic image showing this exact person wearing the selected clothing item.
Preserve the person's exact pose, skin tone, hair, face, and body proportions.
Replace only their current clothing with the "${clothingName}".
The clothing should fit naturally with proper lighting and shadows matching the original photo.
Make it look like a professional fashion photograph.`;

    // Strip data URL prefix for inline data
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
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