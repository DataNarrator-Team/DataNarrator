"use client"

import React, { useState, useEffect } from "react"
import {
  BarChart3,
  TrendingUp,
  PieChart,
  GitFork,
  Activity,
  Columns3,
  Sliders,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Bot,
  Database,
  Layers,
} from "lucide-react"
import { DatasetMeta } from "@/lib/dataset-models"

export interface AllowedChartOption {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  isAiPick: boolean
  aiReason: string
  bestFor: string
}

// ==============================================================================
// 🟢 START DEMO / SIMULATION CODE [Will be replaced with backend API integration]
// Matrix of allowed chart options and dynamic rule-based chart recommendation heuristics.
// In production: Backend AI recommendation endpoint will evaluate data distribution and volume
// and return `recommendedChartId` alongside analytical justification `aiReason`.
// ==============================================================================

// Allowed visualization options categorized by analytical approach
const ALLOWED_CHARTS_BY_ANALYSIS: Record<string, AllowedChartOption[]> = {
  trend: [
    {
      id: "line",
      title: "Line Chart",
      description: "Plots continuous trajectory with marked data points across time intervals.",
      icon: TrendingUp,
      isAiPick: true,
      aiReason: "Recommended: Provides the clearest view of rate of change, peaks, and period-over-period direction.",
      bestFor: "Tracking timeline progression & identifying seasonal peaks",
    },
    {
      id: "area",
      title: "Area Chart",
      description: "Fills the space beneath the trendline to highlight cumulative volume.",
      icon: Activity,
      isAiPick: false,
      aiReason: "Alternative: Excellent when volume magnitude is as important as the trajectory.",
      bestFor: "Cumulative volume over time alongside growth trend",
    },
    {
      id: "stepline",
      title: "Step Line Chart",
      description: "Connects data points with horizontal and vertical steps to highlight discrete plateaus.",
      icon: TrendingUp,
      isAiPick: false,
      aiReason: "Alternative: Ideal for milestone transitions and cohort step evaluations.",
      bestFor: "Showing sudden shifts between distinct milestone periods",
    },
  ],
  comparison: [
    {
      id: "vertical_bar",
      title: "Vertical Bar Chart",
      description: "Displays vertical columns to contrast discrete category values.",
      icon: BarChart3,
      isAiPick: true,
      aiReason: "Recommended: Standard analytical convention for ranking discrete categories clearly.",
      bestFor: "Comparing standard categories with concise label names",
    },
    {
      id: "horizontal_bar",
      title: "Horizontal Bar Chart",
      description: "Extends horizontal bars to facilitate scanning and reading longer labels.",
      icon: Columns3,
      isAiPick: false,
      aiReason: "Alternative: Preferred when category names are long or exceeds 5 categories.",
      bestFor: "Datasets with lengthy category titles or numerous segments",
    },
    {
      id: "lollipop",
      title: "Lollipop Chart",
      description: "Minimalist slender stems with prominent endpoint markers.",
      icon: Sliders,
      isAiPick: false,
      aiReason: "Alternative: Reduces visual ink while maintaining high precision on key values.",
      bestFor: "Clean modern comparison highlighting individual benchmarks",
    },
  ],
  desc_freq: [
    {
      id: "donut",
      title: "Donut Chart",
      description: "Circular proportion ring visualizing relative share of the total 100%.",
      icon: PieChart,
      isAiPick: true,
      aiReason: "Recommended: Optimal for 3–5 categories to immediately communicate relative market share.",
      bestFor: "Showing distribution and percentage breakdown of 100%",
    },
    {
      id: "pie",
      title: "Pie Chart",
      description: "Classic circular pie showing percentage share of 100% with colored wedge slices.",
      icon: PieChart,
      isAiPick: false,
      aiReason: "Classic: Familiar circular slice breakdown showing proportion of the total 100%.",
      bestFor: "Visualizing shares of a whole (100%) with intuitive slice divisions",
    },
    {
      id: "bar",
      title: "Frequency Bar Chart",
      description: "Straightforward bar heights representing exact occurrence counts.",
      icon: BarChart3,
      isAiPick: false,
      aiReason: "Alternative: Better when exact absolute counts are more important than percentages.",
      bestFor: "Comparing absolute frequencies across categorical items",
    },
    {
      id: "segment",
      title: "Stacked Proportional Bar",
      description: "Single linear stacked bar showing relative component segments.",
      icon: Columns3,
      isAiPick: false,
      aiReason: "Alternative: Space-efficient horizontal strip representation.",
      bestFor: "Compact linear proportional breakdown",
    },
  ],
  desc_numeric: [
    {
      id: "histogram",
      title: "Frequency Histogram",
      description: "Aggregates continuous numeric values into equal-interval bins.",
      icon: BarChart3,
      isAiPick: true,
      aiReason: "Recommended: Essential for examining distribution shape, skewness, and central clustering.",
      bestFor: "Analyzing data spread, normal distribution, and cluster density",
    },
    {
      id: "box",
      title: "Box Plot",
      description: "Statistical five-number summary: Min, Q1, Median, Q3, Max, and Outliers.",
      icon: Sliders,
      isAiPick: false,
      aiReason: "Alternative: Ideal for statistical rigor, IQR bands, and quartile comparison.",
      bestFor: "Inspecting median centers and statistical spread cleanly",
    },
    {
      id: "density",
      title: "Density Area Curve",
      description: "Continuous smoothed estimate of the probability density function.",
      icon: Activity,
      isAiPick: false,
      aiReason: "Alternative: Provides a smooth curve representation across continuous metrics.",
      bestFor: "Continuous probability modeling without discrete binning lines",
    },
  ],
  correlation: [
    {
      id: "scatter",
      title: "Scatter Plot (with Trendline)",
      description: "Plots two continuous variables as coordinates with an overlaid linear fit line.",
      icon: GitFork,
      isAiPick: true,
      aiReason: "Recommended: Best method to verify correlation coefficient, covariance, and trendline fit.",
      bestFor: "Evaluating linear dependency and point dispersion",
    },
    {
      id: "bubble",
      title: "Bubble Chart",
      description: "Encodes a third numeric variable into the diameter size of each scatter circle.",
      icon: PieChart,
      isAiPick: false,
      aiReason: "Alternative: Valuable when you wish to visualize three simultaneous dimensions.",
      bestFor: "Multi-dimensional numeric correlation with volume weights",
    },
  ],
}

