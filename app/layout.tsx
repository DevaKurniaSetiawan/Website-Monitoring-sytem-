import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import type React from "react"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dashboard Monitoring Ikan - Real-time Water Quality",
  description:
    "Sistem monitoring kualitas air untuk akuakultur dengan pemantauan suhu, pH, dan kekeruhan secara real-time",

  icons: {
    icon: "/iconikan.jpg",
    apple: "/iconikan.jpg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
