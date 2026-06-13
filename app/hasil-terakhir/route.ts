import { NextResponse } from "next/server"

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? "http://localhost:5000"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const backendRes = await fetch(`${BACKEND_BASE_URL}/hasil-terakhir`, {
      method: "GET",
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
        message: "Gagal mengambil waktu makan terakhir dari backend",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 502 },
    )
  }
}
