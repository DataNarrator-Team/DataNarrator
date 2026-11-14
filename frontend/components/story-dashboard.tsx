"use client"

import React, { useState, useEffect } from "react"
import {
  Sparkles,
  ArrowLeft,
  Download,
  Share2,
  RefreshCw,
  Info,
  CheckCircle2,
  Database,
  Layers,
  BookOpen,
  Lightbulb,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Sliders,
  GitFork,
  Columns3,
  UploadCloud,
  Plus,
  Check,
  Clock,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  Loader2,
} from "lucide-react"
import {
  DatasetMeta,
  getDashboardStory,
  TrendPoint,
  BarItem,
  DonutSegment,
  BoxPlotData,
} from "@/lib/dataset-models"
import { getDemoQuickGoals, QuickGoalExample } from "@/components/column-recommendation-step"
import {
  CHART_PALETTES,
  ChartPalette,
  ChartPaletteKey,
  getStoredPalette,
} from "@/lib/chart-palettes"


// Helper to map quick goal to compatible analysis type
function mapGoalToAnalysisType(goalLabel: string): "trend" | "comparison" | "desc_freq" | "correlation" {
  const lower = goalLabel.toLowerCase()
  if (lower.includes("growth") || lower.includes("time") || lower.includes("trend") || lower.includes("churn over time")) return "trend"
  if (lower.includes("product") || lower.includes("plan") || (lower.includes("channel") && !lower.includes("margin"))) return "comparison"
  if (lower.includes("leave") || lower.includes("why") || lower.includes("margin")) return "desc_freq"
  if (lower.includes("spend") || lower.includes("vs") || lower.includes("deal")) return "correlation"
  return "comparison"
}

// Generate synthesized synergy message between two goals
function getSynergySummary(datasetName: string | undefined, goalA: QuickGoalExample, goalB: QuickGoalExample): string {
  if (datasetName?.includes("Customer_Retention")) {
    return "Cross-analysis reveals that subscriber churn peaking in Month 3 directly correlates with the Starter subscription tier, whereas Enterprise retention maintains high stability throughout the cohort lifecycle."
  }
  if (datasetName?.includes("Marketing_Campaign")) {
    return "Correlating ad channel spend with deals growth indicates that scaling Google Ads yields 3.75x ROAS with diminishing returns after August, suggesting a high-intent focus for Q4."
  }
  // Global Sales Default
  return "Correlating monthly sales growth with category performance demonstrates that August's revenue surge ($198,400) was predominantly accelerated by high-margin Technology hardware and seasonal back-to-school demand."
}

