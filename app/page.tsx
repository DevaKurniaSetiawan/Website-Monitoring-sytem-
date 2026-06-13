"use client"

import { LineChart } from "@/components/line-chart"
import { SensorCard } from "@/components/sensor-card"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { Activity, ChevronLeft, ChevronRight, Download, Droplets, Eye, Flame, Thermometer, Trash2, Zap } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

// Configuration - Set to true to use dummy data, false to use actual sensor data
const USE_DUMMY = false

interface SensorData {
  temperature: number
  ph: number
  turbidity: number
}

interface ActuatorData {
  waterpump: "ON" | "OFF"
  heater: "ON" | "OFF"
}

interface HistoryItem {
  rawTime: string
  timestamp: string
  temperature: number
  ph: number
  turbidity: number
  fuzzyRules: string[] // Array of rule names like ["R1", "R5", "R12"]
  waterpump: "ON" | "OFF"
  heater: "ON" | "OFF"
}

interface ApiSensorItem {
  suhu: number
  ph: number
  kekeruhan: number
  waktu: string
  fuzzy_rules?: string[] | string | null
  waterpump?: string
  heater?: string
}

const ITEMS_PER_PAGE = 10
const MAX_HISTORY_ITEMS = 100
const STORAGE_KEY = "sensor_history_data"
const CHART_ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50, 100]

const parseFuzzyRules = (rawFuzzyRules: ApiSensorItem["fuzzy_rules"]): string[] => {
  if (!rawFuzzyRules) return []
  if (Array.isArray(rawFuzzyRules)) return rawFuzzyRules
  return rawFuzzyRules
    .split(",")
    .map((rule) => rule.trim())
    .filter(Boolean)
}

const parseSwitchStatus = (status?: string): "ON" | "OFF" => (status === "ON" ? "ON" : "OFF")

const toHistoryItem = (item: ApiSensorItem): HistoryItem | null => {
  const parsedTime = new Date(item.waktu)
  if (Number.isNaN(parsedTime.getTime())) return null

  return {
    rawTime: parsedTime.toISOString(),
    timestamp: parsedTime.toLocaleString("id-ID"),
    temperature: item.suhu,
    ph: item.ph,
    turbidity: item.kekeruhan,
    fuzzyRules: parseFuzzyRules(item.fuzzy_rules),
    waterpump: parseSwitchStatus(item.waterpump),
    heater: parseSwitchStatus(item.heater),
  }
}

// Helper functions for localStorage
const saveHistoryToStorage = (data: HistoryItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.error("[v0] Error saving to localStorage:", err)
  }
}

const loadHistoryFromStorage = (): HistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (err) {
    console.error("[v0] Error loading from localStorage:", err)
    return []
  }
}

