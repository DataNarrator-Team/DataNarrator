"use client"

import React, { useState, useEffect } from "react"
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Bot,
  Database,
} from "lucide-react"
import { ColumnDefinition } from "@/lib/dataset-models"

// ==============================================================================
// 🟢 START DEMO / SIMULATION CODE [Will be replaced with backend API integration]
// Default column mock data and quick analytical goal templates for client prototyping.
// When integrated, these goals and schema will be provided by backend AI recommendation APIs.
// ==============================================================================

/** Fallback columns used only when testing step directly without dataset upload */
const DEMO_FALLBACK_COLUMNS: ColumnDefinition[] = [
  { name: "Order_Date", isAiPick: true, reason: "Timeline date of each transaction", dataType: "date" },
  { name: "Product_Category", isAiPick: true, reason: "Type of product sold", dataType: "category" },
  { name: "Gross_Revenue", isAiPick: true, reason: "Total sales amount ($)", dataType: "numeric" },
  { name: "Units_Sold", isAiPick: true, reason: "Number of items sold", dataType: "numeric" },
  { name: "Customer_ID", isAiPick: false, reason: "Customer identifier code", dataType: "identifier" },
  { name: "Postal_Code", isAiPick: false, reason: "Delivery location area", dataType: "category" },
]

/** Interface representing a 1-click quick analytical goal template */
export interface QuickGoalExample {
  label: string
  hint: string
  columns: string[]
}

/**
 * Pure helper providing pre-configured 1-click analysis goals based on dataset context.
 * In production: Backend will generate dynamic goals based on actual column semantics.
 */
export function getDemoQuickGoals(datasetName?: string): QuickGoalExample[] {
  if (datasetName?.includes("Customer_Retention")) {
    return [
      { label: " Churn Over Time", hint: "See how retention changes month by month", columns: ["Cohort_Month", "Retention_Rate"] },
      { label: " Best Plans", hint: "Compare retention across subscription plans", columns: ["Subscription_Plan", "Retention_Rate"] },
      { label: " Why Users Leave", hint: "See the most common cancellation reasons", columns: ["Churn_Reason"] },
    ]
  }

  if (datasetName?.includes("Marketing_Campaign")) {
    return [
      { label: " Best Ad Channels", hint: "Compare return on ad spend across platforms", columns: ["Platform", "ROI_Multiplier"] },
      { label: " Deals Growth", hint: "Track conversions growth throughout the year", columns: ["Campaign_Month", "Conversions"] },
      { label: " Spend vs Deals", hint: "See if spending more brings more customers", columns: ["Ad_Spend", "Conversions"] },
    ]
  }

  // Global Sales (Default Demo)
  return [
    { label: " Sales Growth", hint: "See revenue changes over time", columns: ["Order_Date", "Gross_Revenue"] },
    { label: " Top Products", hint: "Compare revenue across categories", columns: ["Product_Category", "Gross_Revenue"] },
    { label: " Channel Margins", hint: "Compare profit across sales channels", columns: ["Sales_Channel", "Profit_Margin"] },
  ]
}

// ==============================================================================
// 🔴 END DEMO / SIMULATION CODE
// ==============================================================================

// ==============================================================================
// Pure Helper Functions (Single Responsibility Principle)
// ==============================================================================

/**
 * Checks whether a given column is present in current selection
 */
export function isColumnSelected(selectedList: string[], columnName: string): boolean {
  return selectedList.includes(columnName)
}

/**
 * Toggles column presence in selection array (immutable)
 */
export function toggleColumnInList(currentSelection: string[], columnName: string): string[] {
  if (currentSelection.includes(columnName)) {
    return currentSelection.filter((item) => item !== columnName)
  }
  return [...currentSelection, columnName]
}

/**
 * Filters goal columns to ensure they exist within available dataset schema
 */
export function filterValidColumnsForGoal(goalColumns: string[], availableColumns: ColumnDefinition[]): string[] {
  return goalColumns.filter((colName) => availableColumns.some((col) => col.name === colName))
}

/**
 * Extracts column names flagged as AI recommended (isAiPick = true)
 */
export function extractRecommendedColumnNames(columns: ColumnDefinition[]): string[] {
  return columns.filter((col) => col.isAiPick).map((col) => col.name)
}

/**
 * Determines whether the user selection matches the AI recommendation set
 */
export function checkIsSelectionMatchingRecommended(selectedColumns: string[], recommendedColumns: string[]): boolean {
  return (
    selectedColumns.length === recommendedColumns.length &&
    recommendedColumns.every((col) => selectedColumns.includes(col))
  )
}

// ==============================================================================
// Modular UI Sub-Components
// ==============================================================================

