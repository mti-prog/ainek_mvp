import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, clothingImageUrl, clothingName } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-preview-image-generation",
    });

    const prompt = `You are a virtual fitting room AI. The user wants to try on: "${clothingName}". 
    Generate a photorealistic image showing this person wearing the selected clothing item naturally and stylishly.
    Preserve the person's exact pose, skin tone, hair, and facial features.
    The clothing should fit naturally on their body with proper lighting and shadows.
    Make it look like a professional fashion photo.`;

    // Build content parts
    const imagePart = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: "image/jpeg" as const,
      },
    };

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            imagePart,
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        // @ts-expect-error - responseModalities is supported in newer SDK versions
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    const response = result.response;
    let generatedImageBase64: string | null = null;
    let textResponse: string | null = null;

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        generatedImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textResponse = part.text;
      }
    }

    return NextResponse.json({
      success: true,
      generatedImage: generatedImageBase64,
      text: textResponse,
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to generate try-on image", details: String(error) },
      { status: 500 }
    );
  }
}
