module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/tryon/route.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
const HORDE_API = "https://stablehorde.net/api/v2";
const ANON_KEY = "0000000000"; // Anonymous access, no signup needed
async function POST(req) {
    try {
        const body = await req.json();
        const { person_image, garment_image } = body;
        if (!person_image || !garment_image) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Both images required."
            }, {
                status: 400
            });
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
                    sampler_name: "k_euler_a"
                },
                nsfw: false,
                censor_nsfw: true,
                r2: true
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
        while(attempts < maxAttempts){
            await new Promise((r)=>setTimeout(r, 3000)); // Wait 3s between polls
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
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            result_image: `data:image/webp;base64,${base64}`
        });
    } catch (error) {
        console.error("[AI Horde] Error:", error.message);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || "Image generation failed."
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0rwqx54._.js.map