/** 1. Step header and active dataset indicator */
function StepHeader({ datasetName }: { datasetName?: string }) {
  return (
    <header className="text-center mb-5">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-zinc-300 shadow-sm mb-2.5">
        <Bot className="size-3.5 text-[#e99842]" />
        <span>Step 2 of 4 • Column Selection & Goals</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100">Choose Columns</h1>
      {datasetName && (
        <div className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
          <Database className="size-3 text-[#4a7ff7]" />
          <span>{datasetName}</span>
        </div>
      )}
      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5">
        Pick what you want to learn from your data. You can choose 1, 2, or more columns.
      </p>
    </header>
  )
}

/** 2. Quick Goal Card (1-click selection card) */
function QuickGoalCard({
  goal,
  isSelected,
  onSelect,
}: {
  goal: QuickGoalExample
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col justify-start text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
        isSelected
          ? "border-[#4a7ff7] bg-blue-50/70 dark:bg-blue-950/30 shadow-sm ring-1 ring-[#4a7ff7]/30"
          : "border-slate-200/90 dark:border-zinc-700/90 bg-white dark:bg-[#282b34] hover:border-[#4a7ff7]/50 hover:bg-slate-50/80 dark:hover:bg-[#2e323d] shadow-2xs"
      }`}
    >
      <div className="flex items-center justify-between w-full mb-1.5 gap-2">
        <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover:text-[#4a7ff7] dark:group-hover:text-[#60a5fa]">
          {goal.label}
        </span>
        <span
          className={`size-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
            isSelected
              ? "bg-[#4a7ff7] border-[#4a7ff7] text-white"
              : "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
          }`}
        >
          {isSelected && <Check className="size-2.5 stroke-[3]" />}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
        {goal.hint}
      </p>
    </button>
  )
}

/** 3. Quick Analytical Goals Section */
function QuickGoalsSection({
  goals,
  selectedColumns,
  onToggleGoal,
}: {
  goals: QuickGoalExample[]
  selectedColumns: string[]
  onToggleGoal: (goal: QuickGoalExample) => void
}) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <span className="text-xs font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-[#e99842]" />
          Quick Examples (Multi-select enabled):
        </span>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500 hidden sm:inline">
          Pick 1 or more analysis goals
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {goals.map((goal) => {
          const isSelected =
            goal.columns.length > 0 &&
            goal.columns.every((c) => selectedColumns.includes(c))

          return (
            <QuickGoalCard
              key={goal.label}
              goal={goal}
              isSelected={isSelected}
              onSelect={() => onToggleGoal(goal)}
            />
          )
        })}
      </div>
    </section>
  )
}

/** 4. Individual Column Card */
function ColumnCard({
  name,
  isAiPick,
  reason,
  isSelected,
  onToggle,
}: {
  name: string
  isAiPick: boolean
  reason: string
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-start gap-2.5 rounded-xl p-2.5 border transition-all cursor-pointer select-none ${
        isSelected
          ? isAiPick
            ? "border-[#4a7ff7] bg-[#4a7ff7]/5 dark:bg-[#4a7ff7]/15 shadow-2xs"
            : "border-slate-800 dark:border-zinc-500 bg-slate-50/80 dark:bg-zinc-700/60 shadow-2xs"
          : "border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-[#282b34] hover:border-slate-300 dark:hover:border-zinc-600 hover:bg-slate-50/80 dark:hover:bg-[#2e323d]"
      }`}
    >
      <div
        className={`size-4 rounded-md flex items-center justify-center border shrink-0 mt-0.5 transition-colors ${
          isSelected
            ? isAiPick
              ? "bg-[#4a7ff7] border-[#4a7ff7] text-white"
              : "bg-slate-800 dark:border-zinc-700 border-slate-800 dark:border-zinc-700 text-white"
            : "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
        }`}
      >
        {isSelected && <Check className="size-2.5 stroke-[3]" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate" title={name}>
            {name}
          </span>
          {isAiPick && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#e99842]/15 dark:bg-[#e99842]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#b86b1c] dark:text-[#f3a85b]">
              <Sparkles className="size-2 text-[#e99842]" />
              Recommended
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-0.5" title={reason}>
          {reason}
        </p>
      </div>
    </div>
  )
}

/** 5. Available Columns Grid Section */
function AvailableColumnsSection({
  columns,
  selectedColumns,
  onToggleColumn,
}: {
  columns: ColumnDefinition[]
  selectedColumns: string[]
  onToggleColumn: (columnName: string) => void
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
          Available Columns ({columns.length})
        </span>
        <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
          {selectedColumns.length} selected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
        {columns.map((col) => (
          <ColumnCard
            key={col.name}
            name={col.name}
            isAiPick={col.isAiPick}
            reason={col.reason}
            isSelected={isColumnSelected(selectedColumns, col.name)}
            onToggle={() => onToggleColumn(col.name)}
          />
        ))}
      </div>
    </section>
  )
}