// 1. Top Navigation Bar
function TopNavigation({
  datasetName,
  rowCount,
  onBack,
}: {
  datasetName?: string
  rowCount?: number
  onBack: () => void
  onNewProject?: () => void
}) {
  const [exportOpen, setExportOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportOpen(false)
      }
    }
    if (exportOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [exportOpen])

  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 3500)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // PDF Export: generates a valid, standard PDF 1.4 document and downloads it directly
  const handleExportPDF = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setExportOpen(false)

    try {
      const cleanName = (datasetName || "Customer_Retention_Cohort").replace(/\.[^/.]+$/, "")
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      
      const textCommands = [
        "BT",
        "/F1 22 Tf",
        "50 730 Td",
        "(DataNarrator - Visual Storyboard Report) Tj",
        "/F2 10 Tf",
        "0 -24 Td",
        `(${`Dataset: ${cleanName}  |  Generated: ${dateStr}`.replace(/[()\\]/g, "")}) Tj`,
        "0 -32 Td",
        "/F1 13 Tf",
        "(1. KEY PERFORMANCE INDICATORS) Tj",
        "/F2 10 Tf",
        "0 -18 Td",
        "(  * Monthly Revenue: $184,200 (+8.6% Growth)) Tj",
        "0 -16 Td",
        "(  * Biggest Drop Month: Month 3 (76%) - Critical Drop) Tj",
        "0 -16 Td",
        "(  * Most Loyal Plan: Enterprise (91%) - Highest Loyalty) Tj",
        "0 -16 Td",
        "(  * Average Customer Spend: $4,650 (+12.4% MoM)) Tj",
        "0 -28 Td",
        "/F1 13 Tf",
        "(2. EXECUTIVE STORYLINE & FINDINGS) Tj",
        "/F2 10 Tf",
        "0 -18 Td",
        "(  Step 1: When Users Leave - Cohort retention drops at Month 3 (-24%), stabilizing at 64%.) Tj",
        "0 -16 Td",
        "(  Step 2: Which Plans Stay - Enterprise subscribers exhibit 91% retention; Pro tier retains 78%.) Tj",
        "0 -16 Td",
        "(  Step 3: Why They Cancel - Pricing represents 44% of departures, followed by missing features (28%).) Tj",
        "0 -16 Td",
        "(  Step 4: Typical Order Size - Customers average $142 per order; Enterprise averages $1,280/mo.) Tj",
        "0 -26 Td",
        "/F1 11 Tf",
        "(3. ACTIONABLE TAKEAWAY) Tj",
        "/F2 10 Tf",
        "0 -16 Td",
        "(  Introduce account pause or lighter budget tier to retain budget-sensitive subscribers.) Tj",
        "ET"
      ].join("\n")

      const streamLength = new TextEncoder().encode(textCommands).length

      let pdf = "%PDF-1.4\n"
      const offsets: number[] = []

      function addObj(content: string) {
        offsets.push(new TextEncoder().encode(pdf).length)
        pdf += content + "\n"
      }

      addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj")
      addObj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj")
      addObj("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj")
      addObj("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj")
      addObj("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj")
      addObj(`6 0 obj\n<< /Length ${streamLength} >>\nstream\n${textCommands}\nendstream\nendobj`)

      const xrefOffset = new TextEncoder().encode(pdf).length
      pdf += "xref\n0 7\n0000000000 65535 f \n"
      for (let i = 0; i < offsets.length; i++) {
        pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \n"
      }
      pdf += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

      const blob = new Blob([pdf], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${cleanName}-report.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)

      setToastMessage("PDF report downloaded successfully!")
    } catch (err) {
      console.error("PDF export error:", err)
      // Fallback to window.print()
      try {
        window.print()
      } catch (e) {
        console.error(e)
      }
    }
  }

  // PNG Export: renders dashboard visual summary to an offscreen canvas and downloads PNG
  const handleExportPNG = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setExportOpen(false)

    try {
      const cleanName = (datasetName || "Customer_Retention_Cohort").replace(/\.[^/.]+$/, "")
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      
      const canvas = document.createElement("canvas")
      canvas.width = 1600
      canvas.height = 1050
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // 1. Outer background
      ctx.fillStyle = "#f8fafc"
      ctx.fillRect(0, 0, 1600, 1050)

      // 2. Card background
      ctx.fillStyle = "#ffffff"
      if (ctx.roundRect) {
        ctx.roundRect(40, 40, 1520, 970, 24)
        ctx.fill()
      } else {
        ctx.fillRect(40, 40, 1520, 970)
      }

      // 3. Header title
      ctx.fillStyle = "#0f172a"
      ctx.font = "bold 32px sans-serif"
      ctx.fillText("DataNarrator - Visual Storyboard Report", 80, 105)

      ctx.fillStyle = "#64748b"
      ctx.font = "15px sans-serif"
      ctx.fillText(`Dataset: ${cleanName} • Exported on ${dateStr}`, 80, 140)

      // 4. Accent line
      const grad = ctx.createLinearGradient(80, 165, 1520, 165)
      grad.addColorStop(0, "#4a7ff7")
      grad.addColorStop(1, "#8b5cf6")
      ctx.fillStyle = grad
      if (ctx.roundRect) {
        ctx.roundRect(80, 165, 1440, 5, 2.5)
        ctx.fill()
      } else {
        ctx.fillRect(80, 165, 1440, 5)
      }

      // 5. KPI Boxes
      const kpis = [
        { label: "Active Cohort MRR", val: "$184,200", change: "+8.6% Growth" },
        { label: "Day-90 Churn Cliff", val: "Month 3 (76%)", change: "Critical Drop" },
        { label: "Top Tier Retention", val: "Enterprise (91%)", change: "Highest Loyalty" },
        { label: "Average Customer Spend", val: "$4,650", change: "+12.4% MoM" },
      ]

      kpis.forEach((kpi, idx) => {
        const x = 80 + idx * 365
        ctx.fillStyle = "#f8fafc"
        ctx.strokeStyle = "#e2e8f0"
        ctx.lineWidth = 1.5
        if (ctx.roundRect) {
          ctx.roundRect(x, 195, 340, 105, 16)
          ctx.fill()
          ctx.stroke()
        } else {
          ctx.fillRect(x, 195, 340, 105)
        }
        ctx.fillStyle = "#64748b"
        ctx.font = "13px sans-serif"
        ctx.fillText(kpi.label, x + 20, 230)
        ctx.fillStyle = "#0f172a"
        ctx.font = "bold 26px sans-serif"
        ctx.fillText(kpi.val, x + 20, 268)
        ctx.fillStyle = "#4a7ff7"
        ctx.font = "bold 13px sans-serif"
        ctx.fillText(kpi.change, x + 20, 292)
      })

      // 6. Findings Box
      ctx.fillStyle = "#f8fafc"
      ctx.strokeStyle = "#e2e8f0"
      ctx.lineWidth = 1.5
      if (ctx.roundRect) {
        ctx.roundRect(80, 325, 1440, 640, 18)
        ctx.fill()
        ctx.stroke()
      } else {
        ctx.fillRect(80, 325, 1440, 640)
      }

      ctx.fillStyle = "#0f172a"
      ctx.font = "bold 22px sans-serif"
      ctx.fillText("Key Analytical Findings & Plain English Storyline", 115, 375)

      const findings = [
        { num: "1", title: "When Users Leave", text: "Cohort retention experiences its steepest drop at Month 3 (-24%), then stabilizes at 64% indefinitely." },
        { num: "2", title: "Which Plans Stay", text: "Enterprise subscribers exhibit world-class 91% retention, while Pro tier retains 78% of active users." },
        { num: "3", title: "Why They Cancel", text: "Pricing and budget sensitivity account for 44% of churn explanations, followed by missing features (28%)." },
        { num: "4", title: "Typical Order Size", text: "Customers spend an average of $142 per order, with Enterprise contracts averaging $1,280 monthly." },
      ]

      findings.forEach((item, i) => {
        const y = 430 + i * 90
        ctx.fillStyle = "#e0e7ff"
        if (ctx.roundRect) {
          ctx.roundRect(115, y - 22, 28, 28, 8)
          ctx.fill()
        } else {
          ctx.fillRect(115, y - 22, 28, 28)
        }
        ctx.fillStyle = "#4338ca"
        ctx.font = "bold 14px sans-serif"
        ctx.fillText(item.num, 124, y - 3)

        ctx.fillStyle = "#0f172a"
        ctx.font = "bold 16px sans-serif"
        ctx.fillText(item.title, 155, y - 3)

        ctx.fillStyle = "#475569"
        ctx.font = "14px sans-serif"
        ctx.fillText(item.text, 155, y + 22)
      })

      // Takeaway
      ctx.fillStyle = "#eff6ff"
      ctx.strokeStyle = "#bfdbfe"
      ctx.lineWidth = 1
      if (ctx.roundRect) {
        ctx.roundRect(115, 805, 1370, 70, 12)
        ctx.fill()
        ctx.stroke()
      } else {
        ctx.fillRect(115, 805, 1370, 70)
      }
      ctx.fillStyle = "#1e40af"
      ctx.font = "bold 15px sans-serif"
      ctx.fillText("Recommended Action:", 140, 846)
      ctx.fillStyle = "#1e3a8a"
      ctx.font = "14px sans-serif"
      ctx.fillText("Introduce an account pause option or a lighter budget tier to retain budget-sensitive subscribers.", 310, 846)

      // Download PNG
      const dataUrl = canvas.toDataURL("image/png")
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `${cleanName}-storyboard.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setToastMessage("PNG image downloaded successfully!")
    } catch (err) {
      console.error("PNG export error:", err)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-5 mb-6 gap-3 relative z-50">
      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Analytical Approach</span>
        </button>

        {datasetName && (
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-slate-50/80 dark:bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 shadow-2xs">
            <Database className="size-3.5 text-[#4a7ff7]" />
            <span className="font-semibold text-slate-800 dark:text-zinc-100">{datasetName}</span>
            {rowCount && (
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">({rowCount.toLocaleString()} rows)</span>
            )}
          </div>
        )}
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExportOpen((prev) => !prev)
          }}
          aria-expanded={exportOpen}
          aria-haspopup="true"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] text-white text-xs font-semibold shadow-sm cursor-pointer transition-all active:scale-[0.98]"
        >
          <Download className="size-3.5" />
          <span>Export</span>
          <ChevronDown className={`size-3.5 transition-transform duration-200 ${exportOpen ? "rotate-180" : ""}`} />
        </button>

        {exportOpen && (
          <div
            role="menu"
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 z-50 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800 mb-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Choose Export Format
              </p>
            </div>

            {/* Option 1: PDF Document */}
            <button
              type="button"
              role="menuitem"
              onClick={handleExportPDF}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-zinc-100 group-hover:text-[#4a7ff7] dark:group-hover:text-blue-400 transition-colors">
                    PDF Document
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Direct download ready report
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 uppercase">
                .pdf
              </span>
            </button>

            {/* Option 2: PNG Image */}
            <button
              type="button"
              role="menuitem"
              onClick={handleExportPNG}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors group mt-1"
            >
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ImageIcon className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-zinc-100 group-hover:text-[#4a7ff7] dark:group-hover:text-blue-400 transition-colors">
                    PNG Image
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                    High-resolution visual snapshot
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 uppercase">
                .png
              </span>
            </button>
          </div>
        )}

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-2xl animate-in slide-in-from-bottom-2 duration-200 border border-slate-800">
            <Check className="size-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function simplifyMetricLabel(label: string): string {
  const map: Record<string, string> = {
    "Active Cohort MRR": "Monthly Revenue",
    "Day-90 Churn Cliff": "Biggest Drop Month",
    "Top Tier Retention": "Most Loyal Plan",
    "Average Customer LTV": "Average Customer Spend",
    "Stabilized Retention": "Loyal Users Rate",
    "Primary Cancellation Reason": "Top Cancellation Reason",
    "Product Feature Gaps": "Missing Features Reported",
    "Recoverable Churn Rate": "Users You Can Win Back",
    "Median Monthly Fee": "Typical Monthly Charge",
    "Average Account Charge": "Average Customer Bill",
    "Top-Tier Account Range": "Enterprise Account Size",
    "Total Conversions Logged": "Total Customers Acquired",
    "Peak Acquisition Month": "Best Sales Month",
    "Blended Program ROAS": "Return on Ad Spend (ROAS)",
  }
  return map[label] || label
}

function simplifyMetricBadge(badge: string): string {
  const map: Record<string, string> = {
    "+8.6% MoM": "+8.6% Growth",
    "Critical Drop": "Needs Attention",
    "Benchmark": "Highest Loyalty",
    "Healthy Benchmark": "Loyal Users",
    "42% Churn": "42% Leave",
    "44% Share": "Top Reason (44%)",
    "Roadmap Priority": "Important",
    "High Opportunity": "Can Be Saved",
  }
  return map[badge] || badge
}

// 2. High-Level KPI & Summary Metrics Row
function StatsCardsRow({
  metrics,
  palette,
}: {
  metrics: { label: string; value: string; badge: string; isWarm?: boolean }[]
  palette?: ChartPalette
}) {
  const pColor = palette?.primary || "#4a7ff7"
  const sColor = palette?.secondary || "#e99842"
  const tColor = palette?.textHighlight || "#b86b1c"

  return (
    <div className={`grid gap-3 mb-5 ${
      metrics.length === 4
        ? "grid-cols-2 md:grid-cols-4"
        : metrics.length === 2
        ? "grid-cols-2"
        : "grid-cols-1 sm:grid-cols-3"
    }`}>
      {metrics.map((m) => (
        <div
          key={m.label}
          style={m.isWarm ? { borderColor: `${sColor}55` } : undefined}
          className={`rounded-2xl border p-3.5 shadow-2xs transition-all ${
            m.isWarm
              ? "border-[#e99842]/40 bg-gradient-to-br from-white via-orange-50/20 to-amber-50/40 dark:from-zinc-900 dark:via-orange-950/20 dark:to-amber-950/20"
              : "border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 truncate">
              {simplifyMetricLabel(m.label)}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold shrink-0"
              style={{
                backgroundColor: m.isWarm ? (palette?.lightShade || "rgba(233, 152, 66, 0.2)") : `${pColor}18`,
                color: m.isWarm ? tColor : pColor,
              }}
            >
              {simplifyMetricBadge(m.badge)}
            </span>
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
            {m.value}
          </p>
        </div>
      ))}
    </div>
  )
}