// 1. Dynamic recommendation heuristic engine evaluating selected attributes and metrics
interface DynamicRecommendation {
  chartId: string
  reason: string
  contextBadge: string
}

export function resolveDynamicChartRecommendation(
  analysisTypeId: string,
  confirmedColumns: string[] = [],
  datasetMeta?: DatasetMeta | null
): DynamicRecommendation {
  const allCols = datasetMeta?.columns || []
  const selectedDefs = confirmedColumns.map((colName) =>
    allCols.find((c) => c.name === colName) || {
      name: colName,
      dataType: "numeric" as const,
      isAiPick: false,
      reason: "",
    }
  )

  const numCols = selectedDefs.filter((c) => c.dataType === "numeric")
  const catCols = selectedDefs.filter((c) => c.dataType === "category")
  const totalCount = selectedDefs.length

  const catColName = catCols[0]?.name || confirmedColumns[0] || "Category"
  const numColName = numCols[0]?.name || confirmedColumns[1] || "Metric"

  switch (analysisTypeId) {
    case "trend": {
      const isCumulative = confirmedColumns.some((c) =>
        /revenue|sales|volume|spend|cost|profit/i.test(c)
      )
      if (isCumulative && totalCount >= 2) {
        return {
          chartId: "area",
          reason: `AI Recommendation: Because "${numColName}" represents continuous volume accumulation over time, an Area Chart highlights cumulative volume alongside trajectory.`,
          contextBadge: `Dynamic Volume Fit for "${numColName}"`,
        }
      }
      return {
        chartId: "line",
        reason: `AI Recommendation: Chronological trajectory for "${numColName}" across intervals, providing clear rate of change and peak markers.`,
        contextBadge: `Temporal Trajectory Analysis`,
      }
    }

    case "comparison": {
      const isLongText = /category|product|reason|tier|channel|campaign/i.test(catColName)
      if (isLongText) {
        return {
          chartId: "horizontal_bar",
          reason: `AI Recommendation: "${catColName}" contains descriptive text labels; Horizontal Bar Chart allows comfortable horizontal scanning without label truncation.`,
          contextBadge: `Optimized for Descriptive Labels in "${catColName}"`,
        }
      }
      return {
        chartId: "vertical_bar",
        reason: `AI Recommendation: Direct column height comparison provides the clearest ranking across discrete items in "${catColName}".`,
        contextBadge: `Discrete Categorical Ranking`,
      }
    }

    case "desc_freq": {
      const isFewSlices = /channel|tier|status|type|device|region/i.test(catColName)
      if (isFewSlices) {
        return {
          chartId: "pie",
          reason: `AI Recommendation: "${catColName}" contains 3–4 concise segments. A Pie Chart delivers the most intuitive circular 100% share breakdown.`,
          contextBadge: `100% Share Breakdown (Few Segments)`,
        }
      }
      const isManySlices = /category|product|country|city|agent/i.test(catColName)
      if (isManySlices) {
        return {
          chartId: "bar",
          reason: `AI Recommendation: "${catColName}" contains 5+ categories. A Frequency Bar Chart prevents overcrowded wedge slices and maintains readability.`,
          contextBadge: `High-Cardinality Categorical Spread`,
        }
      }
      return {
        chartId: "donut",
        reason: `AI Recommendation: Clean donut ring for "${catColName}" to communicate proportional market share at a glance.`,
        contextBadge: `Proportional Frequency Ring`,
      }
    }

    case "desc_numeric": {
      if (catCols.length >= 1 && numCols.length >= 1) {
        return {
          chartId: "box",
          reason: `AI Recommendation: You paired "${catColName}" with "${numColName}". A Box Plot allows comparing median centers, quartile spreads (IQR), and anomaly thresholds across groups.`,
          contextBadge: `Multi-Group Statistical Quartile Spread`,
        }
      }
      return {
        chartId: "histogram",
        reason: `AI Recommendation: Aggregates continuous values in "${numColName}" into equal-width bins to reveal data skewness, normality, and modal clustering.`,
        contextBadge: `Continuous Density Distribution`,
      }
    }

    case "correlation": {
      if (totalCount >= 3 || numCols.length >= 3) {
        const thirdCol = selectedDefs[2]?.name || confirmedColumns[2] || "3rd Dimension"
        return {
          chartId: "bubble",
          reason: `AI Recommendation: You selected ${totalCount} columns. A Bubble Chart correlates "${confirmedColumns[0]}" vs "${confirmedColumns[1]}" and maps "${thirdCol}" into bubble diameter.`,
          contextBadge: `3-Dimensional Correlation (X, Y, Size)`,
        }
      }
      return {
        chartId: "scatter",
        reason: `AI Recommendation: Direct coordinate pairing to compute linear regression trendline and evaluate dependency between "${confirmedColumns[0] || 'Metric X'}" and "${confirmedColumns[1] || 'Metric Y'}".`,
        contextBadge: `Bivariate Linear Relationship`,
      }
    }

    default:
      return {
        chartId: "line",
        reason: `AI Recommendation: Optimal visual representation based on current data schema.`,
        contextBadge: `Contextual Recommendation`,
      }
  }
}
// ==============================================================================
// 🔴 END DEMO / SIMULATION CODE
// ==============================================================================

