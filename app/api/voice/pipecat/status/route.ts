import { NextResponse } from "next/server";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
  });
}

export async function GET() {
  const clientUrl = process.env.PIPECAT_CLIENT_URL || "http://localhost:7860/client";
  const healthUrl = process.env.PIPECAT_HEALTH_URL || process.env.PIPECAT_BASE_URL || "http://localhost:7860";

  try {
    const response = await withTimeout(fetch(healthUrl, { method: "GET" }), 2500);
    return NextResponse.json({
      ok: true,
      reachable: response.ok,
      status: response.status,
      clientUrl,
      healthUrl,
    });
  } catch {
    return NextResponse.json({
      ok: true,
      reachable: false,
      clientUrl,
      healthUrl,
    });
  }
}
