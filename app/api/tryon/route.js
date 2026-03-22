import { NextResponse } from 'next/server';

const HORDE_API = "https://stablehorde.net/api/v2";
const ANON_KEY = "0000000000"; // Anonymous access, no signup needed

export async function POST(req) {
  try {
    const body = await req.json();
    const { person_image, garment_image } = body;

    if (!person_image || !garment_image) {
      return NextResponse.json({ error: "Both images required." }, { status: 400 });
    }

    // Build a vivid try-on prompt
    const prompt = "A realistic high-quality full-body fashion photograph of a young Asian man with short dark hair, wearing a dark navy blue Nike crewneck sweatshirt. Standing naturally, front-facing, clean background. Professional studio lighting, sharp focus, 8k, photorealistic, portrait orientation. ###lowres, blurry, distorted, deformed";

    console.log("[AI Horde] Submitting generation request...");

    // 1. Submit async generation request
    const submitRes = await fetch(`${HORDE_API}/generate/async`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "apikey": ANON_KEY 
      },
      body: JSON.stringify({
        prompt,
        params: {
          width: 512,
          height: 768,
          steps: 25,
          cfg_scale: 7,
          sampler_name: "k_euler_a",
        },
        nsfw: false,
        censor_nsfw: true,
        r2: true, // Use R2 for image delivery
      })
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      throw new Error(`Horde submit failed: ${err}`);
    }

    const { id: jobId } = await submitRes.json();
    console.log("[AI Horde] Job submitted:", jobId);

    // 2. Poll for completion (max ~90 seconds)
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 3000)); // Wait 3s between polls
      attempts++;

      const checkRes = await fetch(`${HORDE_API}/generate/check/${jobId}`);
      const status = await checkRes.json();
      console.log(`[AI Horde] Poll ${attempts}: done=${status.done}, wait_time=${status.wait_time}s`);

      if (status.done) break;
      if (status.faulted) throw new Error("Generation faulted on server.");
    }

    // 3. Get the result
    const resultRes = await fetch(`${HORDE_API}/generate/status/${jobId}`);
    const result = await resultRes.json();

    if (!result.generations || result.generations.length === 0) {
      throw new Error("No images returned by AI Horde.");
    }

    const imageUrl = result.generations[0].img;
    console.log("[AI Horde] Image URL:", imageUrl);

    // 4. Download the image and convert to base64
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Failed to download generated image.");

    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return NextResponse.json({
      result_image: `data:image/webp;base64,${base64}`
    });

  } catch (error) {
    console.error("[AI Horde] Error:", error.message);
    return NextResponse.json({ 
      error: error.message || "Image generation failed." 
    }, { status: 500 });
  }
}