// 2. Step Header Component
function StepHeader({
  datasetName,
  analysisTitle,
  confirmedColumns,
  contextBadge,
}: {
  datasetName?: string
  analysisTitle?: string
  confirmedColumns?: string[]
  contextBadge?: string
}) {
  return (
    <div className="text-center mb-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-zinc-300 shadow-sm mb-3">
        <Bot className="size-3.5 text-[#e99842]" />
        <span>Step 4 of 5 • Visualization Selection</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100">Select Chart Type</h1>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
        {datasetName && (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 font-medium text-slate-700 dark:text-zinc-300">
            <Database className="size-3 text-[#4a7ff7]" />
            {datasetName}
          </span>
        )}
        {analysisTitle && (
          <span className="inline-flex items-center gap-1 rounded-md bg-[#4a7ff7]/10 px-2.5 py-0.5 font-medium text-[#4a7ff7]">
            <Layers className="size-3" />
            {analysisTitle}
          </span>
        )}
      </div>

      {confirmedColumns && confirmedColumns.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mr-1">Selected Attributes:</span>
          {confirmedColumns.map((col) => (
            <span
              key={col}
              className="inline-flex items-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700 dark:text-zinc-300"
            >
              {col}
            </span>
          ))}
        </div>
      )}

      {contextBadge && (
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#e99842]/10 border border-[#e99842]/30 px-3 py-0.5 text-[11px] font-bold text-[#b86b1c] dark:text-[#f3a85b]">
          <Sparkles className="size-3 text-[#e99842]" />
          <span>{contextBadge}</span>
        </div>
      )}

      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2.5">
        Choose your preferred chart from the allowed visualizations compatible with this analysis. AI recommendation dynamically evaluates your selected columns and data attributes.
      </p>
    </div>
  )
}

