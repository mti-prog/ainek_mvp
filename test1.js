import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: "AIzaSyDH0whaNnoa4HaE4wAncNxdH9Ln2XzOp5g" });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Hi',
    });
    console.log(response.text);
  } catch (e) {
    console.error(e.message);
  }
}

test();
