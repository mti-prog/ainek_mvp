import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: "AIzaSyDH0whaNnoa4HaE4wAncNxdH9Ln2XzOp5g" });

async function test() {
  const models = ['gemini-1.5-pro', 'gemini-1.5-flash-8b', 'gemini-1.0-pro'];
  for (const m of models) {
    try {
      console.log(`Testing ${m}...`);
      const response = await ai.models.generateContent({
        model: m,
        contents: 'Hi',
      });
      console.log(`Success on ${m}:`, response.text);
      return;
    } catch (e) {
      console.error(`Error on ${m}:`, e.message);
    }
  }
}

test();
