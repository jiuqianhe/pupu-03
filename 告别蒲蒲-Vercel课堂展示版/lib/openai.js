import { createHash } from "node:crypto";

const windows = new Map();

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  return {
    responses: {
      async create(body) {
        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(data.error?.message || `OpenAI request failed (${response.status})`);
          error.status = response.status;
          throw error;
        }
        return data;
      }
    }
  };
}

export function getModel() {
  if (!process.env.OPENAI_MODEL) throw new Error("OPENAI_MODEL is not configured");
  return process.env.OPENAI_MODEL;
}

export function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export async function readJSON(request) {
  if (request.method !== "POST") throw Object.assign(new Error("Method not allowed"), { status: 405 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4_000_000) throw Object.assign(new Error("Request is too large"), { status: 413 });
  return request.json();
}

export function allowRequest(request, bucket, limit = 18) {
  const rawIP = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "classroom-demo";
  const key = `${bucket}:${rawIP}`;
  const now = Date.now();
  const current = windows.get(key);
  if (!current || now - current.startedAt > 60_000) {
    windows.set(key, { startedAt: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

export function safetyIdentifier(request) {
  const rawIP = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "classroom-demo";
  return createHash("sha256").update(rawIP).digest("hex").slice(0, 32);
}

export function outputJSON(response) {
  const text = outputText(response);
  if (!text) throw new Error("The model returned an empty response");
  return JSON.parse(text);
}

export function outputText(response) {
  if (response?.output_text) return String(response.output_text).trim();
  return (response?.output || []).flatMap(item => item?.content || []).filter(item => item?.type === "output_text").map(item => item.text || "").join("").trim();
}

export function apiError(error) {
  const status = Number(error?.status) || 500;
  const safeStatus = [400, 405, 413, 429].includes(status) ? status : 500;
  const message = safeStatus === 500 ? "AI service is temporarily unavailable" : error.message;
  return json({ error: message }, safeStatus);
}