// Dummy data - 20 entries riwayat sensor
const DUMMY_HISTORY: HistoryItem[] = [
  { rawTime: "2024-01-15T08:00:00Z", timestamp: "15/1/2024, 15:00:00", temperature: 26.5, ph: 7.2, turbidity: 25, fuzzyRules: ["R1", "R5"], waterpump: "ON", heater: "OFF" },
  { rawTime: "2024-01-15T08:10:00Z", timestamp: "15/1/2024, 15:10:00", temperature: 26.7, ph: 7.25, turbidity: 28, fuzzyRules: ["R1", "R5"], waterpump: "ON", heater: "OFF" },
  { rawTime: "2024-01-15T08:20:00Z", timestamp: "15/1/2024, 15:20:00", temperature: 26.8, ph: 7.3, turbidity: 30, fuzzyRules: ["R1", "R5"], waterpump: "ON", heater: "OFF" },
  { rawTime: "2024-01-15T08:30:00Z", timestamp: "15/1/2024, 15:30:00", temperature: 27.0, ph: 7.28, turbidity: 32, fuzzyRules: ["R2", "R6"], waterpump: "ON", heater: "OFF" },
  { rawTime: "2024-01-15T08:40:00Z", timestamp: "15/1/2024, 15:40:00", temperature: 27.2, ph: 7.4, turbidity: 35, fuzzyRules: ["R3", "R7", "R12"], waterpump: "OFF", heater: "ON" },
  { rawTime: "2024-01-15T08:50:00Z", timestamp: "15/1/2024, 15:50:00", temperature: 27.1, ph: 7.35, turbidity: 33, fuzzyRules: ["R3", "R7"], waterpump: "OFF", heater: "ON" },
  { rawTime: "2024-01-15T09:00:00Z", timestamp: "15/1/2024, 16:00:00", temperature: 27.3, ph: 7.42, turbidity: 36, fuzzyRules: ["R3", "R8", "R15"], waterpump: "OFF", heater: "ON" },
  { rawTime: "2024-01-15T09:10:00Z", timestamp: "15/1/2024, 16:10:00", temperature: 27.5, ph: 7.5, turbidity: 40, fuzzyRules: ["R4", "R9", "R18"], waterpump: "ON", heater: "ON" },
  { rawTime: "2024-01-15T09:20:00Z", timestamp: "15/1/2024, 16:20:00", temperature: 27.6, ph: 7.48, turbidity: 38, fuzzyRules: ["R4", "R9"], waterpump: "ON", heater: "ON" },
  { rawTime: "2024-01-15T09:30:00Z", timestamp: "15/1/2024, 16:30:00", temperature: 27.8, ph: 7.55, turbidity: 42, fuzzyRules: ["R5", "R10", "R19"], waterpump: "ON", heater: "OFF" },
  { rawTime: "2024-01-15T09:40:00Z", timestamp: "15/1/2024, 16:40:00", temperature: 28.0, ph: 7.6, turbidity: 45, fuzzyRules: ["R5", "R11"], waterpump: "ON", heater: "OFF" },
  { rawTime: "2024-01-15T09:50:00Z", timestamp: "15/1/2024, 16:50:00", temperature: 28.2, ph: 7.58, turbidity: 48, fuzzyRules: ["R6", "R11", "R20"], waterpump: "ON", heater: "OFF" },
  { rawTime: "2024-01-15T10:00:00Z", timestamp: "15/1/2024, 17:00:00", temperature: 28.1, ph: 7.52, turbidity: 46, fuzzyRules: ["R6"], waterpump: "OFF", heater: "OFF" },
  { rawTime: "2024-01-15T10:10:00Z", timestamp: "15/1/2024, 17:10:00", temperature: 27.9, ph: 7.5, turbidity: 44, fuzzyRules: ["R5"], waterpump: "OFF", heater: "OFF" },
  { rawTime: "2024-01-15T10:20:00Z", timestamp: "15/1/2024, 17:20:00", temperature: 27.7, ph: 7.45, turbidity: 41, fuzzyRules: ["R4", "R8", "R16"], waterpump: "ON", heater: "ON" },
  { rawTime: "2024-01-15T10:30:00Z", timestamp: "15/1/2024, 17:30:00", temperature: 27.5, ph: 7.42, turbidity: 39, fuzzyRules: ["R4", "R8"], waterpump: "ON", heater: "ON" },
  { rawTime: "2024-01-15T10:40:00Z", timestamp: "15/1/2024, 17:40:00", temperature: 27.3, ph: 7.4, turbidity: 37, fuzzyRules: ["R3", "R7"], waterpump: "ON", heater: "OFF" },
  { rawTime: "2024-01-15T10:50:00Z", timestamp: "15/1/2024, 17:50:00", temperature: 27.1, ph: 7.38, turbidity: 34, fuzzyRules: ["R2", "R6"], waterpump: "ON", heater: "OFF" },
  { rawTime: "2024-01-15T11:00:00Z", timestamp: "15/1/2024, 18:00:00", temperature: 26.9, ph: 7.35, turbidity: 31, fuzzyRules: ["R1", "R5"], waterpump: "ON", heater: "OFF" },
  { rawTime: "2024-01-15T11:10:00Z", timestamp: "15/1/2024, 18:10:00", temperature: 26.7, ph: 7.32, turbidity: 28, fuzzyRules: ["R1", "R5"], waterpump: "ON", heater: "OFF" },
]

