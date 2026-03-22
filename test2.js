import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: "AIzaSyDH0whaNnoa4HaE4wAncNxdH9Ln2XzOp5g" });

async function test() {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: 'A blue car',
      config: { numberOfImages: 1 }
    });
    console.log(response.generatedImages?.[0] ? 'Success' : 'Blank');
  } catch (e) {
    console.error(e.message);
  }
}

test();