/** 6. Navigation and Confirmation Buttons */
function NavigationActionButtons({
  isMatchingAi,
  selectedCount,
  onBack,
  onResetToRecommended,
  onAcceptRecommended,
  onConfirmSelection,
}: {
  isMatchingAi: boolean
  selectedCount: number
  onBack: () => void
  onResetToRecommended: () => void
  onAcceptRecommended: () => void
  onConfirmSelection: () => void
}) {
  return (
    <footer className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back</span>
      </button>

      <div className="flex items-center gap-2">
        {!isMatchingAi ? (
          <>
            <button
              type="button"
              onClick={onResetToRecommended}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
            >
              <Sparkles className="size-3.5 text-[#e99842]" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={onConfirmSelection}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4a7ff7] text-white text-xs font-semibold hover:bg-[#3870ec] shadow-sm cursor-pointer transition-colors"
            >
              <span>Continue ({selectedCount})</span>
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
            <span>Use AI Recommendation</span>
            <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
    </footer>
  )
}

// ==============================================================================
// 7. Main Container Component (ColumnRecommendationStep)
// ==============================================================================

export function ColumnRecommendationStep({
  columns = DEMO_FALLBACK_COLUMNS,
  datasetName,
  onBack,
  onNext,
}: {
  columns?: ColumnDefinition[]
  goalBundles?: any
  datasetName?: string
  onBack: () => void
  onNext: (chosenCols: string[]) => void
}) {
  const activeColumns = columns && columns.length > 0 ? columns : DEMO_FALLBACK_COLUMNS
  const quickGoals = getDemoQuickGoals(datasetName)
  const recommendedColumns = extractRecommendedColumnNames(activeColumns)

  const [selectedColumns, setSelectedColumns] = useState<string[]>(recommendedColumns)

  useEffect(() => {
    setSelectedColumns(recommendedColumns)
  }, [columns])

  // Toggle single column selection
  function handleToggleColumn(colName: string): void {
    setSelectedColumns((prev) => toggleColumnInList(prev, colName))
  }

  // Toggle quick analytical goal template (multi-select supported)
  function handleToggleQuickGoal(goal: QuickGoalExample): void {
    const isGoalSelected =
      goal.columns.length > 0 && goal.columns.every((c) => selectedColumns.includes(c))

    if (!isGoalSelected) {
      // Add all valid columns from this goal to current selection
      const validCols = filterValidColumnsForGoal(goal.columns, activeColumns)
      setSelectedColumns((prev) => Array.from(new Set([...prev, ...validCols])))
    } else {
      // Deselecting: keep columns needed by any OTHER currently active goals
      const otherActiveGoals = quickGoals.filter(
        (g) =>
          g.label !== goal.label &&
          g.columns.length > 0 &&
          g.columns.every((c) => selectedColumns.includes(c))
      )
      const colsToKeep = new Set(otherActiveGoals.flatMap((g) => g.columns))

      setSelectedColumns((prev) =>
        prev.filter((col) => {
          if (goal.columns.includes(col)) {
            return colsToKeep.has(col)
          }
          return true
        })
      )
    }
  }

  // Reset to default AI recommended columns
  function handleResetToAi(): void {
    setSelectedColumns([...recommendedColumns])
  }

  // Confirm selection and advance to next step
  function handleConfirm(): void {
    if (selectedColumns.length === 0) {
      alert("Please pick at least one column.")
      return
    }
    onNext(selectedColumns)
  }

  const isMatchingAi = checkIsSelectionMatchingRecommended(selectedColumns, recommendedColumns)

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-[#22252c] p-6 sm:p-7 shadow-sm">
      <StepHeader datasetName={datasetName} />

      <QuickGoalsSection
        goals={quickGoals}
        selectedColumns={selectedColumns}
        onToggleGoal={handleToggleQuickGoal}
      />

      <AvailableColumnsSection
        columns={activeColumns}
        selectedColumns={selectedColumns}
        onToggleColumn={handleToggleColumn}
      />

      <NavigationActionButtons
        isMatchingAi={isMatchingAi}
        selectedCount={selectedColumns.length}
        onBack={onBack}
        onResetToRecommended={handleResetToAi}
        onAcceptRecommended={() => onNext(recommendedColumns)}
        onConfirmSelection={handleConfirm}
      />
    </div>
  )
}

export default ColumnRecommendationStep
