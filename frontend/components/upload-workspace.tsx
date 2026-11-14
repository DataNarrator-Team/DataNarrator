"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Database,
  RefreshCw,
  Layers,
  HelpCircle,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Check,
  Plus,
  Table,
  Eye,
} from "lucide-react"
import { DatasetErrorInspectorModal } from "@/components/dataset-error-inspector-modal"
import { DecorativeBackground } from "@/components/decorative-background"
import { AppFooter } from "@/components/app-footer"
import { ErrorModal } from "@/components/error-modal"
import DataValidationModal, { DataCleaningModal, CleaningDecisions, ValidationReport } from "@/components/data-validation-modal"
import { ColumnRecommendationStep } from "@/components/column-recommendation-step"
import { AnalysisType } from "@/components/analysis-type"
import { resolveDynamicChartRecommendation } from "@/components/chart-selection-step"
import { StoryDashboard } from "@/components/story-dashboard"
import { DATASET_REGISTRY, DatasetMeta, ColumnDefinition } from "@/lib/dataset-models"
import { datasetApi, analysisApi, ANALYSIS_TYPE_MAP } from "@/lib/api"
import {
  buildDatasetMetaFromBackend,
  buildValidationReportFromBackend,
  applyAiColumnRecommendation,
  mapCleaningToStrategies,
  backendTypeToFrontendId,
} from "@/lib/backend-mappers"

// ==============================================================================
// 1. Data Cleaning & Re-validation Helper Functions
// Following Single Responsibility Principle (each function handles one specific task)
// ==============================================================================

/**
 * Pure function responsible strictly for modifying column schema according to user decisions:
 * - Renames duplicate columns (Case 1: Same name, distinct contents)
 * - Merges overlapping columns and fills missing values non-destructively (Case 2: Complementary Data)
 * - Purges redundant identical duplicate columns upon user consent (Case 3: 100% exact match)
 * - Excludes columns exceeding maximum allowed missing value threshold
 */
function applyCleaningDecisionsToColumns(
  currentColumns: ColumnDefinition[],
  decisions: CleaningDecisions,
  validationReport?: ValidationReport
): ColumnDefinition[] {
  let updatedColumns = [...currentColumns]

  // Exclude columns exceeding missing value threshold if chosen by user
  if (decisions.excludedColumns && decisions.excludedColumns.length > 0) {
    updatedColumns = updatedColumns.filter(
      (col) => !decisions.excludedColumns!.includes(col.name)
    )
  }

  return updatedColumns
}

/**
 * Pure function responsible strictly for re-validating the dataset after applying cleaning modifications:
 * Verifies that all flagged errors are resolved and generates a certified clean report.
 */
function revalidateDatasetAfterCleaning(
  prevReport: ValidationReport,
  decisions: CleaningDecisions
): ValidationReport {
  return {
    ...prevReport,
    missingValues: [],
    formatErrors: [],
    duplicateRows: [],
    isCleaned: true,
    cleaningSummary: decisions,
  }
}

const ALLOWED_EXTS = [".csv", ".xlsx", ".xls"]

function getFileExtension(name: string) {
  const dot = name.lastIndexOf(".")
  return dot === -1 ? "" : name.slice(dot).toLowerCase()
}