// 3. Allowed Chart Option Card
function ChartOptionCard({
  chart,
  isSelected,
  onSelect,
}: {
  chart: AllowedChartOption
  isSelected: boolean
  onSelect: () => void
}) {
  const Icon = chart.icon

  return (
    <div
      onClick={onSelect}
      className={`flex items-start justify-between rounded-2xl p-4.5 border transition-all cursor-pointer select-none ${
        isSelected
          ? chart.isAiPick
            ? "border-[#4a7ff7] bg-[#4a7ff7]/5 dark:bg-[#4a7ff7]/10 shadow-2xs ring-1 ring-[#4a7ff7]/20"
            : "border-slate-800 dark:border-zinc-500 bg-slate-50/90 dark:bg-zinc-800/90 shadow-2xs ring-1 ring-slate-800/10 dark:ring-zinc-600"
          : "border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`size-11 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
            isSelected
              ? chart.isAiPick
                ? "bg-[#4a7ff7] border-[#4a7ff7] text-white shadow-sm"
                : "bg-slate-800 dark:bg-zinc-700 border-slate-800 dark:border-zinc-700 text-white shadow-sm"
              : "border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
          }`}
        >
          <Icon className="size-5" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">{chart.title}</h3>
            {chart.isAiPick && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#e99842]/15 px-2 py-0.5 text-[10px] font-bold text-[#b86b1c] dark:text-[#f3a85b]">
                <Sparkles className="size-2.5 text-[#e99842]" />
                AI Pick
              </span>
            )}
            <span className="rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-zinc-400">
              Compatible
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
            {chart.description}
          </p>

          <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
            <strong className="text-slate-500 dark:text-zinc-400">Best for:</strong> {chart.bestFor}
          </p>

          {chart.isAiPick && (
            <p className="text-[11px] font-semibold text-[#b86b1c] dark:text-[#f3a85b] pt-0.5">
              {chart.aiReason}
            </p>
          )}
        </div>
      </div>

      <div
        className={`size-5 rounded-md flex items-center justify-center border shrink-0 mt-0.5 transition-colors ${
          isSelected
            ? chart.isAiPick
              ? "bg-[#4a7ff7] border-[#4a7ff7] text-white"
              : "bg-slate-800 dark:bg-zinc-700 border-slate-800 dark:border-zinc-700 text-white"
            : "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
        }`}
      >
        {isSelected && <Check className="size-3.5 stroke-[3]" />}
      </div>
    </div>
  )
}

// 4. Action and Navigation Buttons
function ActionControls({
  isAiSelected,
  selectedTitle,
  onBack,
  onResetToAi,
  onAcceptAi,
  onConfirmCustom,
}: {
  isAiSelected: boolean
  selectedTitle: string
  onBack: () => void
  onResetToAi: () => void
  onAcceptAi: () => void
  onConfirmCustom: () => void
}) {
  return (
    <div className="mt-7 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to Analysis Type</span>
      </button>

      <div className="flex items-center gap-2">
        {!isAiSelected ? (
          <>
            <button
              type="button"
              onClick={onResetToAi}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
            >
              <Sparkles className="size-3.5 text-[#e99842]" />
              <span>Reset to AI</span>
            </button>

            <button
              type="button"
              onClick={onConfirmCustom}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4a7ff7] text-white text-xs font-semibold hover:bg-[#3870ec] shadow-sm cursor-pointer transition-colors"
            >
              <span>Continue with {selectedTitle}</span>
              <ArrowRight className="size-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onAcceptAi}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4a7ff7] text-white text-xs font-semibold hover:bg-[#3870ec] shadow-sm cursor-pointer transition-colors"
          >
            <Sparkles className="size-3.5 text-[#e99842]" />
            <span>Accept AI Recommendation</span>
            <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// 5. Main Container Component (ChartSelectionStep)
export function ChartSelectionStep({
  analysisTypeId = "trend",
  datasetMeta,
  confirmedColumns = [],
  onBack,
  onNext,
}: {
  analysisTypeId: string
  datasetMeta?: DatasetMeta | null
  confirmedColumns?: string[]
  onBack: () => void
  onNext: (chosenChartId: string) => void
}) {
  // Compute dynamic recommendation based on analysis type and selected attributes
  const dynamicRecommendation = resolveDynamicChartRecommendation(
    analysisTypeId,
    confirmedColumns,
    datasetMeta
  )

  const baseCharts = ALLOWED_CHARTS_BY_ANALYSIS[analysisTypeId] || ALLOWED_CHARTS_BY_ANALYSIS["trend"]

  const allowedCharts: AllowedChartOption[] = baseCharts.map((chart) => {
    const isAiPick = chart.id === dynamicRecommendation.chartId
    return {
      ...chart,
      isAiPick,
      aiReason: isAiPick ? dynamicRecommendation.reason : chart.aiReason,
    }
  })

  const aiDefaultChart = allowedCharts.find((c) => c.isAiPick) || allowedCharts[0]
  const [selectedChartIds, setSelectedChartIds] = useState<string[]>([aiDefaultChart.id])

  const columnsKey = confirmedColumns.join(",")
  useEffect(() => {
    setSelectedChartIds([aiDefaultChart.id])
  }, [analysisTypeId, columnsKey])

  const handleToggleChart = (chartId: string) => {
    setSelectedChartIds((prev) => {
      if (prev.includes(chartId)) {
        if (prev.length <= 1) return prev
        return prev.filter((id) => id !== chartId)
      } else {
        return [...prev, chartId]
      }
    })
  }

  const isAiSelected = selectedChartIds.length === 1 && selectedChartIds[0] === aiDefaultChart.id

  const analysisNameMap: Record<string, string> = {
    trend: "Temporal / Trend Analysis",
    comparison: "Comparison Analysis",
    desc_freq: "Descriptive (Frequency & Share)",
    desc_numeric: "Descriptive & Distribution",
    correlation: "Relationship / Correlation",
  }

  const selectedTitle = selectedChartIds.length === 1
    ? (allowedCharts.find((c) => c.id === selectedChartIds[0])?.title || "Chart")
    : `${selectedChartIds.length} Charts Selected`

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7 shadow-sm">
      <StepHeader
        datasetName={datasetMeta?.name}
        analysisTitle={analysisNameMap[analysisTypeId] || analysisTypeId}
        confirmedColumns={confirmedColumns}
        contextBadge={dynamicRecommendation.contextBadge}
      />

      <div className="space-y-3">
        {allowedCharts.map((chart) => (
          <ChartOptionCard
            key={chart.id}
            chart={chart}
            isSelected={selectedChartIds.includes(chart.id)}
            onSelect={() => handleToggleChart(chart.id)}
          />
        ))}
      </div>

      <ActionControls
        isAiSelected={isAiSelected}
        selectedTitle={selectedTitle}
        onBack={onBack}
        onResetToAi={() => setSelectedChartIds([aiDefaultChart.id])}
        onAcceptAi={() => onNext(aiDefaultChart.id)}
        onConfirmCustom={() => onNext(selectedChartIds[0])}
      />
    </div>
  )
}

export default ChartSelectionStep

