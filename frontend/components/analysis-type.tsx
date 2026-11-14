"use client"

import React, { useState, useEffect } from "react"
import {
  BarChart3,
  TrendingUp,
  PieChart,
  GitFork,
  Activity,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Bot,
  Database,
} from "lucide-react"
import { DatasetMeta } from "@/lib/dataset-models"

export interface AnalysisTypeItem {
  id: string
  title: string
  targetCols: string
  objective: string
  icon: React.ComponentType<{ className?: string }>
  isAiRecommended: boolean
  reason: string
}

// ==============================================================================
// 🟢 START DEMO / SIMULATION CODE [Will be replaced with backend API integration]
// Matrix of the 5 canonical analysis types with default recommendation heuristics.
// In production: Backend API (e.g. POST /api/analysis/recommend) will analyze confirmed columns
// and return certified analysis compatibility and confidence scores.
// ==============================================================================

const DEMO_BASE_ANALYSIS_MATRIX: AnalysisTypeItem[] = [
  {
    id: "trend",
    title: "Temporal / Trend Analysis",
    targetCols: "Date + Numeric Metric",
    objective: "See how your numbers change, grow, or drop over time.",
    icon: TrendingUp,
    isAiRecommended: true,
    reason: "Best narrative fit for time-series progressions and quarterly trajectory",
  },
  {
    id: "comparison",
    title: "Comparison Analysis",
    targetCols: "Categorical + Numeric Metric",
    objective: "Compare your products, categories, or groups to see who performs best.",
    icon: BarChart3,
    isAiRecommended: false,
    reason: "Ideal for ranking metrics across discrete categories or platform tiers",
  },
  {
    id: "desc_freq",
    title: "Frequency & Share Analysis",
    targetCols: "Single Categorical Dimension",
    objective: "See how your data is divided, like percentage shares or most common reasons.",
    icon: PieChart,
    isAiRecommended: false,
    reason: "Displays value distribution and percentage share across channels/plans",
  },
  {
    id: "desc_numeric",
    title: "Distribution & Spread Analysis",
    targetCols: "Single Continuous Numeric",
    objective: "Understand typical values and spot unusually high or low numbers.",
    icon: Activity,
    isAiRecommended: false,
    reason: "Examines spread, skewness, and frequency density of numeric attributes",
  },
  {
    id: "correlation",
    title: "Relationship / Correlation Analysis",
    targetCols: "Numeric + Numeric Variables",
    objective: "See if two numbers are connected, like whether spending more brings higher sales.",
    icon: GitFork,
    isAiRecommended: false,
    reason: "Evaluates dependency and mathematical correlation between continuous metrics",
  },
]

// ==============================================================================
// 🔴 END DEMO / SIMULATION CODE
// ==============================================================================

// ==============================================================================
// Pure Helper Functions (Single Responsibility Principle)
// ==============================================================================

/**
 * Pure helper function to project analysis options with dynamic dataset recommendation state
 */
export function buildAnalysisOptionsWithRecommendation(
  recommendedId: string,
  datasetMeta?: DatasetMeta | null
): AnalysisTypeItem[] {
  return DEMO_BASE_ANALYSIS_MATRIX.map((item) => {
    const isRecommended = item.id === recommendedId
    let customReason = item.reason

    if (isRecommended && datasetMeta?.analysisReason) {
      customReason = datasetMeta.analysisReason
    }

    return {
      ...item,
      isAiRecommended: isRecommended,
      reason: customReason,
    }
  })
}

// ==============================================================================
// Modular UI Sub-Components
// ==============================================================================

/** 1. Step badge and active dataset tag */
function StepHeaderBadge({ datasetName }: { datasetName?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 mb-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-zinc-300 shadow-sm">
        <Bot className="size-3.5 text-[#e99842]" />
        <span>Step 3 of 4 • Analytical Approach</span>
      </div>
      {datasetName && (
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
          <Database className="size-3 text-[#4a7ff7]" />
          <span>{datasetName}</span>
        </div>
      )}
    </div>
  )
}

/** 2. Page header and description */
function AnalysisHeaderSection({ datasetName }: { datasetName?: string }) {
  return (
    <header className="text-center mb-6">
      <StepHeaderBadge datasetName={datasetName} />
      <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100">Select Analysis Type</h1>
      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
        Choose your analytical objective.
      </p>
    </header>
  )
}

/** 3. Analysis type badge icon */
function AnalysisTypeIcon({
  icon: Icon,
  isSelected,
  isAiRecommended,
}: {
  icon: React.ComponentType<{ className?: string }>
  isSelected: boolean
  isAiRecommended: boolean
}) {
  return (
    <div
      className={`size-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
        isSelected
          ? isAiRecommended
            ? "bg-[#4a7ff7] border-[#4a7ff7] text-white"
            : "bg-slate-800 dark:bg-zinc-700 border-slate-800 dark:border-zinc-700 text-white"
          : "border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
      }`}
    >
      <Icon className="size-5" />
    </div>
  )
}