function isFileSupported(name: string) {
  return ALLOWED_EXTS.includes(getFileExtension(name))
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes"
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${sizes[i]}`
}

// ==============================================================================
// 🟢 START DEMO / SIMULATION CODE [Will be replaced with backend API integration]
// Simulated dataset quality report generation & column metadata resolution
// When integrated with backend, this logic will be provided by backend validation API
// ==============================================================================
function createReport(name: string): ValidationReport {
  if (name.includes("Global_Sales")) {
    return {
      missingValues: [
        { columnName: "Customer_Postal_Code", count: 42, dataType: "text", defaultFill: "mode" },
        { columnName: "Discount_Rate", count: 18, dataType: "numeric", defaultFill: "mean" },
      ],
      formatErrors: [
        {
          columnName: "Order_Date",
          count: 7,
          detail: "Mixed date notations detected in transaction rows",
          detectedFormats: [
            { id: "iso", label: "YYYY-MM-DD", example: "2026-03-15", frequency: "82% rows" },
            { id: "eu", label: "DD/MM/YYYY", example: "15/03/2026", frequency: "14% rows" },
            { id: "us", label: "MM/DD/YYYY", example: "03/15/2026", frequency: "4% rows" },
          ],
        },
      ],
      duplicateRows: [
        {
          id: "dup-row-18",
          rowIndex: 18,
          duplicateOfIndex: 4,
          matchType: "exact",
          matchRate: "100%",
          rowData: {
            Order_ID: "ORD-9481",
            Customer_Postal_Code: "94103",
            Product_Category: "Technology",
            Discount_Rate: "0.15",
          },
          reason: "Exact duplicate transaction row matching Row #4",
        },
      ],

    }
  }

  if (name.includes("Customer_Retention")) {
    return {
      missingValues: [
        {
          columnName: "Churn_Reason",
          count: 124,
          dataType: "text",
          defaultFill: "mode",
          percentage: 35,
          isExceededLimit: true,
          limitThreshold: 20,
        },
        {
          columnName: "Active_Subscribers",
          count: 8,
          dataType: "numeric",
          defaultFill: "mean",
          percentage: 2,
          isExceededLimit: false,
          limitThreshold: 20,
        },
      ],
      formatErrors: [
        {
          columnName: "Monthly_Charges",
          count: 12,
          detail: "Currency symbols ($) mixed with pure numeric values",
          detectedFormats: [
            { id: "float", label: "Pure Numeric Float (124.50)", example: "124.50", frequency: "88% rows" },
            { id: "currency", label: "Currency Prefixed ($124.50)", example: "$124.50", frequency: "12% rows" },
          ],
        },
      ],
      duplicateRows: [
        {
          id: "dup-row-22",
          rowIndex: 22,
          duplicateOfIndex: 5,
          matchType: "exact",
          matchRate: "100%",
          rowData: {
            User_ID: "USR-1022",
            Plan: "Premium",
            Monthly_Charges: "$124.50",
            Cohort_Month: "2026-03",
          },
          reason: "Exact duplicate record with identical values to Row #5",
        },
      ],

    }
  }

  if (name.includes("Marketing_Campaign")) {
    return {
      missingValues: [],
      formatErrors: [],
      duplicateRows: [],
      isCleaned: true,
    }
  }

  return {
    missingValues: [
      { columnName: "Metric_Value", count: 15, dataType: "numeric", defaultFill: "mean" },
      { columnName: "Category_Tag", count: 6, dataType: "text", defaultFill: "mode" },
    ],
    formatErrors: [
      {
        columnName: "Date_Stamp",
        count: 3,
        detail: "Mixed date formats detected across uploaded rows",
        detectedFormats: [
          { id: "iso", label: "YYYY-MM-DD", example: "2026-05-18", frequency: "85% rows" },
          { id: "slashed", label: "DD/MM/YYYY", example: "18/05/2026", frequency: "15% rows" },
        ],
      },
    ],
    duplicateRows: [
      {
        id: "dup-row-14",
        rowIndex: 14,
        duplicateOfIndex: 3,
        matchType: "exact",
        matchRate: "100%",
        rowData: {
          Record_ID: "REC-4019",
          Category_Tag: "Standard",
          Metric_Value: "182.4",
        },
        reason: "Exact duplicate entry identical to Row #3",
      },
    ],

  }
}

// Helper to find or construct dataset metadata
function resolveDatasetMeta(file: any, customCols?: string[]): DatasetMeta {
  if (file.name.includes("Global_Sales")) {
    return { ...DATASET_REGISTRY.global_sales }
  }
  if (file.name.includes("Customer_Retention")) {
    return { ...DATASET_REGISTRY.customer_retention }
  }
  if (file.name.includes("Marketing_Campaign")) {
    return { ...DATASET_REGISTRY.marketing_roi }
  }

  // Fallback for custom user uploaded files
  let columns: ColumnDefinition[] = []

  if (customCols && customCols.length > 0) {
    columns = customCols.slice(0, 8).map((colName, idx) => ({
      name: colName.trim().replace(/^["']|["']$/g, ""),
      isAiPick: idx < 4,
      reason: idx === 0 ? "Detected primary chronological dimension" : idx === 1 ? "Discovered categorical segment" : "Analyzed continuous numeric metric",
      dataType: idx === 0 ? "date" : idx === 1 ? "category" : "numeric",
    }))
  } else {
    columns = [
      { name: "Period_Date", isAiPick: true, reason: "Inferred timeline field", dataType: "date" },
      { name: "Segment_Category", isAiPick: true, reason: "Categorical classification", dataType: "category" },
      { name: "Value_Metric", isAiPick: true, reason: "Primary numeric performance metric", dataType: "numeric" },
      { name: "Volume_Count", isAiPick: true, reason: "Observed volume quantity", dataType: "numeric" },
      { name: "Reference_ID", isAiPick: false, reason: "Unique row identifier", dataType: "identifier" },
      { name: "Record_ID_Copy", isAiPick: false, reason: "Duplicate record header (requires renaming)", dataType: "identifier" },
      { name: "Alt_Record_ID", isAiPick: false, reason: "Overlapping reference ID (requires merge)", dataType: "identifier" },
    ]
  }

  return {
    id: "custom_" + Date.now(),
    name: file.name,
    size: file.size || "1.2 MB",
    type: file.type || "CSV",
    rowCount: file.rowCount || 1240,
    colCount: columns.length,
    desc: `User uploaded dataset: ${file.name}`,
    recommendedAnalysisId: "trend",
    analysisReason: `AI detected ${columns[0]?.name || "Period_Date"} and ${columns[2]?.name || "Value_Metric"} as key indicators.`,
    columns,
  }
}
// ==============================================================================
// 🔴 END DEMO / SIMULATION CODE
// ==============================================================================

// ==========================================
// 2. View Components
// ==========================================

// Top Header Bar
function WorkspaceHeader({
  onNewProject,
  currentStep,
  onBack,
}: {
  onNewProject?: () => void
  currentStep?: number
  onBack?: () => void
}) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/80 px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors shadow-2xs"
          title="Back"
        >
          <ArrowLeft className="size-3.5 text-slate-500 dark:text-zinc-400" />
          <span>Back</span>
        </button>
        {currentStep && currentStep > 1 && onNewProject && (
          <button
            type="button"
            onClick={onNewProject}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors shadow-2xs"
            title="Start new project or upload different dataset"
          >
            <Plus className="size-3 text-[#4a7ff7]" />
            <span>New Dataset</span>
          </button>
        )}
      </div>
      {/* Reserved spacing for unified top-right user menu */}
      <div className="w-36" />
    </header>
  )
}

// Notice banner displayed after successful cleaning or re-validation
function NoticeBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/90 dark:bg-emerald-950/40 p-3.5 text-xs text-emerald-800 dark:text-emerald-200 shadow-sm">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span className="font-medium">{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-200 cursor-pointer transition-colors"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

// File dropzone area view
function DropzoneView({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpenDialog,
}: {
  isDragging: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onOpenDialog: () => void
}) {
  return (
    <div className="mt-7">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-10 ${
          isDragging ? "scale-[1.01] border-[#4a7ff7] bg-[#4a7ff7]/5 dark:bg-[#4a7ff7]/10" : "border-slate-300/80 dark:border-zinc-600/80 bg-white/50 dark:bg-[#252831]/70"
        }`}
      >
        <div
          className={`mb-4 flex size-14 items-center justify-center rounded-2xl transition-all ${
            isDragging ? "scale-110 bg-[#4a7ff7] text-white shadow-md shadow-[#4a7ff7]/25" : "bg-[#4a7ff7]/10 text-[#4a7ff7]"
          }`}
        >
          <UploadCloud className="size-7" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
          {isDragging ? <span className="text-[#4a7ff7] dark:text-[#60a5fa]">Release to drop dataset</span> : "Drag & drop dataset here"}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Maximum file size: 50MB • Encrypted and processed locally</p>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onOpenDialog}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#4a7ff7] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3870ec] active:scale-95 cursor-pointer"
        >
          <UploadCloud className="size-4" />
          Upload File
        </button>
      </div>
    </div>
  )
}