export default function DashboardPage() {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    ph: 0,
    turbidity: 0,
  })
  const [actuatorData, setActuatorData] = useState<ActuatorData>({
    waterpump: "OFF",
    heater: "OFF",
  })
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [lastFeedTime, setLastFeedTime] = useState("15/1/2024, 18:10:00")
  const [currentPage, setCurrentPage] = useState(1)
  const [currentChartPage, setCurrentChartPage] = useState(1)
  const [chartItemsPerPage, setChartItemsPerPage] = useState(10)
  const [isLoading, setIsLoading] = useState(true)

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE) || 1
  const totalChartPages = Math.ceil(history.length / chartItemsPerPage) || 1
  const paginatedHistory = history.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Get data for chart pagination (customizable items per page)
  const chartStartIndex = (currentChartPage - 1) * chartItemsPerPage
  const chartEndIndex = chartStartIndex + chartItemsPerPage
  const paginatedChartData = history.slice(chartStartIndex, chartEndIndex)

  const chartData = {
    labels: paginatedChartData.map((h) => h.timestamp.slice(11, 16)),
    datasets: [
      {
        label: "Suhu (°C)",
        data: paginatedChartData.map((h) => h.temperature),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
      {
        label: "pH",
        data: paginatedChartData.map((h) => h.ph),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
      },
      {
        label: "Kekeruhan (NTU)",
        data: paginatedChartData.map((h) => h.turbidity),
        borderColor: "rgb(245, 158, 11)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.4,
      },
    ],
  }

  const fetchSensorData = useCallback(async () => {
    try {
      if (USE_DUMMY) {
        // Use dummy data
        if (history.length === 0) {
          setHistory(DUMMY_HISTORY)
          const latest = DUMMY_HISTORY[DUMMY_HISTORY.length - 1]
          setSensorData({
            temperature: latest.temperature,
            ph: latest.ph,
            turbidity: latest.turbidity,
          })
        }
      } else {
        // Try to fetch from API (don't fallback to dummy data, keep state empty)
        try {
          const res = await axios.get("/data-sensor", {
            timeout: 3000,
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
              "Expires": "0",
            }
          })
          console.log("[v0] API Response received:", res.data)
          const apiData: ApiSensorItem[] = Array.isArray(res.data) ? res.data : []
          if (apiData.length > 0) {
            const latest = apiData[apiData.length - 1]
            console.log("[v0] Latest sensor data:", latest)
            setSensorData({
              temperature: latest.suhu,
              ph: latest.ph,
              turbidity: latest.kekeruhan,
            })

            setHistory((prev) => {
              const historyByTime = new Map(prev.map((entry) => [entry.rawTime, entry] as const))

              for (const row of apiData) {
                const parsed = toHistoryItem(row)
                if (!parsed) continue
                historyByTime.set(parsed.rawTime, parsed)
              }

              const mergedHistory = Array.from(historyByTime.values()).sort(
                (a, b) => new Date(a.rawTime).getTime() - new Date(b.rawTime).getTime(),
              )

              const newHistoryState =
                mergedHistory.length > MAX_HISTORY_ITEMS ? mergedHistory.slice(-MAX_HISTORY_ITEMS) : mergedHistory

              // Save to localStorage
              saveHistoryToStorage(newHistoryState)
              return newHistoryState
            })
          }
        } catch (err) {
          console.error("[v0] Failed to fetch sensor data from API:", err)
          if (axios.isAxiosError(err)) {
            console.error("[v0] API Error Details:", err.message, err.code)
          }
          // Don't fallback to dummy data - wait for API to be available
        }
      }
      setIsLoading(false)
    } catch (err) {
      console.error("[v0] Error fetching sensor data:", err)
      setIsLoading(false)
    }
  }, [history.length])

  const fetchLastFeedTime = useCallback(async () => {
    try {
      const res = await axios.get("/hasil-terakhir", {
        timeout: 3000,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        }
      })
      setLastFeedTime(res.data.waktu_makan || "Belum ada")
    } catch {
      // Keep the dummy data time if API is not available
      setLastFeedTime("15/1/2024, 18:10:00")
    }
  }, [])

  const fetchActuatorData = useCallback(async () => {
    try {
      if (USE_DUMMY) {
        // Use dummy actuator data
        setActuatorData({
          waterpump: Math.random() > 0.5 ? "ON" : "OFF",
          heater: Math.random() > 0.5 ? "ON" : "OFF",
        })
      } else {
        // Try to fetch from API
        try {
          const res = await axios.get("/data-sensor", { timeout: 3000 })
          if (res.data && res.data.length > 0) {
            const latest = res.data[res.data.length - 1]
            setActuatorData({
              waterpump: latest.waterpump || "OFF",
              heater: latest.heater || "OFF",
            })
          }
        } catch (err) {
          console.error("[v0] Failed to fetch actuator data from API:", err)
        }
      }
    } catch (err) {
      console.error("[v0] Error fetching actuator data:", err)
    }
  }, [])

  const clearHistory = () => {
    if (history.length === 0) return
    const ok = window.confirm("Hapus seluruh riwayat data sensor? Tindakan ini tidak dapat dibatalkan.")
    if (ok) {
      setHistory([])
      setCurrentPage(1)
      // Clear from localStorage
      localStorage.removeItem(STORAGE_KEY)
      console.log("[v0] History cleared from localStorage")
    }
  }

  const exportToXLSX = async () => {
    if (history.length === 0) return

    const XLSX = await import("xlsx")

    const headers = ["Nomor", "Waktu", "Suhu (C)", "pH", "Kekeruhan (NTU)", "Fuzzy Rules", "Waterpump", "Heater"]
    const rows = history
      .slice()
      .reverse()
      .map((item, index) => [
        (index + 1).toString(),
        item.timestamp,
        item.temperature.toFixed(2),
        item.ph.toFixed(2),
        item.turbidity.toFixed(2),
        item.fuzzyRules.join(", "),
        item.waterpump,
        item.heater,
      ])

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Sensor")

    const timestamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(workbook, `sensor-data-${timestamp}.xlsx`)
  }

  useEffect(() => {
    // Load history from localStorage first
    const savedHistory = loadHistoryFromStorage()

    // Initialize based on USE_DUMMY flag
    if (USE_DUMMY) {
      // If there's saved history, use it; otherwise use dummy data
      if (savedHistory.length > 0) {
        setHistory(savedHistory)
        const latest = savedHistory[savedHistory.length - 1]
        setSensorData({
          temperature: latest.temperature,
          ph: latest.ph,
          turbidity: latest.turbidity,
        })
      } else {
        setHistory(DUMMY_HISTORY)
        saveHistoryToStorage(DUMMY_HISTORY)
        const latest = DUMMY_HISTORY[DUMMY_HISTORY.length - 1]
        setSensorData({
          temperature: latest.temperature,
          ph: latest.ph,
          turbidity: latest.turbidity,
        })
      }
      setIsLoading(false)
    } else {
      // For real sensor data, load from storage or start empty
      if (savedHistory.length > 0) {
        setHistory(savedHistory)
        const latest = savedHistory[savedHistory.length - 1]
        setSensorData({
          temperature: latest.temperature,
          ph: latest.ph,
          turbidity: latest.turbidity,
        })
      }
      // Fetch new data from API
      fetchSensorData()
      fetchLastFeedTime()
    }

    // Fetch actuator data
    fetchActuatorData()

    const intervalId = setInterval(() => {
      fetchSensorData()
      fetchLastFeedTime()
      fetchActuatorData()
    }, 10000)
    return () => clearInterval(intervalId)
  }, [fetchSensorData, fetchLastFeedTime, fetchActuatorData])

  // Adjust current page if it exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    if (currentChartPage > totalChartPages) {
      setCurrentChartPage(totalChartPages)
    }
  }, [currentChartPage, totalChartPages])

  const getSensorStatus = (type: "temperature" | "ph" | "turbidity"): "normal" | "warning" | "danger" => {
    if (type === "temperature") {
      if (sensorData.temperature < 24 || sensorData.temperature > 30) return "danger"
      if (sensorData.temperature < 26 || sensorData.temperature > 28) return "warning"
      return "normal"
    }
    if (type === "ph") {
      if (sensorData.ph < 6.5 || sensorData.ph > 8.5) return "danger"
      if (sensorData.ph < 7 || sensorData.ph > 8) return "warning"
      return "normal"
    }
    if (type === "turbidity") {
      if (sensorData.turbidity > 200) return "danger"
      if (sensorData.turbidity > 50) return "warning"
      return "normal"
    }
    return "normal"
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Dashboard Monitoring Ikan</h1>
              <p className="text-muted-foreground text-lg mt-1">Pantau kualitas air secara real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Terakhir diperbarui:</span>
            <span className="text-muted-foreground">{lastFeedTime}</span>
          </div>
        </header>

        {/* Sensor Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <SensorCard
            title="Suhu Air"
            value={sensorData.temperature}
            unit="°C"
            icon={Thermometer}
            color="bg-blue-500"
            status={getSensorStatus("temperature")}
          />
          <SensorCard
            title="pH Air"
            value={sensorData.ph}
            unit=""
            icon={Droplets}
            color="bg-emerald-500"
            status={getSensorStatus("ph")}
          />
          <SensorCard
            title="Kekeruhan"
            value={sensorData.turbidity}
            unit="NTU"
            icon={Eye}
            color="bg-amber-500"
            status={getSensorStatus("turbidity")}
          />
          {/* Actuator Status Cards */}
          <div className="bg-card border rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status Aktuator</p>
                <h3 className="text-lg font-semibold">Waterpump</h3>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${actuatorData.waterpump === "ON"
              ? "bg-emerald-500/20 text-emerald-700"
              : "bg-slate-500/20 text-slate-700"
              }`}>
              <div className={`w-2 h-2 rounded-full ${actuatorData.waterpump === "ON" ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
              {actuatorData.waterpump}
            </div>
          </div>

          <div className="bg-card border rounded-xl shadow-sm p-6 md:col-span-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status Aktuator</p>
                <h3 className="text-lg font-semibold">Heater</h3>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <Flame className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${actuatorData.heater === "ON"
              ? "bg-red-500/20 text-red-700"
              : "bg-slate-500/20 text-slate-700"
              }`}>
              <div className={`w-2 h-2 rounded-full ${actuatorData.heater === "ON" ? "bg-red-500 animate-pulse" : "bg-slate-500"}`} />
              {actuatorData.heater}
            </div>
          </div>
        </section>

        {/* Chart Section */}
        <section className="bg-card border rounded-xl shadow-sm p-6 mb-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Grafik Parameter Air</h2>
              <p className="text-muted-foreground">Visualisasi perubahan data sensor dalam waktu nyata</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="chart-items-per-page" className="text-sm text-muted-foreground">
                Data per halaman
              </label>
              <select
                id="chart-items-per-page"
                value={chartItemsPerPage}
                onChange={(e) => {
                  const nextValue = Number(e.target.value)
                  if (Number.isNaN(nextValue)) return
                  setChartItemsPerPage(nextValue)
                  setCurrentChartPage(1)
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CHART_ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} data
                  </option>
                ))}
              </select>
            </div>
          </div>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          ) : (
            <>
              <div className="h-80 mb-4">
                <LineChart chartData={chartData} />
              </div>
              {history.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {chartStartIndex + 1} - {Math.min(chartEndIndex, history.length)} dari {history.length} data
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentChartPage((p) => Math.max(1, p - 1))}
                      disabled={currentChartPage === 1}
                      className="gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Sebelumnya
                    </Button>
                    <div className="px-4 py-2 text-sm font-medium">
                      Halaman {currentChartPage} dari {totalChartPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentChartPage((p) => Math.min(totalChartPages, p + 1))}
                      disabled={currentChartPage === totalChartPages}
                      className="gap-2"
                    >
                      Selanjutnya
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* History Table */}
        <section className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-1">Riwayat Data Sensor</h2>
                <p className="text-muted-foreground">Catatan historis pembacaan sensor</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={exportToXLSX}
                  disabled={history.length === 0}
                  className="gap-2 bg-transparent"
                >
                  <Download className="w-4 h-4" />
                  Export XLSX
                </Button>
                <Button
                  variant="destructive"
                  onClick={clearHistory}
                  disabled={history.length === 0}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Bersihkan Riwayat
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-6 py-4 text-left text-sm font-semibold w-16">Nomor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Waktu</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Suhu (°C)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">pH</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Kekeruhan (NTU)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Fuzzy Rules</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Waterpump</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Heater</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      Belum ada data riwayat
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map((item, index) => {
                    // Calculate the actual number from newest (1) to oldest
                    const actualIndex = history.length - ((currentPage - 1) * ITEMS_PER_PAGE + index)
                    return (
                      <tr key={index} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-blue-600">{actualIndex}</td>
                        <td className="px-6 py-4 text-sm font-mono">{item.timestamp}</td>
                        <td className="px-6 py-4 text-sm font-medium">{item.temperature.toFixed(2)}°C</td>
                        <td className="px-6 py-4 text-sm font-medium">{item.ph.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-medium">{item.turbidity.toFixed(2)} NTU</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {item.fuzzyRules.length > 0 ? (
                              item.fuzzyRules.map((rule) => (
                                <span key={rule} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-700">
                                  {rule}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${item.waterpump === "ON"
                            ? "bg-emerald-500/20 text-emerald-700"
                            : "bg-slate-500/20 text-slate-700"
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.waterpump === "ON" ? "bg-emerald-500" : "bg-slate-500"}`} />
                            {item.waterpump}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${item.heater === "ON"
                            ? "bg-red-500/20 text-red-700"
                            : "bg-slate-500/20 text-slate-700"
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.heater === "ON" ? "bg-red-500" : "bg-slate-500"}`} />
                            {item.heater}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {history.length > 0 && (
            <div className="p-4 border-t bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, history.length)} dari {history.length} data
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Sebelumnya
                  </Button>
                  <div className="px-4 py-2 text-sm font-medium">
                    Halaman {currentPage} dari {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="gap-2"
                  >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

