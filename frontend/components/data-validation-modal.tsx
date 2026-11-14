"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  AlertTriangle,
  X,
  FileSpreadsheet,
  Copy,
  CheckCircle2,
  Database,
  ArrowRight,
  Sparkles,
  Check,
  Split,
  Combine,
  Wand2,
  SlidersHorizontal,
  ArrowLeft,
  ShieldAlert,
  Trash2,
  AlertCircle,
  Table,
  Eye,
  ChevronDown,
  Plus,
  Edit3,
} from "lucide-react"
import {
  DatasetErrorInspectorModal,
  DatasetErrorInspectorContent,
  ActiveIssue,
  InspectorViewMode,
  getSampleRows,
  checkCellError,
} from "@/components/dataset-error-inspector-modal"

// ==========================================
// 1. Interfaces & Types
// ==========================================

export interface MissingValueItem {
  columnName: string
  count: number
  dataType?: "text" | "numeric" | "date"
  defaultFill?: string
  percentage?: number
  isExceededLimit?: boolean
  limitThreshold?: number
}

export interface FormatOption {
  id: string
  label: string
  example: string
  frequency?: string
}

export interface FormatErrorItem {
  columnName: string
  count: number
  detail?: string
  detectedFormats: FormatOption[]
  selectedFormat?: string
}

export interface DuplicateRowItem {
  id: string
  rowIndex: number // 1-based index (e.g. Row 14)
  duplicateOfIndex: number // (e.g. matches Row 3)
  matchType: "exact" | "partial"
  matchRate: string // e.g. "100% Match"
  rowData: Record<string, string> // key cell previews
  reason?: string
}

export interface ValidationReport {
  missingValues?: MissingValueItem[]
  formatErrors?: FormatErrorItem[]
  duplicateRows?: DuplicateRowItem[]
  isCleaned?: boolean
  cleaningSummary?: CleaningDecisions
}

export interface CleaningDecisions {
  missingFillValues: Record<string, string>
  selectedFormats: Record<string, string>
  removedDuplicateRowIndices?: number[]
  duplicateRowsAction?: "remove_duplicates" | "keep_all"
  excludedColumns?: string[]
}

export interface PresetOption {
  value: string
  label: string
  tooltip: string
}

export function getColumnType(item: MissingValueItem): "text" | "numeric" | "date" {
  if (item.dataType) return item.dataType
  const name = item.columnName.toLowerCase()
  if (
    name.includes("date") ||
    name.includes("time") ||
    name.includes("year") ||
    name.includes("month") ||
    name.includes("day") ||
    name.includes("stamp")
  ) {
    return "date"
  }
  if (
    name.includes("rate") ||
    name.includes("discount") ||
    name.includes("price") ||
    name.includes("amount") ||
    name.includes("count") ||
    name.includes("subscribers") ||
    name.includes("sales") ||
    name.includes("revenue") ||
    name.includes("metric") ||
    name.includes("total") ||
    name.includes("cost") ||
    name.includes("profit") ||
    name.includes("score") ||
    name.includes("num") ||
    name.includes("qty") ||
    name.includes("quantity") ||
    name.includes("charges")
  ) {
    return "numeric"
  }
  return "text"
}

export const PRESETS_BY_TYPE: Record<"text" | "numeric" | "date", PresetOption[]> = {
  text: [
    { value: "mode", label: "mode", tooltip: "Fill missing values with Mode (Most Frequent Value for text/categorical columns)" },
    { value: "null", label: "null", tooltip: "Normalize to standardized null marker" },
    { value: "None", label: "None", tooltip: "General None representation" },
    { value: "N/A", label: "N/A", tooltip: "Not Available string representation" },
  ],
  numeric: [
    { value: "mean", label: "mean", tooltip: "Impute missing values with Mean (Average of numeric values in this column)" },
    { value: "NaN", label: "NaN", tooltip: "Not a Number (standard numeric missing value)" },
    { value: "null", label: "null", tooltip: "Standard null internal marker" },
    { value: "None", label: "None", tooltip: "General None marker" },
  ],
  date: [
    { value: "mode", label: "mode", tooltip: "Fill missing dates with Mode (Most Frequent Date in this column)" },
    { value: "NaT", label: "NaT", tooltip: "Not a Time (standard datetime missing marker)" },
    { value: "null", label: "null", tooltip: "Standard null internal marker" },
    { value: "None", label: "None", tooltip: "General None placeholder" },
  ],
}

