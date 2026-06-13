"use client"

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js"
import { useEffect, useRef } from "react"
import { Line } from "react-chartjs-2"

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler)

interface Dataset {
  label: string
  data: number[]
  borderColor: string
  backgroundColor: string
  tension?: number
}

interface ChartData {
  labels: string[]
  datasets: Dataset[]
}

interface LineChartProps {
  chartData: ChartData
}

export function LineChart({ chartData }: LineChartProps) {
  const chartRef = useRef<ChartJS<"line">>(null)

  useEffect(() => {
    // Force chart update when data changes
    if (chartRef.current) {
      chartRef.current.update()
    }
  }, [chartData])

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: 500,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 13,
          weight: "bold",
        },
        bodyFont: {
          size: 12,
        },
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ""
            if (label) {
              label += ": "
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2)
            }
            return label
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  }

  return <Line ref={chartRef} data={chartData} options={options} />
}