// Matrix of compatible visualization options mapped to analytical approaches
export interface CompatibleChartOption {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  ruleDescription: string
}

export const COMPATIBLE_CHARTS_BY_ANALYSIS: Record<string, CompatibleChartOption[]> = {
  trend: [
    {
      id: "line",
      title: "Line Chart",
      icon: TrendingUp,
      badge: "AI Pick",
      ruleDescription: "Standard visual hierarchy for tracking rate of change, peaks, and period-over-period timeline progression.",
    },
    {
      id: "area",
      title: "Area Chart",
      icon: Activity,
      badge: "Cumulative Volume",
      ruleDescription: "Fills the space beneath the trendline to highlight cumulative volume magnitude over time.",
    },
    {
      id: "stepline",
      title: "Step Line",
      icon: TrendingUp,
      badge: "Milestones",
      ruleDescription: "Connects points with horizontal and vertical steps to highlight discrete cohort shifts and plateaus.",
    },
  ],
  comparison: [
    {
      id: "vertical_bar",
      title: "Vertical Bar",
      icon: BarChart3,
      badge: "AI Pick",
      ruleDescription: "Standard analytical convention for ranking discrete categories and contrasting heights clearly.",
    },
    {
      id: "horizontal_bar",
      title: "Horizontal Bar",
      icon: Columns3,
      badge: "Long Labels",
      ruleDescription: "Horizontal bar layout making lengthy category titles easily readable without truncation.",
    },
    {
      id: "lollipop",
      title: "Lollipop Chart",
      icon: Sliders,
      badge: "Minimalist",
      ruleDescription: "Slender stems with focal endpoint markers reducing visual ink while highlighting benchmarks.",
    },
  ],
  desc_freq: [
    {
      id: "donut",
      title: "Donut Chart",
      icon: PieChart,
      badge: "AI Pick",
      ruleDescription: "Circular ring visualizing relative market share and percentage breakdown of 100%.",
    },
    {
      id: "pie",
      title: "Pie Chart",
      icon: PieChart,
      badge: "Proportion",
      ruleDescription: "Classic circular wedge slice breakdown showing proportion of total 100%.",
    },
    {
      id: "bar",
      title: "Frequency Bar",
      icon: BarChart3,
      badge: "Counts",
      ruleDescription: "Straightforward bar heights representing exact occurrence counts across groups.",
    },
  ],
  desc_numeric: [
    {
      id: "histogram",
      title: "Histogram",
      icon: BarChart3,
      badge: "AI Pick",
      ruleDescription: "Groups continuous numeric values into equal-interval bins to show spread and skewness.",
    },
    {
      id: "box",
      title: "Box Plot",
      icon: Sliders,
      badge: "IQR Spread",
      ruleDescription: "Five-number summary (Min, Q1, Median, Q3, Max) with detected statistical outliers.",
    },
    {
      id: "density",
      title: "Density Curve",
      icon: Activity,
      badge: "Probability Curve",
      ruleDescription: "Smooth continuous probability density curve modeling values without discrete bin lines.",
    },
  ],
  correlation: [
    {
      id: "scatter",
      title: "Scatter Plot",
      icon: GitFork,
      badge: "AI Pick",
      ruleDescription: "Plots two continuous variables with an overlaid linear regression trend fit line.",
    },
    {
      id: "bubble",
      title: "Bubble Chart",
      icon: PieChart,
      badge: "3D Magnitude",
      ruleDescription: "Encodes a third numeric variable into the bubble diameter radius.",
    },
  ],
}