/** 4. Analysis option card */
function AnalysisOptionCard({
  item,
  isSelected,
  onSelect,
}: {
  item: AnalysisTypeItem
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-start justify-between rounded-2xl p-4 border transition-all cursor-pointer select-none ${
        isSelected
          ? item.isAiRecommended
            ? "border-[#4a7ff7] bg-[#4a7ff7]/5 dark:bg-[#4a7ff7]/15 shadow-2xs"
            : "border-slate-800 dark:border-zinc-500 bg-slate-50/80 dark:bg-zinc-700/60 shadow-2xs"
          : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#282b34] hover:bg-slate-50 dark:hover:bg-[#2e323d] opacity-90 dark:opacity-90"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <AnalysisTypeIcon
          icon={item.icon}
          isSelected={isSelected}
          isAiRecommended={item.isAiRecommended}
        />

        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">{item.title}</h3>
            <span className="rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
              {item.targetCols}
            </span>
            {item.isAiRecommended && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#e99842]/15 dark:bg-[#e99842]/20 px-2 py-0.5 text-[10px] font-bold text-[#b86b1c] dark:text-[#f3a85b]">
                <Sparkles className="size-2.5 text-[#e99842]" />
                AI Pick
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
            {item.objective}
          </p>
        </div>
      </div>

      <div
        className={`size-5 rounded-md flex items-center justify-center border shrink-0 mt-1 transition-colors ${
          isSelected
            ? item.isAiRecommended
              ? "bg-[#4a7ff7] border-[#4a7ff7] text-white"
              : "bg-slate-800 dark:bg-zinc-700 border-slate-800 dark:border-zinc-700 text-white"
            : "border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
        }`}
      >
        {isSelected && <Check className="size-3.5 stroke-[3]" />}
      </div>
    </div>
  )
}

/** 5. Action and navigation buttons */
function AnalysisActionControls({
  isAiSelected,
  onBack,
  onResetToRecommended,
  onAcceptRecommended,
  onConfirmSelection,
}: {
  isAiSelected: boolean
  onBack: () => void
  onResetToRecommended: () => void
  onAcceptRecommended: () => void
  onConfirmSelection: () => void
}) {
  return (
    <footer className="mt-7 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back</span>
      </button>

      <div className="flex items-center gap-2">
        {!isAiSelected ? (
          <>
            <button
              type="button"
              onClick={onResetToRecommended}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
            >
              <Sparkles className="size-3.5 text-[#e99842]" />
              <span>Reset to AI</span>
            </button>

            <button
              type="button"
              onClick={onConfirmSelection}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4a7ff7] text-white text-xs font-semibold hover:bg-[#3870ec] shadow-sm cursor-pointer transition-colors"
            >
              <span>Generate Storyboard</span>
              <ArrowRight className="size-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onAcceptRecommended}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4a7ff7] text-white text-xs font-semibold hover:bg-[#3870ec] shadow-sm cursor-pointer transition-colors"
          >
            <Sparkles className="size-3.5 text-[#e99842]" />
            <span>Accept AI & Generate Storyboard</span>
            <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
    </footer>
  )
}

// ==============================================================================
// 6. Main Container Component (AnalysisType)
// ==============================================================================

export function AnalysisType({
  datasetMeta,
  confirmedColumns,
  onBack,
  onGenerate,
}: {
  datasetMeta?: DatasetMeta | null
  confirmedColumns?: string[]
  onBack: () => void
  onGenerate: (analysisTypeId: string) => void
}) {
  const recommendedAnalysisId = datasetMeta?.recommendedAnalysisId || "trend"
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>(recommendedAnalysisId)

  useEffect(() => {
    if (datasetMeta?.recommendedAnalysisId) {
      setSelectedAnalysisId(datasetMeta.recommendedAnalysisId)
    }
  }, [datasetMeta])

  // Build analysis options with recommendation state
  const analysisOptions = buildAnalysisOptionsWithRecommendation(recommendedAnalysisId, datasetMeta)

  // Single Responsibility Action Handlers
  function handleSelectOption(id: string): void {
    setSelectedAnalysisId(id)
  }

  function handleResetToRecommended(): void {
    setSelectedAnalysisId(recommendedAnalysisId)
  }

  function handleAcceptRecommended(): void {
    onGenerate(recommendedAnalysisId)
  }

  function handleConfirmCustom(): void {
    onGenerate(selectedAnalysisId)
  }

  const isAiSelected = selectedAnalysisId === recommendedAnalysisId

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-[#22252c] p-7 shadow-sm">
      <AnalysisHeaderSection datasetName={datasetMeta?.name} />

      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {analysisOptions.map((item) => (
          <AnalysisOptionCard
            key={item.id}
            item={item}
            isSelected={selectedAnalysisId === item.id}
            onSelect={() => handleSelectOption(item.id)}
          />
        ))}
      </div>

      <AnalysisActionControls
        isAiSelected={isAiSelected}
        onBack={onBack}
        onResetToRecommended={handleResetToRecommended}
        onAcceptRecommended={handleAcceptRecommended}
        onConfirmSelection={handleConfirmCustom}
      />
    </div>
  )
}

export default AnalysisType