// Upload progress bar card
function ProgressCard({
  file,
  progress,
  onCancel,
}: {
  file: { name: string; size: string; type: string }
  progress: number
  onCancel: () => void
}) {
  return (
    <div className="mt-7 rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/90 dark:bg-[#252831] p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#4a7ff7]/10 text-[#4a7ff7]">
            <FileSpreadsheet className="size-6 animate-pulse" />
          </div>
          <div>
            <h4 className="max-w-xs truncate text-sm font-semibold text-slate-800 dark:text-zinc-200 sm:max-w-sm">{file.name}</h4>
            <p className="text-xs text-slate-400 dark:text-zinc-500">{file.size} • {file.type} file</p>
          </div>
        </div>
        <button type="button" onClick={onCancel} className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer">
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-[#4a7ff7] dark:text-[#60a5fa]">
            <span className="size-2 animate-ping rounded-full bg-[#4a7ff7]" />
            Uploading & parsing schema...
          </span>
          <span className="font-mono text-slate-600 dark:text-zinc-400">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
          <div className="h-full rounded-full bg-[#4a7ff7] transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 text-xs text-slate-400 dark:text-zinc-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          Automated delimiter detection active
        </span>
        <button type="button" onClick={onCancel} className="font-medium text-slate-500 dark:text-zinc-400 hover:text-rose-600 cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  )
}

// Success card with dataset summary, detected issues overview, and action controls
function SuccessCard({
  file,
  report,
  onReset,
  onOpenPreview,
  onOpenCleaning,
  onContinue,
  onViewCleanedDataset,
}: {
  file: { name: string; size: string; rowCount?: number; colCount?: number }
  report?: any
  onReset: () => void
  onOpenPreview: () => void
  onOpenCleaning?: () => void
  onContinue: () => void
  onViewCleanedDataset?: () => void
}) {
  const hasIssues = !report?.isCleaned && Boolean(
    report?.missingValues?.length ||
    report?.formatErrors?.length ||
    report?.duplicateRows?.length
  )

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-zinc-700 shadow-2xs">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">{file.name}</h4>
              <p className="text-xs text-slate-400 dark:text-zinc-400">
                {file.size} • Uploaded successfully
              </p>
            </div>
          </div>

          {report?.isCleaned ? (
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-600/50 shadow-2xs flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
              <span>Cleaned &amp; Standardized</span>
            </span>
          ) : hasIssues ? (
            <span className="rounded-full bg-amber-50 dark:bg-amber-500/15 px-3 py-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 shadow-2xs">
              Quality Flags Detected
            </span>
          ) : (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer shadow-2xs"
            >
              <RefreshCw className="size-3.5 text-slate-400" />
              <span>Replace file</span>
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50/80 dark:bg-zinc-800/60 p-3.5 border border-slate-100/70 dark:border-zinc-700/60">
            <span className="block text-[11px] font-semibold text-slate-400 dark:text-zinc-500">Rows</span>
            <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">{file.rowCount?.toLocaleString() || "1,840"}</span>
          </div>
          <div className="rounded-xl bg-slate-50/80 dark:bg-zinc-800/60 p-3.5 border border-slate-100/70 dark:border-zinc-700/60">
            <span className="block text-[11px] font-semibold text-slate-400 dark:text-zinc-500">Columns</span>
            <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">{file.colCount || "14"}</span>
          </div>
          <div className="rounded-xl bg-slate-50/80 dark:bg-zinc-800/60 p-3.5 border border-slate-100/70 dark:border-zinc-700/60">
            <span className="block text-[11px] font-semibold text-slate-400 dark:text-zinc-500">Encoding</span>
            <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">UTF-8</span>
          </div>
        </div>

        {/* Automated Quality Issues Inspection: Missing Values, Wrong Format, Duplicated Columns */}
        {hasIssues ? (
          <div className="mt-4 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 bg-slate-50/50 dark:bg-zinc-800/40 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-700/60 pb-2.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300">
                <AlertTriangle className="size-4 text-[#e99842]" />
                Data Quality & Detected Issues
              </span>
              <button
                type="button"
                onClick={onOpenPreview}
                className="text-xs font-bold text-[#4a7ff7] dark:text-[#60a5fa] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View Full Report</span>
                <span>→</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* 1. Missing Values */}
              <div className="rounded-xl bg-white dark:bg-zinc-800 p-3 border border-amber-200/70 dark:border-amber-800/40 shadow-2xs">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#e99842]" /> MISSING VALUES
                </span>
                {report?.missingValues?.length > 0 ? (
                  <div className="space-y-1.5">
                    {report.missingValues.map((m: any) => (
                      <div key={m.columnName} className="font-mono text-[11px] text-slate-700 dark:text-zinc-300 flex justify-between gap-1">
                        <span className="font-medium text-slate-800 dark:text-zinc-200 truncate" title={m.columnName}>{m.columnName}</span>
                        <span className="text-amber-800 dark:text-amber-400 font-bold shrink-0">{m.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">None detected</span>
                )}
              </div>

              {/* 2. Wrong Format */}
              <div className="rounded-xl bg-white dark:bg-zinc-800 p-3 border border-blue-200/70 dark:border-blue-800/40 shadow-2xs">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#4a7ff7]" /> WRONG FORMAT
                </span>
                {report?.formatErrors?.length > 0 ? (
                  <div className="space-y-1.5">
                    {report.formatErrors.map((f: any) => (
                      <div key={f.columnName} className="font-mono text-[11px] text-slate-700 dark:text-zinc-300 flex justify-between gap-1">
                        <span className="font-medium text-slate-800 dark:text-zinc-200 truncate" title={f.columnName}>{f.columnName}</span>
                        <span className="text-blue-800 dark:text-blue-400 font-bold shrink-0">{f.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">None detected</span>
                )}
              </div>

              {/* 3. Duplicate Rows */}
              <div className="rounded-xl bg-white dark:bg-zinc-800 p-3 border border-rose-200/70 dark:border-rose-800/40 shadow-2xs">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400 mb-2 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-rose-500" /> DUPLICATE ROWS
                </span>
                {report?.duplicateRows?.length > 0 ? (
                  <div className="space-y-1.5">
                    {report.duplicateRows.map((item: any, idx: number) => (
                      <div key={idx} className="font-mono text-[11px] text-rose-700 dark:text-rose-400 font-medium truncate">
                        • Row #{item.rowIndex} <span className="text-[10px] text-slate-400 font-sans">(Duplicates Row #{item.duplicateOfIndex})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">None detected</span>
                )}
              </div>


            </div>
          </div>
        ) : report?.isCleaned ? (
          <div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 space-y-3 text-xs shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Dataset Cleaned &amp; Standardized</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onViewCleanedDataset || onOpenPreview}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs cursor-pointer transition-all active:scale-95"
                >
                  <Table className="size-3.5" />
                  <span>View Cleaned Dataset</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenCleaning || onOpenPreview}
                  className="text-[11px] font-semibold text-[#4a7ff7] dark:text-[#60a5fa] hover:underline cursor-pointer"
                >
                  Review Rules
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-zinc-300 pt-1 border-t border-emerald-200/50 dark:border-emerald-800/40 font-medium">
              <span>✓ Missing unified (mode / mean)</span>
              <span>✓ Target formats standardized</span>
              <span>✓ Duplicates purged (rows)</span>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-zinc-800 p-3.5 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-zinc-100 font-semibold shadow-2xs">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>All columns and rows validated clean. Ready for analysis!</span>
          </div>
        )}
      </div>

      {/* Actions Section: Continue (Skip Cleaning by default) + Optional Clean Data Studio */}
      {report?.isCleaned ? (
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onViewCleanedDataset || onOpenPreview}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 py-3.5 px-4 text-xs font-bold text-emerald-800 dark:text-emerald-200 shadow-sm hover:bg-emerald-100 cursor-pointer transition-all active:scale-[0.99]"
          >
            <Table className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>View Cleaned Dataset</span>
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:flex-[2] flex items-center justify-center gap-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] py-3.5 px-6 text-sm font-bold text-white shadow-md active:scale-[0.99] cursor-pointer transition-all"
          >
            <Sparkles className="size-4 text-[#e99842]" />
            <span>Continue to Column Selection</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      ) : hasIssues ? (
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          {/* 1. Explicit User Decision Step: Proceed despite issues without cleaning (Skip) */}
          <button
            type="button"
            onClick={onContinue}
            title="Proceed with current raw dataset without cleaning"
            className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-700 active:scale-[0.99] cursor-pointer transition-all"
          >
            <span>Proceed with Warnings (Skip Cleaning)</span>
          </button>

          {/* 2. Interactive data cleaning studio (Clean Data - Primary) */}
          <button
            type="button"
            onClick={onOpenCleaning || onOpenPreview}
            title="Clean, standardize, and resolve detected issues before continuing"
            className="w-full sm:flex-[2] inline-flex items-center justify-center gap-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] py-3.5 px-6 text-sm font-bold text-white shadow-md active:scale-[0.99] cursor-pointer transition-all"
          >
            <Sparkles className="size-4 text-[#e99842]" />
            <span>Clean Data</span>
            <ArrowRight className="size-4" />
          </button>

          {/* 3. Replace file option */}
          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-3.5 px-3.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
            title="Replace Dataset"
          >
            <RefreshCw className="size-3.5 text-slate-400" />
            <span className="sm:hidden">Replace File</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a7ff7] py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3870ec] active:scale-[0.99] cursor-pointer transition-colors"
        >
          <Sparkles className="size-4 text-[#e99842]" />
          <span>Continue to Column Selection</span>
          <ArrowRight className="size-4" />
        </button>
      )}
    </div>
  )
}

// Sample Datasets Section
function SampleDatasetsSection({ onSelect }: { onSelect: (sample: any) => void }) {
  const SAMPLES = [
    DATASET_REGISTRY.global_sales,
    DATASET_REGISTRY.customer_retention,
    DATASET_REGISTRY.marketing_roi,
  ]

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Or test with sample datasets</span>
        <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500"><HelpCircle className="size-3.5" /> 1-Click Load</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {SAMPLES.map((sample) => (
          <button
            key={sample.name}
            type="button"
            onClick={() => onSelect(sample)}
            className="group relative flex flex-col items-start rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/80 dark:bg-[#252831] p-4 text-left shadow-sm backdrop-blur-sm transition hover:border-[#4a7ff7]/50 hover:bg-white dark:hover:bg-[#2c303a] hover:shadow-md cursor-pointer overflow-hidden"
          >
            {sample.id === "marketing_roi" && (
              <span className="absolute top-3 right-3 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-600/50 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 shadow-2xs">
                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                <span>Clean</span>
              </span>
            )}
            <div className="mb-2 flex w-full items-center justify-between">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#4a7ff7]/10 text-[#4a7ff7] group-hover:bg-[#4a7ff7] group-hover:text-white">
                <FileSpreadsheet className="size-4" />
              </span>
              <span className={`rounded-full bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 ${sample.id === "marketing_roi" ? "mr-16" : ""}`}>{sample.type}</span>
            </div>
            <h3 className="line-clamp-1 text-xs font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-[#4a7ff7] dark:group-hover:text-[#60a5fa]">{sample.name}</h3>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500 dark:text-zinc-400">{sample.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// 3. Main Container Component (UploadWorkspace)
// ==========================================

export function UploadWorkspace({ userName = "Shahad Saif" }: { userName?: string }) {
  const router = useRouter()
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth()

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace("/")
    }
  }, [isAuthLoading, isLoggedIn, router])

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [activeDataset, setActiveDataset] = useState<DatasetMeta | null>(null)
  const [confirmedColumns, setConfirmedColumns] = useState<string[]>([])
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<string>("")
  const [selectedChartType, setSelectedChartType] = useState<string>("")

  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "complete">("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadNotice, setUploadNotice] = useState<string | null>(null)
  const [modalState, setModalState] = useState({ isOpen: false, title: "", message: "" })
  const [isValidationOpen, setIsValidationOpen] = useState(false)
  const [isCleaningOpen, setIsCleaningOpen] = useState(false)
  const [isCleanedViewerOpen, setIsCleanedViewerOpen] = useState(false)
  const [validationReport, setValidationReport] = useState<any>({ missingValues: [], formatErrors: [], duplicateRows: [] })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    function handleNewProjectEvent() {
      handleReset()
    }
    window.addEventListener("datanarrator:new-project", handleNewProjectEvent)
    return () => {
      window.removeEventListener("datanarrator:new-project", handleNewProjectEvent)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // ==============================================================================
  // 🟢 START DEMO / SIMULATION CODE [Will be replaced with backend API integration]
  // Simulated upload progress timer & local file validation
  // When connected to backend, file will be uploaded via FormData / multipart upload API
  // ==============================================================================
  function startUploadSimulation(file: any, customCols?: string[]) {
    setUploadNotice(null)
    setSelectedFile(file)
    setUploadStatus("uploading")
    setUploadProgress(0)

    const resolved = resolveDatasetMeta(file, customCols)
    setActiveDataset(resolved)

    if (timerRef.current) clearInterval(timerRef.current)

    let progress = 0
    timerRef.current = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 12
      if (progress >= 100) {
        setUploadProgress(100)
        setUploadStatus("complete")
        setValidationReport(createReport(file.name))
        setIsValidationOpen(true)
        if (timerRef.current) clearInterval(timerRef.current)
      } else {
        setUploadProgress(progress)
      }
    }, 160)
  }
  // ==============================================================================
  // 🔴 END DEMO / SIMULATION CODE
  // ==============================================================================

  // ==============================================================================
  // Backend upload: POST /dataset/test-upload (quality report) + POST /dataset/upload
  // (persist for the user), then GET /dataset/:id/preview for duplicate rows.
  // ==============================================================================
  async function handleFileSelect(file: File | undefined) {
    if (!file) return
    if (!isFileSupported(file.name)) {
      setModalState({ isOpen: true, title: "Invalid File Format", message: `The file "${file.name}" is not supported.` })
      return
    }

    const fileInfo = {
      name: file.name,
      size: formatBytes(file.size),
      type: getFileExtension(file.name).replace(".", "").toUpperCase(),
    }

    setUploadNotice(null)
    setSelectedFile(fileInfo)
    setUploadStatus("uploading")
    setUploadProgress(5)

    // Progress indicator while the server processes the file
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setUploadProgress((p) => (p < 90 ? p + Math.floor(Math.random() * 8) + 3 : p))
    }, 250)

    try {
      const [inspect, saved] = await Promise.all([datasetApi.inspect(file), datasetApi.upload(file)])
      const preview = await datasetApi.preview(saved.dataset_id).catch(() => null)

      const meta = buildDatasetMetaFromBackend(fileInfo, inspect, saved.dataset_id)
      const report = buildValidationReportFromBackend(inspect, preview)

      if (timerRef.current) clearInterval(timerRef.current)
      setSelectedFile({ ...fileInfo, rowCount: meta.rowCount, colCount: meta.colCount })
      setActiveDataset(meta)
      setValidationReport(report)
      setUploadProgress(100)
      setUploadStatus("complete")
      setIsValidationOpen(true)

      // AI column recommendation (Gemini) runs in the background
      datasetApi
        .aiRecommendColumns(saved.dataset_id)
        .then((rec) => {
          setActiveDataset((prev) =>
            prev && prev.backendId === saved.dataset_id ? applyAiColumnRecommendation(prev, rec) : prev
          )
        })
        .catch(() => {})
    } catch (err: any) {
      if (timerRef.current) clearInterval(timerRef.current)
      setUploadStatus("idle")
      setSelectedFile(null)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setModalState({
        isOpen: true,
        title: "Upload Failed",
        message: err?.message || "The dataset could not be uploaded.",
      })
    }
  }

  // ==============================================================================
  // Explicit Workflow Controller Functions (Single Responsibility Principle)
  // ==============================================================================

  /** 1. Display Quality Issues to User (Open detailed validation report modal) */
  function handleOpenQualityReport() {
    setIsValidationOpen(true)
  }

  /** 2. Open interactive data cleaning studio */
  function handleOpenDataCleaningStudio() {
    setIsValidationOpen(false)
    setIsCleaningOpen(true)
  }

  /**
   * 3. Modify Data & Re-validate Dataset:
   * a) Apply cleaning decisions to columns (rename, merge, purge exact, exclude)
   * b) Re-validate dataset and issue certified clean quality report
   */
  async function handleApplyCleaningAndRecheck(decisions: CleaningDecisions) {
    if (!activeDataset) return

    // Persist missing-value cleaning on the backend for real uploads
    if (activeDataset.backendId) {
      const strategies = mapCleaningToStrategies(decisions, validationReport)
      if (Object.keys(strategies).length > 0) {
        try {
          await datasetApi.cleanMissing(activeDataset.backendId, strategies)
        } catch (err: any) {
          setIsCleaningOpen(false)
          setModalState({
            isOpen: true,
            title: "Cleaning Failed",
            message: err?.message || "The cleaning rules could not be applied on the server.",
          })
          return
        }
      }
    }

    // a) Apply column modifications
    const updatedColumns = applyCleaningDecisionsToColumns(
      activeDataset.columns,
      decisions,
      validationReport
    )

    setActiveDataset({
      ...activeDataset,
      columns: updatedColumns,
      colCount: updatedColumns.length,
    })

    // b) Re-validate dataset quality post-cleaning
    const cleanVerifiedReport = revalidateDatasetAfterCleaning(validationReport, decisions)
    setValidationReport(cleanVerifiedReport)

    setIsCleaningOpen(false)
    setIsValidationOpen(false)
    setUploadNotice(
      "Data cleaning rules applied: missing values unified, format types standardized, and duplicate columns resolved."
    )
  }

  /**
   * 4. Proceed Despite Issues (Explicit User Decision Step):
   * Allows the user to bypass cleaning and proceed directly with raw dataset
   */
  function handleProceedDespiteIssues() {
    setIsValidationOpen(false)
    setIsCleaningOpen(false)
    setCurrentStep(2) // Advance to Column Selection step
  }

  /**
   * 5. Proceed to next step when dataset is clean or verified
   */
  function handleProceedToNextStep() {
    setIsValidationOpen(false)
    setCurrentStep(2)
  }

  function handleReset() {
    if (timerRef.current) clearInterval(timerRef.current)
    setCurrentStep(1)
    setUploadStatus("idle")
    setSelectedFile(null)
    setActiveDataset(null)
    setConfirmedColumns([])
    setSelectedAnalysisType("")
    setSelectedChartType("")
    setUploadProgress(0)
    setUploadNotice(null)
    setIsValidationOpen(false)
    setIsCleaningOpen(false)
    setValidationReport({ missingValues: [], formatErrors: [], duplicateRows: [] })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleReviewDataset() {
    handleReset()
    setUploadNotice("Dataset issues detected. Please fix the column formatting or choose another file to continue.")
  }

  if (isAuthLoading || !isLoggedIn) {
    return (
      <div className="relative flex flex-1 items-center justify-center bg-white dark:bg-[#181a20]">
        <DecorativeBackground />
      </div>
    )
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100">
      <DecorativeBackground />

      <ErrorModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState({ isOpen: false, title: "", message: "" })}
      />

      {/* 1. Data Quality Report Modal & Issues Overview (includes explicit decision step to proceed with warnings) */}
      <DataValidationModal
        isOpen={isValidationOpen}
        report={validationReport}
        datasetMeta={activeDataset}
        onClose={() => setIsValidationOpen(false)}
        onSkip={handleProceedDespiteIssues}
        onProceed={handleProceedToNextStep}
        onCancel={() => setIsValidationOpen(false)}
        onOpenCleaning={handleOpenDataCleaningStudio}
      />

      {/* 2. Interactive Data Cleaning Studio (modifies data and triggers re-validation) */}
      <DataCleaningModal
        isOpen={isCleaningOpen}
        report={validationReport}
        datasetMeta={activeDataset}
        onClose={() => setIsCleaningOpen(false)}
        onBack={() => {
          setIsCleaningOpen(false)
          setIsValidationOpen(true)
        }}
        onApplyCleaning={handleApplyCleaningAndRecheck}
      />

      {/* 3. Standalone Cleaned Dataset Table Viewer Modal */}
      <DatasetErrorInspectorModal
        isOpen={isCleanedViewerOpen}
        onClose={() => setIsCleanedViewerOpen(false)}
        datasetName={activeDataset?.name}
        report={validationReport}
        datasetMeta={activeDataset}
        allowCellEditing={false}
      />

      <WorkspaceHeader
        onNewProject={handleReset}
        currentStep={currentStep}
        onBack={() => {
          if (currentStep > 1) {
            setCurrentStep((prev) => (prev - 1) as any)
          } else if (uploadStatus === "complete" || uploadStatus === "uploading") {
            handleReset()
          } else {
            router.back()
          }
        }}
      />

      <main className={`relative z-10 flex flex-1 flex-col ${
        currentStep === 4
          ? "w-full px-4 sm:px-8 lg:px-10 py-6 items-stretch justify-start"
          : "items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
      }`}>
        
        {/* Step 1: Upload & Quality Verification */}
        {currentStep === 1 && (
          <div className="w-full max-w-2xl">
            <div className="mb-6 flex items-center justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 px-3.5 py-1 text-xs font-medium text-slate-600 dark:text-zinc-300 shadow-sm backdrop-blur-sm">
                <Sparkles className="size-3.5 text-[#e99842]" />
                <span className="font-semibold text-[#1a3a5c] dark:text-[#60a5fa]">
                  Data Ingestion & Verification
                </span>
                <span className="text-slate-300 dark:text-zinc-600">•</span>
                <span>
                  Step 1 of 4
                </span>
              </span>
            </div>

            {uploadNotice && <NoticeBanner message={uploadNotice} onDismiss={() => setUploadNotice(null)} />}

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#22252c]/90 p-7 shadow-sm backdrop-blur-md sm:p-9">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-zinc-100 sm:text-3xl">
                  Upload dataset
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-zinc-400">
                  Supports CSV, XLSX, XLS
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
              />

              {uploadStatus === "idle" && (
                <DropzoneView
                  isDragging={isDragging}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files?.[0]) }}
                  onOpenDialog={() => fileInputRef.current?.click()}
                />
              )}

              {uploadStatus === "uploading" && selectedFile && (
                <ProgressCard
                  file={selectedFile}
                  progress={uploadProgress}
                  onCancel={handleReset}
                />
              )}

              {uploadStatus === "complete" && selectedFile && (
                <SuccessCard
                  file={selectedFile}
                  report={validationReport}
                  onReset={handleReset}
                  onOpenPreview={handleOpenQualityReport}
                  onOpenCleaning={handleOpenDataCleaningStudio}
                  onContinue={handleProceedDespiteIssues}
                  onViewCleanedDataset={() => setIsCleanedViewerOpen(true)}
                />
              )}

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-4 text-xs text-slate-400 dark:text-zinc-500">
                <span className="flex items-center gap-1.5"><Database className="size-3.5 text-[#4a7ff7]" /> Auto-structured schemas</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald-500" /> Zero external data sharing</span>
              </div>
            </div>

            <SampleDatasetsSection onSelect={startUploadSimulation} />
          </div>
        )}

        {/* Step 2: Column Recommendation & Manual Selection */}
        {currentStep === 2 && (
          <ColumnRecommendationStep
            columns={activeDataset?.columns}
            goalBundles={activeDataset?.goalBundles}
            datasetName={activeDataset?.name}
            onBack={() => setCurrentStep(1)}
            onNext={async (chosenCols) => {
              const backendId = activeDataset?.backendId
              if (backendId) {
                try {
                  await datasetApi.selectColumns(backendId, chosenCols)
                  const rec = await analysisApi.recommend(backendId, chosenCols)
                  const types = rec?.recommended_analysis_types || []
                  const supported = new Set(types)
                  // Prefer a trend view when a date column was chosen and descriptive is supported
                  const hasDate = activeDataset?.columns.some((c) => chosenCols.includes(c.name) && c.dataType === "date")
                  const recommendedId = hasDate && supported.has(ANALYSIS_TYPE_MAP.trend)
                    ? "trend"
                    : types.map(backendTypeToFrontendId).find(Boolean)
                  if (recommendedId) {
                    setActiveDataset((prev) =>
                      prev
                        ? {
                            ...prev,
                            recommendedAnalysisId: recommendedId,
                            analysisReason: `Server analysis supports: ${types.join(", ")}.`,
                          }
                        : prev
                    )
                  }
                } catch (err: any) {
                  setModalState({
                    isOpen: true,
                    title: "Column Selection",
                    message: err?.message || "The selected columns could not be validated.",
                  })
                  return
                }
              }
              setConfirmedColumns(chosenCols)
              setCurrentStep(3)
            }}
          />
        )}

        {/* Step 3: Analysis Approach Selection */}
        {currentStep === 3 && (
          <AnalysisType
            datasetMeta={activeDataset}
            confirmedColumns={confirmedColumns}
            onBack={() => setCurrentStep(2)}
            onGenerate={(analysisTypeId) => {
              setSelectedAnalysisType(analysisTypeId)
              // Dynamically apply recommended chart type
              const rec = resolveDynamicChartRecommendation(analysisTypeId, confirmedColumns, activeDataset)
              setSelectedChartType(rec.chartId)
              setCurrentStep(4)
            }}
          />
        )}

        {/* Step 4 of 4: Dashboard Visualization & Insights */}
        {currentStep === 4 && (
          <StoryDashboard
            datasetMeta={activeDataset}
            analysisTypeId={selectedAnalysisType}
            selectedChartId={selectedChartType}
            confirmedColumns={confirmedColumns}
            onBack={() => setCurrentStep(3)}
            onNewProject={handleReset}
          />
        )}

      </main>
      <AppFooter className="mt-16 w-full" />
    </div>
  )
}

export default UploadWorkspace