// 3. Radio Button Switcher for Compatible Charts
function VisualizationSwitcher({
  compatibleOptions,
  activeChartId,
  onSelectChart,
  palette,
}: {
  compatibleOptions: CompatibleChartOption[]
  activeChartId: string
  onSelectChart: (chartId: string) => void
  palette?: ChartPalette
}) {
  if (!compatibleOptions || compatibleOptions.length <= 1) return null

  return (
    <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/90 dark:bg-[#252831] p-3 shadow-2xs backdrop-blur-sm">
      <div className="flex items-center gap-2 px-1 text-xs font-bold text-slate-700 dark:text-zinc-200">
        <Sliders className="size-4" style={{ color: palette?.primary || "#4a7ff7" }} />
        <span>Visualization Type:</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto" role="radiogroup">
        {compatibleOptions.map((opt) => {
          const Icon = opt.icon
          const isSelected = activeChartId === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectChart(opt.id)}
              style={isSelected ? { backgroundColor: palette?.primary || "#4a7ff7" } : undefined}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                isSelected
                  ? "text-white shadow-sm font-bold ring-2 ring-offset-1 ring-[#4a7ff7]/40 scale-[1.02]"
                  : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-zinc-100 border border-slate-200/60 dark:border-zinc-700"
              }`}
              title={`Select ${opt.title}`}
            >
              {/* Radio Button Circular Indicator */}
              <div
                className={`size-3.5 rounded-full flex items-center justify-center border transition-all ${
                  isSelected
                    ? "border-white bg-white/20"
                    : "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                }`}
              >
                {isSelected && (
                  <div className="size-1.5 rounded-full bg-white shadow-xs" />
                )}
              </div>

              <Icon className={`size-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
              <span>{opt.title}</span>

              {opt.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/70 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400"
                  }`}
                >
                  {opt.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// 4.1 Line, Area, and Step Line Visualization Graphic
function LineAreaGraphic({
  isArea,
  isStep,
  points,
  palette,
}: {
  isArea: boolean
  isStep?: boolean
  points?: TrendPoint[]
  palette?: ChartPalette
}) {
  const pColor = palette?.primary || "#4a7ff7"
  const sColor = palette?.secondary || "#e99842"
  const tColor = palette?.textHighlight || "#b86b1c"
  const gradStart = palette?.gradient.start || "#e99842"
  const gradEnd = palette?.gradient.end || "#4a7ff7"

  const defaultPoints: TrendPoint[] = [
    { x: 40, y: 150, label: "Jan", val: 84, displayVal: "$84K", isPeak: false },
    { x: 100, y: 125, label: "Feb", val: 92, displayVal: "$92K", isPeak: false },
    { x: 160, y: 135, label: "Mar", val: 110, displayVal: "$110K", isPeak: false },
    { x: 220, y: 85, label: "Apr", val: 105, displayVal: "$105K", isPeak: false },
    { x: 280, y: 100, label: "May", val: 128, displayVal: "$128K", isPeak: false },
    { x: 340, y: 55, label: "Jun", val: 145, displayVal: "$145K", isPeak: false },
    { x: 400, y: 70, label: "Jul", val: 162, displayVal: "$162K", isPeak: false },
    { x: 460, y: 35, label: "Aug", val: 198, displayVal: "$198K", isPeak: true },
  ]

  const activePoints = points && points.length > 0 ? points : defaultPoints

  const pathD = activePoints.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    if (isStep) {
      return `${acc} H ${p.x} V ${p.y}`
    }
    return `${acc} L ${p.x} ${p.y}`
  }, "")

  const lastPointX = activePoints[activePoints.length - 1]?.x || 460
  const firstPointX = activePoints[0]?.x || 40
  const areaD = `${pathD} L ${lastPointX} 180 L ${firstPointX} 180 Z`

  return (
    <svg viewBox="0 0 500 210" className="w-full h-44 sm:h-48 overflow-visible">
      <line x1="40" y1="40" x2="460" y2="40" stroke="currentColor" className="text-slate-100 dark:text-zinc-800" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="40" y1="85" x2="460" y2="85" stroke="currentColor" className="text-slate-100 dark:text-zinc-800" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="40" y1="130" x2="460" y2="130" stroke="currentColor" className="text-slate-100 dark:text-zinc-800" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="40" y1="180" x2="460" y2="180" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1" />

      {isArea && (
        <defs>
          <linearGradient id="areaWarmGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradStart} stopOpacity="0.28" />
            <stop offset="100%" stopColor={gradEnd} stopOpacity="0.04" />
          </linearGradient>
        </defs>
      )}

      {isArea && <path d={areaD} fill="url(#areaWarmGrad)" />}

      <path
        d={pathD}
        fill="none"
        stroke={pColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {activePoints.map((p) => (
        <g key={p.label}>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.isPeak ? "6" : "4"}
            className="fill-white dark:fill-zinc-900"
            stroke={p.isPeak ? sColor : pColor}
            strokeWidth={p.isPeak ? "3" : "2.5"}
          />
          {p.isPeak && <circle cx={p.x} cy={p.y} r="2.5" fill={sColor} />}

          <text
            x={p.x}
            y={p.y - 10}
            textAnchor="middle"
            fontSize="9"
            fill={p.isPeak ? tColor : undefined}
            className={p.isPeak ? "" : "fill-slate-600 dark:fill-zinc-300"}
            fontWeight="bold"
          >
            {p.displayVal}
          </text>

          <text
            x={p.x}
            y="200"
            textAnchor="middle"
            fontSize="10"
            fill={p.isPeak ? tColor : undefined}
            className={p.isPeak ? "" : "fill-slate-400 dark:fill-zinc-500"}
            fontWeight={p.isPeak ? "bold" : "600"}
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

// 4.2 Horizontal or Vertical Bar Chart Graphic
function BarGraphic({
  isHorizontal,
  bars,
  palette,
}: {
  isHorizontal: boolean
  bars?: BarItem[]
  palette?: ChartPalette
}) {
  const pColor = palette?.primary || "#4a7ff7"
  const sColor = palette?.secondary || "#e99842"
  const tColor = palette?.textHighlight || "#b86b1c"

  const defaultBars: BarItem[] = [
    { name: "Group A", val: 82, displayVal: "82%", isWarm: true },
    { name: "Group B", val: 64, displayVal: "64%", isWarm: false },
    { name: "Group C", val: 45, displayVal: "45%", isWarm: false },
    { name: "Group D", val: 32, displayVal: "32%", isWarm: false },
  ]

  const activeBars = bars && bars.length > 0 ? bars : defaultBars

  if (isHorizontal) {
    return (
      <div className="w-full max-w-lg space-y-2 py-1">
        {activeBars.map((b) => (
          <div key={b.name} className="text-xs">
            <div className="flex justify-between font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              <span>{b.name}</span>
              <span
                className="font-mono font-bold"
                style={{ color: b.isWarm ? sColor : pColor }}
              >
                {b.displayVal}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(10, b.val))}%`,
                  backgroundColor: b.isWarm ? sColor : pColor,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <svg viewBox="0 0 460 210" className="w-full h-44 sm:h-48 overflow-visible">
      <line x1="30" y1="165" x2="430" y2="165" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1" />
      {activeBars.map((b, idx) => {
        const x = 50 + idx * 95
        const h = Math.min(130, Math.max(20, (b.val / 100) * 140))
        const y = 165 - h
        return (
          <g key={b.name}>
            <rect
              x={x}
              y={y}
              width="44"
              height={h}
              rx="6"
              fill={b.isWarm ? sColor : pColor}
            />
            <text
              x={x + 22}
              y={y - 8}
              textAnchor="middle"
              fontSize="10"
              fill={b.isWarm ? tColor : pColor}
              fontWeight="bold"
            >
              {b.displayVal}
            </text>
            <text
              x={x + 22}
              y="185"
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              className="text-slate-500 dark:text-zinc-400 truncate"
              fontWeight="600"
            >
              {b.name.length > 12 ? b.name.slice(0, 11) + "…" : b.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// 4.3 Donut Chart Graphic with Palette Support
function DonutGraphic({
  segments,
  palette,
}: {
  segments?: DonutSegment[]
  palette?: ChartPalette
}) {
  const pColor = palette?.primary || "#4a7ff7"
  const sColor = palette?.secondary || "#e99842"
  const tColor = palette?.textHighlight || "#b86b1c"
  const colors = palette?.donutColors || ["#4a7ff7", "#e99842", "#94a3b8", "#cbd5e1"]

  const defaultSegments: DonutSegment[] = [
    { name: "Direct Share", share: 52, color: pColor, isPrimary: true },
    { name: "Marketplace", share: 28, color: sColor, isWarm: true },
    { name: "Wholesale", share: 14, color: colors[2] || "#94a3b8" },
    { name: "Other", share: 6, color: colors[3] || "#cbd5e1" },
  ]

  const activeSegments = segments && segments.length > 0 ? segments : defaultSegments
  const primarySegment = activeSegments.find((s) => s.isPrimary) || activeSegments[0]

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-3">
      <svg viewBox="0 0 160 160" className="size-44">
        <circle cx="80" cy="80" r="54" fill="none" stroke="currentColor" className="text-slate-100 dark:text-zinc-800" strokeWidth="20" />
        <circle
          cx="80"
          cy="80"
          r="54"
          fill="none"
          stroke={pColor}
          strokeWidth="20"
          strokeDasharray="210 340"
          strokeDashoffset="0"
          strokeLinecap="round"
        />
        <circle
          cx="80"
          cy="80"
          r="54"
          fill="none"
          stroke={sColor}
          strokeWidth="20"
          strokeDasharray="95 340"
          strokeDashoffset="-215"
          strokeLinecap="round"
        />
        <text x="80" y="83" textAnchor="middle" fontSize="16" fontWeight="bold" fill="currentColor" className="fill-slate-800 dark:fill-zinc-100">
          {primarySegment.share}%
        </text>
        <text x="80" y="96" textAnchor="middle" fontSize="8" fill={tColor} fontWeight="bold">
          PRIMARY SHARE
        </text>
      </svg>

      <div className="space-y-3 text-xs">
        {activeSegments.map((seg, idx) => {
          const sliceColor = colors[idx % colors.length] || seg.color
          return (
            <div key={seg.name} className="flex items-center gap-2.5">
              <span
                className="size-3 rounded-full shrink-0"
                style={{ backgroundColor: sliceColor }}
              />
              <span className="font-semibold text-slate-700 dark:text-zinc-200">
                {seg.name} ({seg.share}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 4.3.1 Pie Chart Graphic
function PieGraphic({
  segments,
  palette,
}: {
  segments?: DonutSegment[]
  palette?: ChartPalette
}) {
  const colors = palette?.donutColors || ["#4a7ff7", "#e99842", "#94a3b8", "#cbd5e1"]

  const defaultSegments: DonutSegment[] = [
    { name: "Direct Share", share: 52, color: colors[0], isPrimary: true },
    { name: "Marketplace", share: 28, color: colors[1], isWarm: true },
    { name: "Wholesale", share: 14, color: colors[2] || "#94a3b8" },
    { name: "Other", share: 6, color: colors[3] || "#cbd5e1" },
  ]

  const activeSegments = segments && segments.length > 0 ? segments : defaultSegments
  let cumulativePercent = 0

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-3">
      <svg viewBox="0 0 180 180" className="size-40 drop-shadow-xs overflow-visible">
        {activeSegments.map((seg, idx) => {
          const sliceColor = colors[idx % colors.length] || seg.color
          const sharePercent = seg.share / 100
          const startAngle = (cumulativePercent * 360 - 90) * (Math.PI / 180)
          cumulativePercent += sharePercent
          const endAngle = (cumulativePercent * 360 - 90) * (Math.PI / 180)

          const r = 70
          const cx = 90
          const cy = 90

          const x1 = cx + r * Math.cos(startAngle)
          const y1 = cy + r * Math.sin(startAngle)
          const x2 = cx + r * Math.cos(endAngle)
          const y2 = cy + r * Math.sin(endAngle)
          const largeArc = sharePercent > 0.5 ? 1 : 0

          const pathD = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`

          return (
            <path
              key={seg.name}
              d={pathD}
              fill={sliceColor}
              stroke="currentColor"
              strokeWidth="2"
              className="text-white dark:text-zinc-900 transition-all duration-200 hover:opacity-90 cursor-pointer"
            />
          )
        })}
      </svg>

      <div className="space-y-3 text-xs">
        {activeSegments.map((seg, idx) => {
          const sliceColor = colors[idx % colors.length] || seg.color
          return (
            <div key={seg.name} className="flex items-center gap-2.5">
              <span
                className="size-3 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: sliceColor }}
              />
              <span className="font-semibold text-slate-700 dark:text-zinc-200">
                {seg.name} ({seg.share}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 4.3.2 Lollipop Chart Graphic
function LollipopGraphic({
  bars,
  palette,
}: {
  bars?: BarItem[]
  palette?: ChartPalette
}) {
  const pColor = palette?.primary || "#4a7ff7"
  const sColor = palette?.secondary || "#e99842"
  const tColor = palette?.textHighlight || "#b86b1c"

  const defaultBars: BarItem[] = [
    { name: "Group A", val: 82, displayVal: "82%", isWarm: true },
    { name: "Group B", val: 64, displayVal: "64%", isWarm: false },
    { name: "Group C", val: 45, displayVal: "45%", isWarm: false },
    { name: "Group D", val: 32, displayVal: "32%", isWarm: false },
  ]
  const activeBars = bars && bars.length > 0 ? bars : defaultBars

  return (
    <svg viewBox="0 0 460 210" className="w-full h-44 sm:h-48 overflow-visible">
      <line x1="30" y1="165" x2="430" y2="165" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1" />
      {activeBars.map((b, idx) => {
        const x = 60 + idx * 105
        const h = Math.min(130, Math.max(25, (b.val / 100) * 140))
        const y = 165 - h
        return (
          <g key={b.name}>
            <line
              x1={x}
              y1="165"
              x2={x}
              y2={y}
              stroke={b.isWarm ? sColor : pColor}
              strokeWidth="2.5"
            />
            <circle cx={x} cy={y} r="9" fill={b.isWarm ? sColor : pColor} />
            <circle cx={x} cy={y} r="4" fill="currentColor" className="text-white dark:text-zinc-900" />
            <text
              x={x}
              y={y - 12}
              textAnchor="middle"
              fontSize="10"
              fill={b.isWarm ? tColor : pColor}
              fontWeight="bold"
            >
              {b.displayVal}
            </text>
            <text
              x={x}
              y="185"
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              className="text-slate-500 dark:text-zinc-400"
              fontWeight="600"
            >
              {b.name.length > 12 ? b.name.slice(0, 11) + "…" : b.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// 4.3.3 Scatter and Bubble Chart Graphic
function ScatterGraphic({
  isBubble,
  palette,
}: {
  isBubble?: boolean
  palette?: ChartPalette
}) {
  const pColor = palette?.primary || "#4a7ff7"
  const sColor = palette?.secondary || "#e99842"
  const tColor = palette?.textHighlight || "#b86b1c"

  const points = [
    { x: 65, y: 145, r: 7, label: "P1" },
    { x: 110, y: 130, r: 10, label: "P2" },
    { x: 155, y: 110, r: 8, label: "P3" },
    { x: 200, y: 95, r: 13, label: "P4" },
    { x: 250, y: 80, r: 9, label: "P5" },
    { x: 300, y: 65, r: 15, isWarm: true, label: "Key Peak" },
    { x: 350, y: 48, r: 11, label: "P7" },
    { x: 395, y: 35, r: 8, label: "P8" },
  ]

  return (
    <svg viewBox="0 0 460 210" className="w-full h-44 sm:h-48 overflow-visible">
      {/* Background grid */}
      <line x1="40" y1="170" x2="420" y2="170" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1" />
      <line x1="40" y1="20" x2="40" y2="170" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1" />

      {/* Regression / Trend direction line */}
      <line
        x1="55"
        y1="155"
        x2="410"
        y2="30"
        stroke={sColor}
        strokeWidth="2.5"
        strokeDasharray="5 5"
      />

      {/* Scatter points and bubbles */}
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={isBubble ? p.r : 5.5}
            fill={p.isWarm ? sColor : pColor}
            fillOpacity={isBubble ? 0.75 : 0.9}
            stroke="currentColor"
            className="text-white dark:text-zinc-900"
            strokeWidth={1.5}
          />
          {p.isWarm && (
            <text
              x={p.x}
              y={p.y - (isBubble ? p.r + 5 : 10)}
              textAnchor="middle"
              fontSize="9"
              fill={tColor}
              fontWeight="bold"
            >
              Peak Correlation (r = 0.89)
            </text>
          )}
        </g>
      ))}

      <text x="230" y="195" textAnchor="middle" fontSize="10" fill="currentColor" className="text-slate-400 dark:text-zinc-500" fontWeight="600">
        Primary Independent Metric (X Axis)
      </text>
    </svg>
  )
}

// 4.4 Box Plot, Histogram, and Density Curve Graphic
function BoxPlotGraphic({
  isBox,
  isDensity,
  data,
  histogramBars,
  palette,
}: {
  isBox: boolean
  isDensity?: boolean
  data?: BoxPlotData
  histogramBars?: number[]
  palette?: ChartPalette
}) {
  const pColor = palette?.primary || "#4a7ff7"
  const sColor = palette?.secondary || "#e99842"
  const tColor = palette?.textHighlight || "#b86b1c"

  const defaultData: BoxPlotData = {
    min: 45,
    q1: 112,
    median: 138,
    q3: 176,
    max: 270,
    outlierValue: 395,
    outlierLabel: "Outlier Value",
    unit: "$",
  }

  const activeData = data || defaultData

  if (isDensity) {
    const curveD = "M 40 155 C 110 155, 150 40, 230 40 C 310 40, 350 155, 420 155"
    const fillD = `${curveD} L 420 160 L 40 160 Z`
    return (
      <svg viewBox="0 0 460 195" className="w-full h-44 sm:h-48 overflow-visible">
        <defs>
          <linearGradient id="densityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={pColor} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <line x1="30" y1="160" x2="430" y2="160" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1" />
        <path d={fillD} fill="url(#densityGrad)" />
        <path d={curveD} fill="none" stroke={pColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="230" y1="40" x2="230" y2="160" stroke={sColor} strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="230" cy="40" r="4.5" fill={sColor} stroke="currentColor" className="text-white dark:text-zinc-900" strokeWidth="1.5" />
        <text x="230" y="28" textAnchor="middle" fontSize="10" fill={tColor} fontWeight="bold">Mode / Density Peak</text>
        <text x="230" y="180" textAnchor="middle" fontSize="10" fill="currentColor" className="text-slate-500 dark:text-zinc-400" fontWeight="600">Continuous Probability Density Curve</text>
      </svg>
    )
  }

  if (isBox) {
    return (
      <svg viewBox="0 0 440 170" className="w-full h-44 sm:h-48">
        <line x1="50" y1="80" x2="360" y2="80" stroke="currentColor" className="text-slate-300 dark:text-zinc-600" strokeWidth="1.5" strokeDasharray="4 4" />
        <line x1="50" y1="62" x2="50" y2="98" stroke="currentColor" className="text-slate-400 dark:text-zinc-500" strokeWidth="2.5" />
        <line x1="360" y1="62" x2="360" y2="98" stroke="currentColor" className="text-slate-400 dark:text-zinc-500" strokeWidth="2.5" />

        <rect
          x="130"
          y="52"
          width="150"
          height="56"
          rx="6"
          fill={pColor}
          fillOpacity="0.08"
          stroke={pColor}
          strokeWidth="2"
        />

        {/* Median indicator */}
        <line x1="195" y1="52" x2="195" y2="108" stroke={sColor} strokeWidth="3.5" />

        {/* Outlier point */}
        <circle cx="395" cy="80" r="5" fill={sColor} stroke="currentColor" className="text-white dark:text-zinc-900" strokeWidth="1.5" />
        <text x="395" y="65" textAnchor="middle" fontSize="9" fill={tColor} fontWeight="bold">
          {activeData.outlierLabel}
        </text>

        <text x="50" y="125" textAnchor="middle" fontSize="10" fill="currentColor" className="text-slate-500 dark:text-zinc-400" fontWeight="600">
          Min ({activeData.unit}{activeData.min})
        </text>
        <text x="130" y="125" textAnchor="middle" fontSize="10" fill="currentColor" className="text-slate-500 dark:text-zinc-400" fontWeight="600">
          Q1 ({activeData.unit}{activeData.q1})
        </text>
        <text x="195" y="125" textAnchor="middle" fontSize="10" fill={tColor} fontWeight="bold">
          Median ({activeData.unit}{activeData.median})
        </text>
        <text x="280" y="125" textAnchor="middle" fontSize="10" fill="currentColor" className="text-slate-500 dark:text-zinc-400" fontWeight="600">
          Q3 ({activeData.unit}{activeData.q3})
        </text>
        <text x="360" y="125" textAnchor="middle" fontSize="10" fill="currentColor" className="text-slate-500 dark:text-zinc-400" fontWeight="600">
          Upper Fence ({activeData.unit}{activeData.max})
        </text>
      </svg>
    )
  }

  const bars = histogramBars || [14, 28, 68, 92, 80, 44, 20, 8]

  return (
    <svg viewBox="0 0 420 180" className="w-full h-44 sm:h-48">
      <line x1="30" y1="150" x2="390" y2="150" stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1" />
      {bars.map((v, i) => {
        const x = 45 + i * 42
        const h = v * 1.25
        const y = 150 - h
        const isCenter = i === 3
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="34"
            height={h}
            rx="4"
            fill={isCenter ? sColor : pColor}
            fillOpacity={isCenter ? 1 : 0.75}
          />
        )
      })}
    </svg>
  )
}

// 4.0 Standalone Compact Chart Canvas
function ChartCanvas({
  analysisTypeId,
  activeChartId,
  storyConfig,
  palette,
}: {
  analysisTypeId: string
  activeChartId: string
  storyConfig: ReturnType<typeof getDashboardStory>
  palette?: ChartPalette
}) {
  return (
    <div className="flex items-center justify-center h-44 sm:h-48 w-full overflow-hidden">
      {analysisTypeId === "trend" && (
        <LineAreaGraphic
          isArea={activeChartId === "area"}
          isStep={activeChartId === "stepline"}
          points={storyConfig.trendData}
          palette={palette}
        />
      )}

      {analysisTypeId === "comparison" && (
        activeChartId === "lollipop" ? (
          <LollipopGraphic bars={storyConfig.barData} palette={palette} />
        ) : (
          <BarGraphic
            isHorizontal={activeChartId === "horizontal_bar"}
            bars={storyConfig.barData}
            palette={palette}
          />
        )
      )}

      {analysisTypeId === "desc_freq" && (
        activeChartId === "pie" ? (
          <PieGraphic segments={storyConfig.donutData} palette={palette} />
        ) : activeChartId === "bar" ? (
          <BarGraphic isHorizontal={false} bars={storyConfig.barData} palette={palette} />
        ) : (
          <DonutGraphic segments={storyConfig.donutData} palette={palette} />
        )
      )}

      {analysisTypeId === "desc_numeric" && (
        <BoxPlotGraphic
          isBox={activeChartId === "box"}
          isDensity={activeChartId === "density"}
          data={storyConfig.boxPlotData}
          histogramBars={storyConfig.histogramBars}
          palette={palette}
        />
      )}

      {analysisTypeId === "correlation" && (
        <ScatterGraphic isBubble={activeChartId === "bubble"} palette={palette} />
      )}
    </div>
  )
}

// 4.5 Main Chart Canvas Container
function ChartContainer({
  analysisTypeId,
  activeChartId,
  activeTitle,
  storyConfig,
  palette,
}: {
  analysisTypeId: string
  activeChartId: string
  activeTitle: string
  storyConfig: ReturnType<typeof getDashboardStory>
  palette?: ChartPalette
}) {
  const pColor = palette?.primary || "#4a7ff7"
  const sColor = palette?.secondary || "#e99842"

  return (
    <div className="h-full rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-[#22252c] p-4.5 shadow-2xs flex flex-col justify-between">
      <div className="mb-3 flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-zinc-700/60 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: sColor }} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
            Active: <span style={{ color: pColor }}>{activeTitle}</span>
          </h3>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: pColor }} /> Primary
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: sColor }} /> Peak
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <ChartCanvas
          analysisTypeId={analysisTypeId}
          activeChartId={activeChartId}
          storyConfig={storyConfig}
          palette={palette}
        />
      </div>
    </div>
  )
}

// Helper to format narrative text with balanced Orange & Blue inline highlight badges
function FormattedNarrativeText({ text }: { text: string }) {
  if (!text) return null

  // Regex to match percentages, drops, currency, months, and key plan tiers
  const tokenRegex =
    /(\b\d+(?:\.\d+)?%|\(-?\d+(?:\.\d+)?%\)|\$\d[\d,]*(?:\.\d+)?|\bMonth \d+\b|\b(?:Enterprise|Pro Tier|Starter Plan|Starter|Free Trial)\b)/g

  const parts = text.split(tokenRegex)

  return (
    <span>
      {parts.map((part, i) => {
        if (!part) return null
        if (tokenRegex.test(part)) {
          tokenRegex.lastIndex = 0
          const isBlue =
            part.includes("91%") ||
            part.toLowerCase().includes("enterprise") ||
            part.includes("64%")
          return (
            <span
              key={i}
              className={`font-semibold px-1.5 py-0.5 rounded text-[11px] align-baseline inline-flex items-center mx-0.5 ${
                isBlue
                  ? "text-[#1d4ed8] dark:text-[#60a5fa] bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/40"
                  : "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-900/40"
              }`}
            >
              {part}
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

// 5. Plain-Language Story & What The Data Means
interface StoryStage {
  id: string
  stepNumber: string
  stageLabel: string
  title: string
  highlightMetric: string
  highlightSub: string
  iconType: "activity" | "layers" | "pie" | "lightbulb"
  accentColor: "amber" | "blue" | "rose" | "emerald"
  takeaway: string
}

interface PipelineStoryData {
  title: string
  subtitle: string
  stages: StoryStage[]
  bottomLine: string
  actionRecommendation: string
}

function getPipelineStoryData(
  datasetName?: string,
  multiGoalStories?: Array<{ goal: QuickGoalExample; story: ReturnType<typeof getDashboardStory> }>,
  synergyMessage?: string,
  takeawayMessage?: string
): PipelineStoryData {
  const isRetention = datasetName?.toLowerCase().includes("retention") || false
  const isSales = datasetName?.toLowerCase().includes("sales") || datasetName?.toLowerCase().includes("e-commerce") || false
  const isMarketing = datasetName?.toLowerCase().includes("marketing") || datasetName?.toLowerCase().includes("campaign") || false

  // 1. CUSTOMER RETENTION
  if (isRetention) {
    return {
      title: "What the Numbers Mean for Your Business",
      subtitle: "A simple, 4-step explanation in plain English with zero data jargon.",
      stages: [
        {
          id: "curve",
          stepNumber: "01",
          stageLabel: "TIMING",
          title: "When Do Customers Leave?",
          highlightMetric: "-24% Drop",
          highlightSub: "Around Month 3",
          iconType: "activity",
          accentColor: "amber",
          takeaway: "About 24% of new subscribers cancel around Month 3. The ones who make it past Month 5 usually stay loyal for a long time.",
        },
        {
          id: "plans",
          stepNumber: "02",
          stageLabel: "PLANS",
          title: "Which Plans Keep Users Best?",
          highlightMetric: "91% Stay",
          highlightSub: "Enterprise vs Starter",
          iconType: "layers",
          accentColor: "blue",
          takeaway: "Enterprise customers almost never leave (91% stay). Nearly all cancellations come from smaller Starter accounts.",
        },
        {
          id: "reasons",
          stepNumber: "03",
          stageLabel: "REASONS",
          title: "Why Are They Canceling?",
          highlightMetric: "44% Say Price",
          highlightSub: "+ 28% Need Integrations",
          iconType: "pie",
          accentColor: "rose",
          takeaway: "Price is the #1 complaint (44%). Customers aren't unhappy with the product—they just want lower prices or connections to other apps.",
        },
        {
          id: "loyalty",
          stepNumber: "04",
          stageLabel: "LOYALTY",
          title: "Who Stays for the Long Run?",
          highlightMetric: "64% Stay",
          highlightSub: "Past Month 5",
          iconType: "lightbulb",
          accentColor: "emerald",
          takeaway: "Once subscribers pass the initial 5 months, cancellations stop almost completely, leaving you with a dependable 64% loyal core audience.",
        },
      ],
      bottomLine:
        "Small Starter customers are canceling around Month 3 because they feel the price is too high and they haven't connected their tools yet.",
      actionRecommendation:
        "Add a 'Pause Account' button and offer a lighter, cheaper plan to stop losing customers before Month 3.",
    }
  }

  // 2. GLOBAL E-COMMERCE SALES
  if (isSales) {
    return {
      title: "What the Sales Numbers Mean",
      subtitle: "A simple summary of sales trends, best-selling products, and top regions.",
      stages: [
        {
          id: "timeline",
          stepNumber: "01",
          stageLabel: "TIMING",
          title: "When Did Sales Peak?",
          highlightMetric: "$198,400",
          highlightSub: "Best Month (August)",
          iconType: "activity",
          accentColor: "amber",
          takeaway: "Sales grew steadily throughout the summer and peaked in August at $198,400, helped by back-to-school shoppers.",
        },
        {
          id: "category",
          stepNumber: "02",
          stageLabel: "PRODUCTS",
          title: "What Made the Most Profit?",
          highlightMetric: "62% Profit",
          highlightSub: "Tech & Electronics",
          iconType: "layers",
          accentColor: "blue",
          takeaway: "Technology and hardware products brought in 62% of your total profit, out-earning all other product categories combined.",
        },
        {
          id: "geography",
          stepNumber: "03",
          stageLabel: "REGIONS",
          title: "Where Are Buyers Coming From?",
          highlightMetric: "+38% Growth",
          highlightSub: "Fastest in Asia-Pacific",
          iconType: "pie",
          accentColor: "rose",
          takeaway: "The US and Europe bought the most items overall, but sales in the Asia-Pacific region grew the fastest (+38% this year).",
        },
        {
          id: "spend",
          stepNumber: "04",
          stageLabel: "ORDER SIZE",
          title: "How Much Does Each Shopper Spend?",
          highlightMetric: "$142 Avg",
          highlightSub: "Per Order (+18%)",
          iconType: "lightbulb",
          accentColor: "emerald",
          takeaway: "Shoppers spent an average of $142 per order during the peak season, with electronics buyers purchasing 2.4 items per cart.",
        },
      ],
      bottomLine:
        "August was your biggest month because back-to-school shoppers bought high-profit tech products.",
      actionRecommendation:
        "Make sure your most profitable tech items stay well-stocked ahead of peak holiday shopping.",
    }
  }

  // 3. MARKETING CAMPAIGN ROI
  if (isMarketing) {
    return {
      title: "What Your Ad Results Mean",
      subtitle: "A simple breakdown of customer growth, best ad platforms, and costs.",
      stages: [
        {
          id: "volume",
          stepNumber: "01",
          stageLabel: "NEW CUSTOMERS",
          title: "How Many Customers Joined?",
          highlightMetric: "5,040 Deals",
          highlightSub: "August Peak (1,040 Deals)",
          iconType: "activity",
          accentColor: "amber",
          takeaway: "You brought in 5,040 new customers this year. Sales grew every month and reached a high of 1,040 deals in August.",
        },
        {
          id: "channel",
          stepNumber: "02",
          stageLabel: "CHANNELS",
          title: "Which Ad Platform Won?",
          highlightMetric: "4.6x Return",
          highlightSub: "Google Search Ads",
          iconType: "layers",
          accentColor: "blue",
          takeaway: "Google Search ads gave you the best return by far—making 4.6 times what you spent, beating social media and banner ads.",
        },
        {
          id: "cac",
          stepNumber: "03",
          stageLabel: "COST",
          title: "Did Customer Cost Go Down?",
          highlightMetric: "$36 per User",
          highlightSub: "Down from $54",
          iconType: "pie",
          accentColor: "rose",
          takeaway: "Yes! The cost to win each new customer dropped from $54 down to $36 as your ads reached better, more targeted audiences.",
        },
        {
          id: "speed",
          stepNumber: "04",
          stageLabel: "BUYING SPEED",
          title: "How Fast Do Leads Buy?",
          highlightMetric: "14 Days",
          highlightSub: "From Click to Deal",
          iconType: "lightbulb",
          accentColor: "emerald",
          takeaway: "Google Search leads converted into paying customers in under 14 days, more than twice as fast as social media or display ad clicks.",
        },
      ],
      bottomLine:
        "Google Search is your strongest ad channel—it brings in the most customers at the lowest cost per person.",
      actionRecommendation:
        "Put more of your ad budget into Google Search to keep getting new customers for under $40 each.",
    }
  }

  // 4. GENERIC / USER-UPLOADED DATASET
  const stages: StoryStage[] = []
  if (multiGoalStories && multiGoalStories.length >= 2) {
    multiGoalStories.slice(0, 3).forEach((item, idx) => {
      const colors: Array<"amber" | "blue" | "rose"> = ["amber", "blue", "rose"]
      const icons: Array<"activity" | "layers" | "pie"> = ["activity", "layers", "pie"]
      stages.push({
        id: `goal-${idx}`,
        stepNumber: String(idx + 1).padStart(2, "0"),
        stageLabel: `STEP ${idx + 1}`,
        title: item.goal.label.trim(),
        highlightMetric: item.story.metrics[0]?.value || `Result #${idx + 1}`,
        highlightSub: item.goal.columns.slice(0, 2).join(" & "),
        iconType: icons[idx % icons.length],
        accentColor: colors[idx % colors.length],
        takeaway: item.story.insights[0] || "Key patterns observed across your selected columns.",
      })
    })
  }

  // Add final summary stage
  stages.push({
    id: "summary-generic",
    stepNumber: String(stages.length + 1).padStart(2, "0"),
    stageLabel: "OVERALL PATTERN",
    title: "How Reliable Are the Numbers?",
    highlightMetric: "Strong Signal",
    highlightSub: "Consistent Trend",
    iconType: "lightbulb",
    accentColor: "emerald",
    takeaway: "The numbers show strong, consistent patterns across your key dimensions with healthy baseline stability.",
  })

  return {
    title: "What the Data Means in Simple Words",
    subtitle: "A clear step-by-step breakdown of your results.",
    stages,
    bottomLine: synergyMessage || "Your data shows clear, consistent patterns across your key numbers.",
    actionRecommendation:
      takeawayMessage ||
      "Focus your attention on the top-performing areas highlighted in your charts.",
  }
}

function getStageColorStyles(color: "amber" | "blue" | "rose" | "emerald", stepIndex: number = 0) {
  // Clean alternating Orange & Blue palette (Zero muddy color-mixing inside circles)
  const isOrange = stepIndex % 2 === 0

  if (isOrange) {
    return {
      badgeBg: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm shadow-orange-500/25",
      pill: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/60",
      metricBadge: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/60",
    }
  }

  return {
    badgeBg: "bg-gradient-to-br from-[#4a7ff7] to-blue-600 shadow-sm shadow-blue-500/25",
    pill: "text-[#1d4ed8] dark:text-[#60a5fa] bg-blue-50 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-800/60",
    metricBadge: "text-[#1d4ed8] dark:text-[#60a5fa] bg-blue-50 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-800/60",
  }
}

// 5. Narrative, Plain-Language Explanation, and Actionable Insights
function InsightsBox({
  datasetName,
  takeawayMessage,
  multiGoalStories,
  synergyMessage,
}: {
  datasetName?: string
  chartExplanation?: string
  takeawayMessage?: string
  insights: string[]
  confirmedColumns?: string[]
  multiGoalStories?: Array<{ goal: QuickGoalExample; story: ReturnType<typeof getDashboardStory> }>
  synergyMessage?: string
}) {
  const story = getPipelineStoryData(datasetName, multiGoalStories, synergyMessage, takeawayMessage)

  return (
    <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-zinc-800">
      {/* 1. Header (Open & Editorial - No Card) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-orange-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-100">
              {story.title}
            </h3>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
              Plain English
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {story.subtitle}
          </p>
        </div>
      </div>

      {/* 2. Vertical Narrative Flow (Clean Flex Layout with Zero Text Overlap & Coordinated Colors) */}
      <div className="space-y-4 pt-1">
        {story.stages.map((stage, idx) => {
          const colors = getStageColorStyles(stage.accentColor, idx)
          const isLast = idx === story.stages.length - 1

          return (
            <div key={stage.id} className="flex items-start gap-3.5 group">
              {/* Left Column: Number Badge & Vertical Connector (Always perfectly separated) */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`size-7 rounded-full flex items-center justify-center font-bold text-xs text-white ring-4 ring-white dark:ring-[#22252c] ${colors.badgeBg}`}
                >
                  {stage.stepNumber.replace(/^0/, "")}
                </div>
                {!isLast && (
                  <div className="w-0.5 flex-1 min-h-[34px] bg-slate-200 dark:bg-zinc-800 my-1" />
                )}
              </div>

              {/* Right Column: Title, Category Pill, Metric Badge, and Story Sentence */}
              <div className="flex-1 min-w-0 pt-0.5 pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${colors.pill}`}
                    >
                      {stage.stageLabel}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      {stage.title}
                    </h4>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${colors.metricBadge}`}
                  >
                    {stage.highlightMetric}
                  </span>
                </div>

                {/* Plain English Story Sentence */}
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
                  <FormattedNarrativeText text={stage.takeaway} />
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. Bottom Summary & Recommendation (Open Banner) */}
      <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <Sparkles className="size-4 text-[#4a7ff7] shrink-0 mt-0.5" />
          <p className="text-slate-700 dark:text-zinc-300 text-xs leading-relaxed">
            <strong className="text-slate-900 dark:text-zinc-100 font-semibold">In Simple Words:</strong>{" "}
            <FormattedNarrativeText text={story.bottomLine} />
          </p>
        </div>

        <div className="flex items-start gap-2.5 shrink-0 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 px-3.5 py-2 rounded-xl max-w-md">
          <Lightbulb className="size-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-950 dark:text-amber-200 font-medium leading-relaxed">
            <strong className="font-bold text-amber-600 dark:text-amber-400">Recommended Next Step:</strong> {story.actionRecommendation}
          </p>
        </div>
      </div>
    </div>
  )
}

// 6. Main Dashboard Container (StoryDashboard)
export function StoryDashboard({
  datasetMeta,
  analysisTypeId = "trend",
  selectedChartId,
  confirmedColumns = [],
  onBack,
  onNewProject,
}: {
  datasetMeta?: DatasetMeta | null
  analysisTypeId?: string
  selectedChartId?: string
  confirmedColumns?: string[]
  onBack: () => void
  onNewProject?: () => void
}) {
  const compatibleList =
    COMPATIBLE_CHARTS_BY_ANALYSIS[analysisTypeId] ||
    COMPATIBLE_CHARTS_BY_ANALYSIS.trend

  const initialChartId =
    selectedChartId && compatibleList.some((c) => c.id === selectedChartId)
      ? selectedChartId
      : compatibleList[0]?.id || "line"

  const [activeChartId, setActiveChartId] = useState<string>(initialChartId)
  const [paletteKey, setPaletteKey] = useState<ChartPaletteKey>("warm")

  useEffect(() => {
    setPaletteKey(getStoredPalette())
    const handlePaletteChange = () => {
      setPaletteKey(getStoredPalette())
    }
    window.addEventListener("datanarrator_palette_changed", handlePaletteChange)
    window.addEventListener("storage", handlePaletteChange)
    return () => {
      window.removeEventListener("datanarrator_palette_changed", handlePaletteChange)
      window.removeEventListener("storage", handlePaletteChange)
    }
  }, [])

  useEffect(() => {
    if (selectedChartId && compatibleList.some((c) => c.id === selectedChartId)) {
      setActiveChartId(selectedChartId)
    } else {
      setActiveChartId(compatibleList[0]?.id || "line")
    }
  }, [selectedChartId, analysisTypeId])

  const quickGoals = getDemoQuickGoals(datasetMeta?.name)
  // Detect active goals matching confirmed columns
  const activeGoals = quickGoals.filter(
    (g) => g.columns.length > 0 && g.columns.every((c) => confirmedColumns.includes(c))
  )
  const isMultiGoal = activeGoals.length >= 2

  // Stories for both goals
  const goalStories = activeGoals.map((g) => {
    const aType = mapGoalToAnalysisType(g.label)
    return {
      goal: g,
      analysisType: aType,
      story: getDashboardStory(datasetMeta || null, aType, g.columns),
    }
  })

  // Per-goal chart selections for multi-goal mode (one radio selection per goal)
  const [goalChartSelections, setGoalChartSelections] = useState<Record<number, string>>({
    0: "line",
    1: "vertical_bar",
  })

  useEffect(() => {
    if (goalStories.length >= 2) {
      setGoalChartSelections({
        0: goalStories[0].analysisType === "trend" ? "line" : goalStories[0].analysisType === "comparison" ? "vertical_bar" : "donut",
        1: goalStories[1].analysisType === "trend" ? "line" : goalStories[1].analysisType === "comparison" ? "vertical_bar" : "donut",
      })
    }
  }, [goalStories.length])

  const handleSelectGoalChart = (goalIdx: number, chartId: string) => {
    setGoalChartSelections((prev) => ({ ...prev, [goalIdx]: chartId }))
  }

  const synergyMessage = isMultiGoal && activeGoals.length >= 2
    ? getSynergySummary(datasetMeta?.name, activeGoals[0], activeGoals[1])
    : undefined

  const storyConfig = getDashboardStory(datasetMeta || null, analysisTypeId, confirmedColumns)
  const currentOption = compatibleList.find((c) => c.id === activeChartId) || compatibleList[0]
  const activePalette = CHART_PALETTES[paletteKey] || CHART_PALETTES.warm

  // Combine top metrics if multi-goal
  const displayMetrics = isMultiGoal && goalStories.length >= 2
    ? [
        goalStories[0].story.metrics[0],
        goalStories[0].story.metrics[1],
        goalStories[1].story.metrics[0],
        goalStories[1].story.metrics[1],
      ].filter(Boolean)
    : storyConfig.metrics

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/85 dark:bg-[#22252c]/90 backdrop-blur-md p-6 sm:p-8 lg:p-9 shadow-sm relative">
      <TopNavigation
        datasetName={datasetMeta?.name}
        rowCount={datasetMeta?.rowCount}
        onBack={onBack}
        onNewProject={onNewProject}
      />

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
          {isMultiGoal ? "Dual-Objective Visual Storyboard" : "Automated Visual Storyboard"}
        </h2>
      </div>

      <StatsCardsRow metrics={displayMetrics} palette={activePalette} />

      {/* When in Multi-Goal Mode: Render ALL Charts SIDE-BY-SIDE in 1 Compact Row */}
      {isMultiGoal && goalStories.length >= 2 ? (
        <div className={`grid gap-4 my-5 items-stretch ${
          goalStories.length === 2
            ? "grid-cols-1 md:grid-cols-2"
            : goalStories.length === 3
            ? "grid-cols-1 md:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        }`}>
          {goalStories.map((item, idx) => {
            const goalCompatible = COMPATIBLE_CHARTS_BY_ANALYSIS[item.analysisType] || COMPATIBLE_CHARTS_BY_ANALYSIS.trend
            const activeChart = goalChartSelections[idx] || (goalCompatible[0]?.id || "line")
            const activeOpt = goalCompatible.find((c) => c.id === activeChart) || goalCompatible[0]

            return (
              <div key={idx} className="rounded-2xl border border-slate-200/90 dark:border-zinc-700 bg-white dark:bg-[#22252c] p-4 shadow-2xs flex flex-col justify-between">
                <div>
                  {/* Compact Header: Goal Name & Active Radio Option Pills */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-zinc-700/60 pb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex size-5 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#4a7ff7] font-bold text-[11px] shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
                          {item.goal.label}
                        </h3>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                          {item.goal.hint}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sleek Inline Radio Buttons */}
                  <div className="py-2.5 flex flex-wrap items-center gap-1.5 border-b border-slate-100 dark:border-zinc-700/60" role="radiogroup">
                    {goalCompatible.map((opt) => {
                      const isSelected = activeChart === opt.id
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => handleSelectGoalChart(idx, opt.id)}
                          style={isSelected ? { backgroundColor: activePalette.primary } : undefined}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "text-white shadow-xs font-bold scale-[1.02]"
                              : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200/60 dark:border-zinc-700"
                          }`}
                          title={`Switch to ${opt.title}`}
                        >
                          {/* Radio Button Circular Indicator */}
                          <div
                            className={`size-3 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? "border-white bg-white/20"
                                : "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                            }`}
                          >
                            {isSelected && (
                              <div className="size-1 rounded-full bg-white shadow-xs" />
                            )}
                          </div>

                          <Icon className={`size-3 ${isSelected ? "text-white" : "text-slate-400"}`} />
                          <span className="truncate">{opt.title.replace(" Chart", "")}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Chart Graphic Area */}
                <div className="pt-2 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-end gap-2.5 text-[9px] font-medium text-slate-400 dark:text-zinc-500 mb-1">
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: activePalette.primary }} /> Primary
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: activePalette.secondary }} /> Highlight
                    </span>
                  </div>

                  <ChartCanvas
                    analysisTypeId={item.analysisType}
                    activeChartId={activeChart}
                    storyConfig={item.story}
                    palette={activePalette}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <>
          <VisualizationSwitcher
            compatibleOptions={compatibleList}
            activeChartId={activeChartId}
            onSelectChart={(newId) => setActiveChartId(newId)}
            palette={activePalette}
          />

          <ChartContainer
            analysisTypeId={analysisTypeId}
            activeChartId={activeChartId}
            activeTitle={currentOption?.title || "Active Chart"}
            storyConfig={storyConfig}
            palette={activePalette}
          />
        </>
      )}

      <InsightsBox
        datasetName={datasetMeta?.name}
        chartExplanation={storyConfig.chartExplanation}
        takeawayMessage={storyConfig.takeawayMessage}
        insights={storyConfig.insights}
        confirmedColumns={confirmedColumns}
        multiGoalStories={isMultiGoal ? goalStories : undefined}
        synergyMessage={synergyMessage}
      />
    </div>
  )
}

export default StoryDashboard