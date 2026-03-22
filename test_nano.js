import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

const ai = new GoogleGenAI({ apiKey: "AIzaSyDH0whaNnoa4HaE4wAncNxdH9Ln2XzOp5g" });

async function main() {
  const models = [
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image-preview",
  ];

  for (const modelName of models) {
    console.log(`\n--- Testing ${modelName} ---`);
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: "Generate a simple picture of a blue car on a white background.",
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log("Text:", part.text);
        } else if (part.inlineData) {
          console.log(`SUCCESS! Got image data (${part.inlineData.data.length} bytes)`);
          const buffer = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(`test_${modelName.replace(/\./g, "_")}.png`, buffer);
          console.log(`Saved to test_${modelName.replace(/\./g, "_")}.png`);
        }
      }
    } catch (e) {
      console.error(`Error on ${modelName}:`, e.message?.substring(0, 200));
    }
  }
}

main();