export function getDefaultFillForType(type: "text" | "numeric" | "date", defaultFill?: string): string {
  if (defaultFill) {
    const lower = defaultFill.toLowerCase()
    if (lower === "mean") return "mean"
    if (lower === "mode") return "mode"
    if (lower === "null" || lower === "none" || lower === "nan" || lower === "nat" || lower === "n/a") {
      return type === "numeric" ? "mean" : "mode"
    }
    return defaultFill
  }
  return type === "numeric" ? "mean" : "mode"
}

export function getMissingStats(item: MissingValueItem, totalRows: number = 350, threshold: number = 20) {
  const percentage =
    item.percentage !== undefined
      ? item.percentage
      : totalRows > 0
      ? Math.round((item.count / totalRows) * 100)
      : 0
  const isExceeded = percentage > threshold

  return {
    threshold,
    percentage,
    isExceeded,
  }
}

// 1. Clean dataset notification alert
function CleanAlert({ onViewDataset }: { onViewDataset?: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/20 p-5 text-emerald-800 dark:text-zinc-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Dataset is 100% Clean &amp; Verified!</div>
            <div className="text-xs text-emerald-700 dark:text-zinc-300 mt-0.5">
              Zero missing cells, uniform format data types, and unique column headers. Your data is ready for instant analysis.
            </div>
          </div>
        </div>

        {onViewDataset && (
          <button
            type="button"
            onClick={onViewDataset}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <Table className="size-3.5" />
            <span>View Cleaned Dataset</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-[#252831] p-3.5 text-center">
          <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-1.5">
            <Check className="size-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-200">Missing Values</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">0 Empty Cells</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-[#252831] p-3.5 text-center">
          <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-1.5">
            <Check className="size-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-200">Format Consistency</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Uniform Formats</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-[#252831] p-3.5 text-center">
          <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-1.5">
            <Check className="size-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-200">Duplicate Rows</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">0 Duplicates</span>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 2. Data Quality Report Modal
// Supports Side-by-Side Popup
// ==========================================

export function DataValidationModal({
  isOpen,
  onClose,
  onProceed,
  onSkip,
  onCancel,
  onOpenCleaning,
  report,
  datasetMeta,
}: {
  isOpen: boolean
  onClose: () => void
  onProceed?: () => void
  onSkip?: () => void
  onCancel?: () => void
  onOpenCleaning?: () => void
  report?: ValidationReport
  datasetMeta?: any
}) {
  // Side-by-side Inspector State
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [inspectorTargetCol, setInspectorTargetCol] = useState<string | undefined>()
  const [inspectorActiveIssue, setInspectorActiveIssue] = useState<ActiveIssue | null>(null)
  const [inspectorViewMode, setInspectorViewMode] = useState<InspectorViewMode>("all")

  // Configurable Missing Data Threshold (Default: 20%)
  const [missingThreshold, setMissingThreshold] = useState<number>(20)
  const [customModeCols, setCustomModeCols] = useState<Record<string, boolean>>({})

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !inspectorOpen) onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, onClose, inspectorOpen])

  if (!isOpen) return null

  const rowCount = datasetMeta?.rowCount || 1240
  const colCount = datasetMeta?.columns?.length || datasetMeta?.colCount || 12

  const hasMissing = Boolean(report?.missingValues && report.missingValues.length > 0)
  const hasFormat = Boolean(report?.formatErrors && report.formatErrors.length > 0)
  const hasDuplicates = Boolean(report?.duplicateRows && report.duplicateRows.length > 0)
  const hasIssues = !report?.isCleaned && (hasMissing || hasFormat || hasDuplicates)

  const totalMissing = report?.missingValues?.reduce((acc, curr) => acc + curr.count, 0) || 0
  const totalFormatErrors = report?.formatErrors?.reduce((acc, curr) => acc + curr.count, 0) || 0
  const totalDuplicates = report?.duplicateRows?.length || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Main Data Quality Report Window */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1e2026] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 pb-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-10 items-center justify-center rounded-xl shadow-2xs ${
                  hasIssues
                    ? "bg-amber-50 dark:bg-amber-950/40 text-[#e99842] border border-amber-200/80 dark:border-amber-800/50"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50"
                }`}
              >
                {hasIssues ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                    {hasIssues ? "Data Quality Report" : "Dataset Verified • 100% Clean"}
                  </h3>
                  <span
                    className={`rounded-full text-[10px] font-bold px-2 py-0.5 ${
                      hasIssues
                        ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300"
                        : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300"
                    }`}
                  >
                    {hasIssues ? "Inspection Report" : "All Checks Passed"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {hasIssues
                    ? "Three main issue types detected. Inspect each or proceed directly."
                    : "Zero issues detected. All columns and rows have passed validation checks."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Dataset Summary & Header View Dataset button */}
          <div className="px-4 sm:px-5 py-2.5 bg-slate-50 dark:bg-[#252831] border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 truncate">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-200 truncate">
                <Database className="size-3.5 text-[#4a7ff7] shrink-0" />
                <span className="font-semibold truncate">{datasetMeta?.name || "Uploaded Dataset"}</span>
              </div>
              <span className="text-slate-300 dark:text-zinc-600">&bull;</span>
              <span className="text-slate-500 dark:text-zinc-400 font-medium shrink-0">
                {rowCount.toLocaleString()} rows &bull; {colCount} cols
              </span>
            </div>

            <button
                type="button"
                onClick={() => {
                  setInspectorTargetCol(undefined)
                  setInspectorActiveIssue(null)
                  setInspectorViewMode("all")
                  setInspectorOpen(true)
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold cursor-pointer transition-all shadow-2xs ${
                  inspectorOpen && inspectorViewMode === "all"
                    ? "bg-[#4a7ff7] text-white border-[#4a7ff7]"
                    : "border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 hover:bg-slate-50 hover:border-[#4a7ff7]"
                }`}
                title="View dataset table filtered to all detected issues"
              >
                <Table className="size-3.5 text-[#4a7ff7]" />
                <span>{report?.isCleaned ? "View Cleaned Dataset" : "View Dataset"}</span>
              </button>
          </div>

          {/* Scrollable Error Sections */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {!hasIssues ? (
              <CleanAlert onViewDataset={() => {
                setInspectorTargetCol(undefined)
                setInspectorActiveIssue(null)
                setInspectorViewMode("all")
                setInspectorOpen(true)
              }} />
            ) : (
              <>
                {/* 1. Missing Values Section */}
                {hasMissing && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/15 p-3.5 sm:p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold">
                        <FileSpreadsheet className="size-4 text-[#e99842]" />
                        <span className="uppercase tracking-wider">1. Missing Values ({totalMissing} empty cells)</span>
                      </div>
                    </div>

                    {/* Columns List */}
                    <div className="space-y-1.5">
                      {report?.missingValues?.map((m) => {
                        const stats = getMissingStats(m, rowCount, missingThreshold)

                        return (
                          <div
                            key={m.columnName}
                            className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-amber-200/80 dark:border-zinc-700 bg-white dark:bg-[#252831] px-3 py-2 text-slate-800 dark:text-zinc-100 gap-1.5"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`size-2 rounded-full ${stats.isExceeded ? "bg-rose-500" : "bg-[#e99842]"}`} />
                              <span className="font-mono font-bold">{m.columnName}</span>
                              {stats.isExceeded && (
                                <span className="inline-flex items-center gap-1 rounded bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.5 text-[9px] font-bold text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                  <AlertTriangle className="size-2.5 text-rose-600" />
                                  Exceeds {missingThreshold}% Limit ({stats.percentage}%)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
                                {m.count} empty cells
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Wrong Format Section */}
                {hasFormat && (
                  <div className="rounded-xl border border-blue-200 dark:border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/15 p-3.5 sm:p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-900 dark:text-sky-300 font-bold">
                        <AlertTriangle className="size-4 text-[#4a7ff7]" />
                        <span className="uppercase tracking-wider">2. Wrong Format ({totalFormatErrors} rows)</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {report?.formatErrors?.map((f) => (
                        <div
                          key={f.columnName}
                          className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-blue-200/80 dark:border-zinc-700 bg-white dark:bg-[#252831] px-3 py-2 text-slate-800 dark:text-zinc-100 gap-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-[#4a7ff7]" />
                            <span className="font-mono font-bold">{f.columnName}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-bold text-blue-700 dark:text-sky-400">
                              {f.count} format errors
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Duplicate Rows Section */}
                {hasDuplicates && (
                  <div className="rounded-xl border border-rose-200 dark:border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/15 p-3.5 sm:p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-900 dark:text-rose-300 font-bold">
                        <Copy className="size-4 text-rose-600" />
                        <span className="uppercase tracking-wider">3. Duplicate Rows ({totalDuplicates} detected)</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Identical records skew sums &amp; averages
                      </span>
                    </div>

                    <div className="space-y-2">
                      {report?.duplicateRows?.map((rowItem) => (
                        <div
                          key={rowItem.id}
                          className="flex items-center justify-between rounded-lg border border-rose-200/80 dark:border-zinc-700 bg-white dark:bg-[#252831] px-3 py-2 text-slate-800 dark:text-zinc-100 gap-2"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="size-2 rounded-full bg-rose-500" />
                            <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
                              Row #{rowItem.rowIndex}
                            </span>
                            <span className="text-[11px] text-slate-400 font-sans">
                              (Duplicates Row #{rowItem.duplicateOfIndex})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                              Duplicate row
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#1a1c22] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onCancel || onClose}
              className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs"
            >
              Close
            </button>

            <div className="flex items-center gap-2.5">
              {hasIssues ? (
                <>
                  <button
                    type="button"
                    onClick={onSkip || onClose}
                    title="Proceed with warnings and skip cleaning"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer transition-all shadow-2xs"
                  >
                    <span>Proceed with Warnings (Skip Cleaning)</span>
                  </button>

                  {onOpenCleaning && (
                    <button
                      type="button"
                      onClick={onOpenCleaning}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] px-5 py-2 text-xs font-semibold text-white shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Sparkles className="size-3.5 text-[#e99842]" />
                      <span>Clean Data</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={onProceed || onClose}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] px-5 py-2 text-xs font-semibold text-white shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>Continue</span>
                  <ArrowRight className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Dataset Popup Window - Read-only inspection in Data Quality Report */}
      <DatasetErrorInspectorModal
        isOpen={inspectorOpen}
        onClose={() => {
          setInspectorOpen(false)
          setInspectorActiveIssue(null)
        }}
        datasetName={datasetMeta?.name}
        initialTargetColumn={inspectorTargetCol}
        initialActiveIssue={inspectorActiveIssue}
        initialViewMode={inspectorViewMode}
        report={report}
        datasetMeta={datasetMeta}
        allowCellEditing={false}
        onOpenCleaning={() => {
          setInspectorOpen(false)
          if (onOpenCleaning) onOpenCleaning()
        }}
      />
    </div>
  )
}

// ==========================================
// 3. Data Cleaning Studio Modal
// ==========================================

export function DataCleaningModal({
  isOpen,
  onClose,
  onBack,
  onApplyCleaning,
  report,
  datasetMeta,
}: {
  isOpen: boolean
  onClose: () => void
  onBack?: () => void
  onApplyCleaning?: (decisions: CleaningDecisions) => void
  report?: ValidationReport
  datasetMeta?: any
}) {
  const [missingFillValues, setMissingFillValues] = useState<Record<string, string>>({})
  const [selectedFormats, setSelectedFormats] = useState<Record<string, string>>({})
  const [removedDuplicateRowIndices, setRemovedDuplicateRowIndices] = useState<number[]>([])
  const [duplicateRowsAction, setDuplicateRowsAction] = useState<"remove_duplicates" | "keep_all">("remove_duplicates")
  const [missingThreshold, setMissingThreshold] = useState<number>(20)
  const [customModeCols, setCustomModeCols] = useState<Record<string, boolean>>({})

  // Side-by-side Inspector State
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [inspectorTargetCol, setInspectorTargetCol] = useState<string | undefined>()
  const [inspectorActiveIssue, setInspectorActiveIssue] = useState<ActiveIssue | null>(null)
  const [inspectorViewMode, setInspectorViewMode] = useState<InspectorViewMode>("all")

  useEffect(() => {
    if (!report) return

    const initialFills: Record<string, string> = {}
    report.missingValues?.forEach((item) => {
      const type = getColumnType(item)
      initialFills[item.columnName] = getDefaultFillForType(type, item.defaultFill)
    })
    setMissingFillValues(initialFills)

    const initialFormats: Record<string, string> = {}
    report.formatErrors?.forEach((item) => {
      if (item.detectedFormats && item.detectedFormats.length > 0) {
        initialFormats[item.columnName] = item.selectedFormat || item.detectedFormats[0].id
      }
    })
    setSelectedFormats(initialFormats)

    if (report.duplicateRows && report.duplicateRows.length > 0) {
      setRemovedDuplicateRowIndices(report.duplicateRows.map((r) => r.rowIndex))
      setDuplicateRowsAction("remove_duplicates")
    } else {
      setRemovedDuplicateRowIndices([])
      setDuplicateRowsAction("keep_all")
    }
  }, [report])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !inspectorOpen) onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, onClose, inspectorOpen])

  if (!isOpen) return null

  const rowCount = datasetMeta?.rowCount || 1240
  const colCount = datasetMeta?.columns?.length || datasetMeta?.colCount || 12

  const hasIssues = Boolean(
    report?.missingValues?.length ||
    report?.formatErrors?.length ||
    report?.duplicateRows?.length
  )

  const handleApplyAllFills = (fillVal: string) => {
    const updated = { ...missingFillValues }
    report?.missingValues?.forEach((item) => {
      const type = getColumnType(item)
      if (fillVal === "__SMART_AUTO__") {
        updated[item.columnName] = getDefaultFillForType(type)
      } else {
        if (type === "text" && (fillVal === "NaN" || fillVal === "NaT")) {
          updated[item.columnName] = "null"
        } else if (type === "numeric" && fillVal === "NaT") {
          updated[item.columnName] = "NaN"
        } else if (type === "date" && fillVal === "NaN") {
          updated[item.columnName] = "NaT"
        } else {
          updated[item.columnName] = fillVal
        }
      }
    })
    setMissingFillValues(updated)
  }

  const handleApplyClean = () => {
    const normalizedFills: Record<string, string> = {}
    const excludedCols: string[] = []
    Object.entries(missingFillValues).forEach(([col, val]) => {
      if (val === "__EXCLUDE__") {
        excludedCols.push(col)
      } else {
        normalizedFills[col] = val.trim() || "null"
      }
    })
    const decisions: CleaningDecisions = {
      missingFillValues: normalizedFills,
      selectedFormats,
      removedDuplicateRowIndices,
      duplicateRowsAction,
      excludedColumns: excludedCols,
    }
    if (onApplyCleaning) {
      onApplyCleaning(decisions)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Main Data Cleaning Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1e2026] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 pb-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-zinc-800 text-[#4a7ff7] dark:text-[#60a5fa] border border-blue-100 dark:border-zinc-700 shadow-2xs">
                <Sparkles className="size-5 text-[#e99842]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    Data Cleaning Studio
                  </h3>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                    Review &amp; Apply
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Review proposed normalization, format conversions, and duplicate resolution before applying.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Dataset Summary */}
          <div className="px-4 sm:px-5 py-2.5 bg-slate-50 dark:bg-[#252831] border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 truncate">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300 truncate">
                <Database className="size-3.5 text-[#4a7ff7] shrink-0" />
                <span className="font-semibold truncate">{datasetMeta?.name || "Uploaded Dataset"}</span>
              </div>
              <span className="text-slate-300 dark:text-zinc-600">&bull;</span>
              <span className="text-slate-500 dark:text-zinc-400 font-medium shrink-0">
                {rowCount.toLocaleString()} rows &bull; {colCount} cols
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setInspectorTargetCol(undefined)
                setInspectorActiveIssue(null)
                setInspectorViewMode("all")
                setInspectorOpen(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-zinc-100 hover:bg-slate-50 hover:border-[#4a7ff7] shadow-2xs cursor-pointer transition-all"
            >
              <Table className="size-3.5 text-[#4a7ff7]" />
              <span>Inspect Table</span>
            </button>
          </div>

          {/* Scrollable Content: 3 Detailed Cleaning Sections */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {!hasIssues ? (
              <CleanAlert />
            ) : (
              <>
                {/* 1. Missing Values Cleaning Section */}
                {Boolean(report?.missingValues?.length) && (
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/15 p-4 text-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20 text-[#e99842]">
                        <FileSpreadsheet className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                          1. Missing Values Normalization
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {report?.missingValues?.map((item) => {
                        const colType = getColumnType(item)
                        const presets = PRESETS_BY_TYPE[colType] || PRESETS_BY_TYPE.text
                        const stats = getMissingStats(item, rowCount, missingThreshold)
                        const currentVal =
                          missingFillValues[item.columnName] ?? getDefaultFillForType(colType, item.defaultFill)
                        const isExcluded = currentVal === "__EXCLUDE__"

                        return (
                          <div
                            key={item.columnName}
                            className={`rounded-xl border p-3 text-xs shadow-2xs transition-all ${
                              isExcluded
                                ? "border-rose-300 bg-rose-50/40 dark:bg-rose-950/20 opacity-80"
                                : stats.isExceeded
                                ? "border-amber-300 bg-white dark:bg-[#252831]"
                                : "border-amber-200/90 bg-white dark:bg-[#252831]"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`size-2 rounded-full ${isExcluded ? "bg-rose-500" : stats.isExceeded ? "bg-rose-500" : "bg-[#e99842]"}`} />
                                <span className={`font-mono font-bold ${isExcluded ? "line-through text-slate-400" : "text-slate-900 dark:text-zinc-100"}`}>
                                  {item.columnName}
                                </span>
                                <span className="rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                                  {colType}
                                </span>
                                <span className="rounded bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50">
                                  {item.count} missing ({stats.percentage}%)
                                </span>
                                {stats.isExceeded && (
                                  <span className="inline-flex items-center gap-1 rounded bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.5 text-[9px] font-bold text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                    <AlertTriangle className="size-2.5 text-rose-600" />
                                    Exceeds {missingThreshold}% threshold
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setInspectorTargetCol(item.columnName)
                                  setInspectorViewMode("missing")
                                  setInspectorActiveIssue({
                                    type: "missing",
                                    column: item.columnName,
                                    targetRowIndex: 0,
                                  })
                                  setInspectorOpen(true)
                                }}
                                className="inline-flex items-center gap-1 rounded-md border border-amber-300 dark:border-amber-600/60 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer shadow-2xs"
                              >
                                <Table className="size-3 text-amber-600 dark:text-amber-400" />
                                <span>Inspect Rows</span>
                              </button>
                            </div>

                            {/* Preset Selection */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 mr-1">Normalize To:</span>
                              {presets.map((preset) => {
                                const isPresetMatch = preset.value.toLowerCase() === (currentVal || "").toLowerCase()
                                const isSelected = !isExcluded && !customModeCols[item.columnName] && isPresetMatch
                                return (
                                  <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => {
                                      setCustomModeCols((prev) => ({ ...prev, [item.columnName]: false }))
                                      setMissingFillValues((prev) => ({ ...prev, [item.columnName]: preset.value }))
                                    }}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs font-semibold cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-[#4a7ff7] text-white shadow-xs"
                                        : "border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    {isSelected && <Check className="size-3" />}
                                    <span>{preset.label}</span>
                                  </button>
                                )
                              })}

                              {/* Custom Value Option */}
                              {customModeCols[item.columnName] ? (
                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#4a7ff7] bg-white dark:bg-zinc-800 px-2 py-0.5 shadow-xs">
                                  <Edit3 className="size-3 text-[#4a7ff7]" />
                                  <input
                                    type="text"
                                    placeholder="Type value..."
                                    value={currentVal ?? ""}
                                    autoFocus
                                    onChange={(e) =>
                                      setMissingFillValues((prev) => ({ ...prev, [item.columnName]: e.target.value }))
                                    }
                                    className="bg-transparent font-mono text-xs text-slate-800 dark:text-zinc-100 outline-none w-24 sm:w-28"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCustomModeCols((prev) => ({ ...prev, [item.columnName]: false }))
                                    }
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer p-0.5"
                                    title="Close custom input"
                                  >
                                    <X className="size-3" />
                                  </button>
                                </div>
                              ) : (
                                (() => {
                                  const isCustomVal =
                                    !presets.some((p) => p.value.toLowerCase() === (currentVal || "").toLowerCase()) &&
                                    currentVal !== undefined &&
                                    currentVal !== ""
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCustomModeCols((prev) => ({ ...prev, [item.columnName]: true }))
                                        if (presets.some((p) => p.value.toLowerCase() === (currentVal || "").toLowerCase())) {
                                          setMissingFillValues((prev) => ({ ...prev, [item.columnName]: "" }))
                                        }
                                      }}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs font-semibold cursor-pointer transition-all ${
                                        isCustomVal
                                          ? "bg-[#4a7ff7] text-white shadow-xs"
                                          : "border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 hover:border-[#4a7ff7]"
                                      }`}
                                      title="Enter a custom placeholder value"
                                    >
                                      {isCustomVal ? (
                                        <>
                                          <Check className="size-3" />
                                          <span>&ldquo;{currentVal}&rdquo;</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="size-3" />
                                          <span>Custom Value</span>
                                        </>
                                      )}
                                    </button>
                                  )
                                })()
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Wrong Format with Live Conversion Preview */}
                {Boolean(report?.formatErrors?.length) && (
                  <div className="rounded-2xl border border-blue-200 dark:border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/15 p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-[#4a7ff7]">
                          <AlertTriangle className="size-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-sky-300">
                            2. Format Standardization &amp; Conversion Preview
                          </h4>
                          <p className="text-[11px] text-blue-800 dark:text-zinc-300 font-medium">
                            Choose desired target format. Review conversion previews before confirming.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {report?.formatErrors?.map((item) => {
                        const activeFormatId = selectedFormats[item.columnName] ?? (item.selectedFormat || item.detectedFormats[0]?.id)
                        const activeFormat = item.detectedFormats.find((f) => f.id === activeFormatId) || item.detectedFormats[0]

                        // Generate sample conversion previews
                        const previewSamples = item.columnName.toLowerCase().includes("charge")
                          ? [
                              { original: "$89.50", target: "89.50", safe: true },
                              { original: "9 usd", target: "9.00", safe: true },
                              { original: "$124.50", target: "124.50", safe: true },
                              { original: "N/A Text", target: "Unsafe / Flagged", safe: false },
                            ]
                          : [
                              { original: "15/03/2026", target: "2026-03-15", safe: true },
                              { original: "03/16/2026", target: "2026-03-16", safe: true },
                              { original: "17/03/2026", target: "2026-03-17", safe: true },
                              { original: "InvalidDate", target: "Unsafe / Flagged", safe: false },
                            ]

                        return (
                          <div
                            key={item.columnName}
                            className="rounded-xl border border-blue-200/90 dark:border-zinc-700 bg-white dark:bg-[#252831] p-3 text-xs shadow-2xs space-y-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <span className="size-2 rounded-full bg-[#4a7ff7]" />
                              <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">{item.columnName}</span>
                            </div>

                            {/* Selectable Target Formats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {item.detectedFormats.map((format) => {
                                const isSelected = activeFormatId === format.id

                                return (
                                  <button
                                    key={format.id}
                                    type="button"
                                    onClick={() => setSelectedFormats((prev) => ({ ...prev, [item.columnName]: format.id }))}
                                    className={`flex flex-col items-start p-3 rounded-xl border text-left cursor-pointer transition-all ${
                                      isSelected
                                        ? "border-[#4a7ff7] bg-blue-50/90 dark:bg-[#4a7ff7]/15 ring-2 ring-[#4a7ff7]/60 shadow-xs"
                                        : "border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-800/70 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between w-full mb-2">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`flex size-4 items-center justify-center rounded-full border shrink-0 transition-colors ${
                                            isSelected
                                              ? "border-[#4a7ff7] bg-[#4a7ff7] text-white"
                                              : "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
                                          }`}
                                        >
                                          {isSelected && <Check className="size-2.5 stroke-[3]" />}
                                        </span>
                                        <span className={`font-mono text-xs font-bold ${
                                          isSelected
                                            ? "text-[#1d4ed8] dark:text-[#60a5fa]"
                                            : "text-slate-800 dark:text-zinc-100"
                                        }`}>
                                          {format.label}
                                        </span>
                                      </div>
                                      {format.frequency && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                          isSelected
                                            ? "bg-[#4a7ff7]/15 text-[#2563eb] dark:text-[#93c5fd]"
                                            : "bg-slate-200/70 dark:bg-zinc-700/80 text-slate-600 dark:text-zinc-300"
                                        }`}>
                                          {format.frequency}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] font-mono pl-6 flex items-center gap-1.5 flex-wrap">
                                      <span className={isSelected ? "text-slate-600 dark:text-zinc-400 font-medium" : "text-slate-500 dark:text-zinc-400 font-medium"}>
                                        Sample:
                                      </span>
                                      <strong className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                                        isSelected
                                          ? "bg-white/90 dark:bg-zinc-900/90 text-[#1d4ed8] dark:text-[#93c5fd] border border-blue-200 dark:border-blue-800/80"
                                          : "bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700"
                                      }`}>
                                        {format.example}
                                      </strong>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Duplicate Rows Resolution */}
                {Boolean(report?.duplicateRows?.length) && (
                  <div className="rounded-xl border border-rose-200 dark:border-rose-500/40 bg-rose-50/40 dark:bg-rose-950/15 p-3.5 sm:p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-900 dark:text-rose-300 font-bold">
                        <Copy className="size-4 text-rose-600" />
                        <span className="uppercase tracking-wider">3. Duplicate Rows ({report?.duplicateRows?.length || 0})</span>
                      </div>

                      {(report?.duplicateRows?.length || 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const allIndices = report?.duplicateRows?.map((r) => r.rowIndex) || []
                            const allSelected = removedDuplicateRowIndices.length === allIndices.length
                            if (allSelected) {
                              setRemovedDuplicateRowIndices([])
                              setDuplicateRowsAction("keep_all")
                            } else {
                              setRemovedDuplicateRowIndices(allIndices)
                              setDuplicateRowsAction("remove_duplicates")
                            }
                          }}
                          className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          {removedDuplicateRowIndices.length === (report?.duplicateRows?.length || 0)
                            ? "Keep All"
                            : "Delete All"}
                        </button>
                      )}
                    </div>

                    {/* Simple list: just show the duplicate row and the option to delete it */}
                    <div className="space-y-2">
                      {report?.duplicateRows?.map((rowItem) => {
                        const isSelectedForRemoval = removedDuplicateRowIndices.includes(rowItem.rowIndex)

                        return (
                          <div
                            key={rowItem.id}
                            className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-xs transition-all ${
                              isSelectedForRemoval
                                ? "border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#252831]"
                                : "border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-800/40 opacity-80"
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="size-2 rounded-full bg-rose-500" />
                              <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
                                Row #{rowItem.rowIndex}
                              </span>
                              <span className="text-slate-400 text-[11px]">
                                (Duplicates Row #{rowItem.duplicateOfIndex})
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setRemovedDuplicateRowIndices((prev) =>
                                  prev.includes(rowItem.rowIndex)
                                    ? prev.filter((idx) => idx !== rowItem.rowIndex)
                                    : [...prev, rowItem.rowIndex]
                                )
                                setDuplicateRowsAction("remove_duplicates")
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isSelectedForRemoval
                                  ? "bg-rose-600 text-white hover:bg-rose-700 shadow-2xs"
                                  : "border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                              }`}
                            >
                              <Trash2 className="size-3.5" />
                              <span>{isSelectedForRemoval ? "Delete Row" : "Keep Row"}</span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}


              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#1a1c22] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onBack || onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs"
            >
              {onBack && <ArrowLeft className="size-3.5" />}
              <span>{onBack ? "Back to Issues" : "Cancel"}</span>
            </button>

            <button
              type="button"
              onClick={handleApplyClean}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] px-5 py-2 text-xs font-semibold text-white shadow-sm cursor-pointer transition-all active:scale-[0.98]"
            >
              <Sparkles className="size-3.5 text-[#e99842]" />
              <span>Apply Cleaning &amp; Continue</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>

      {/* Dataset Popup Window - Editable table in Data Cleaning */}
      <DatasetErrorInspectorModal
        isOpen={inspectorOpen}
        onClose={() => {
          setInspectorOpen(false)
          setInspectorActiveIssue(null)
        }}
        datasetName={datasetMeta?.name}
        initialTargetColumn={inspectorTargetCol}
        initialActiveIssue={inspectorActiveIssue}
        initialViewMode={inspectorViewMode}
        report={report}
        datasetMeta={datasetMeta}
        allowCellEditing={true}
      />
    </div>
  )
}

export default DataValidationModal
