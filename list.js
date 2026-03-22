import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: "AIzaSyDH0whaNnoa4HaE4wAncNxdH9Ln2XzOp5g" });

async function list() {
  const models = [];
  for await (const model of ai.models.list()) {
    models.push(model.name);
  }
  console.log("AVAILABLE MODELS:", models);
}

list().catch(console.error);
