import { NextResponse } from "next/server"

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? "http://localhost:5000"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const payload = await req.json()

    const backendRes = await fetch(`${BACKEND_BASE_URL}/kirim-sensor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const text = await backendRes.text()
    return new NextResponse(text, {
      status: backendRes.status,
      headers: { "Content-Type": backendRes.headers.get("content-type") ?? "application/json" },
    })
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: "Gagal meneruskan data sensor ke backend",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 502 },
    )
  }
}
