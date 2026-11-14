"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import {
  X,
  Table,
  ArrowUp,
  AlertTriangle,
  AlertCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Eye,
  CheckCircle2,
  Filter,
  Check,
  Edit3,
} from "lucide-react"
import { ValidationReport } from "@/components/data-validation-modal"

// ==========================================
// 1. Types & Interfaces
// ==========================================

export type InspectorViewMode = "all" | "missing" | "format" | "duplicates"

export interface ActiveIssue {
  type: "missing" | "format" | "duplicates" | string
  column: string
  targetRowIndex: number
}

export interface TableRow {
  rowNum: number
  [col: string]: any
}

export interface DatasetErrorInspectorProps {
  datasetName?: string
  initialTargetColumn?: string
  initialActiveIssue?: ActiveIssue | null
  initialViewMode?: InspectorViewMode
  report?: ValidationReport
  datasetMeta?: any
  onClose?: () => void
  onOpenCleaning?: () => void
  isSidePane?: boolean
  allowCellEditing?: boolean
}

export interface DatasetErrorInspectorModalProps extends DatasetErrorInspectorProps {
  isOpen: boolean
  onClose: () => void
}

// ==========================================
// 2. Helper Functions
// ==========================================

export function calculateTargetPage(targetRowIndex: number, rowsPerPage: number = 6): number {
  return Math.floor(targetRowIndex / rowsPerPage) + 1
}

export function getColumnMinWidth(colName: string): string {
  const name = colName.toLowerCase()
  if (name === "#" || name === "row" || name === "rownum") return "w-12 min-w-[48px] max-w-[48px]"
  if (
    name.includes("subscription") ||
    name.includes("subscriber") ||
    name.includes("reason") ||
    name.includes("postal") ||
    name.includes("charges") ||
    name.includes("revenue") ||
    name.includes("category")
  ) {
    return "min-w-[145px]"
  }
  if (
    name.includes("customer") ||
    name.includes("order") ||
    name.includes("discount") ||
    name.includes("status") ||
    name.includes("metric") ||
    name.includes("date")
  ) {
    return "min-w-[125px]"
  }
  if (name.length > 10) return "min-w-[130px]"
  return "min-w-[110px]"
}

export function checkCellError(colName: string, val: any) {
  const strVal = val === null || val === undefined ? "" : String(val).trim().toLowerCase()
  const isMissing =
    val === null ||
    val === undefined ||
    strVal === "" ||
    strVal === "null" ||
    strVal === "none" ||
    strVal === "nan" ||
    strVal === "nat" ||
    (strVal === "n/a" && !colName.toLowerCase().includes("status"))

  const isFormatError =
    typeof val === "string" &&
    !isMissing &&
    (val.startsWith("$") ||
      val.toLowerCase().includes("usd") ||
      (val.includes("/") && colName.toLowerCase().includes("date")))

  return {
    isMissing,
    isFormatError,
    hasError: isMissing || isFormatError,
  }
}

export function isColumnDuplicate(colName: string, report?: ValidationReport): boolean {
  return colName.toLowerCase().includes("alt") || colName.toLowerCase().includes("copy")
}

export function getRowIssues(row: TableRow, allColumns: string[], report?: ValidationReport) {
  const missingCols: string[] = []
  const formatCols: string[] = []

  allColumns.forEach((col) => {
    const val = row[col]
    const { isMissing, isFormatError } = checkCellError(col, val)
    if (isMissing) missingCols.push(col)
    if (isFormatError) formatCols.push(col)
  })

  const isDuplicateCopy = Boolean(
    report?.duplicateRows?.some((dr) => dr.rowIndex === row.rowNum)
  )
  const isDuplicateOriginal = Boolean(
    report?.duplicateRows?.some((dr) => dr.duplicateOfIndex === row.rowNum)
  )

  return {
    missingCols,
    formatCols,
    isDuplicateCopy,
    isDuplicateOriginal,
    hasMissing: missingCols.length > 0,
    hasFormat: formatCols.length > 0,
    hasDuplicate: isDuplicateCopy,
    hasAnyIssue: missingCols.length > 0 || formatCols.length > 0 || isDuplicateCopy,
  }
}

// ==============================================================================
// 🟢 START DEMO / SIMULATION CODE [Will be replaced with backend API integration]
// Mock dataset row generation for preview and error inspection table
// When integrated with a real backend, rows will be fetched via pagination (e.g. GET /api/datasets/:id/rows)
// ==============================================================================
export function getSampleRows(datasetName: string = "", columns: string[] = []): TableRow[] {
  let sampleRows: TableRow[] = []

  if (datasetName.includes("Customer_Retention")) {
    const plans = ["Pro Annual", "Starter", "Enterprise", "Starter", "Pro Annual", "Starter", "Enterprise", "Starter", "Pro Annual", "Starter", "Enterprise", "Starter"]
    const months = ["2026-01", "2026-01", "2026-02", "2026-02", "2026-03", "2026-03", "2026-04", "2026-04", "2026-05", "2026-05", "2026-06", "2026-06"]
    const retRates = ["92.4%", "76.0%", "96.2%", "68.5%", "88.0%", "72.1%", "94.8%", "64.2%", "85.0%", "69.0%", "97.1%", "63.5%"]

    sampleRows = [
      { rowNum: 1, Cohort_Month: months[0], Subscription_Plan: plans[0], Retention_Rate: retRates[0], Monthly_Charges: "79.99", Active_Subscribers: "1,240", Churn_Reason: "High Pricing", User_ID: "USR-1001", Status: "Active", Customer_ID_Alt: "USR-1001" },
      { rowNum: 2, Cohort_Month: months[1], Subscription_Plan: plans[1], Retention_Rate: retRates[1], Monthly_Charges: "$89.50", Active_Subscribers: "890", Churn_Reason: null, User_ID: "USR-1002", Status: "Active", Customer_ID_Alt: "USR-1002" },
      { rowNum: 3, Cohort_Month: months[2], Subscription_Plan: plans[2], Retention_Rate: retRates[2], Monthly_Charges: "119.00", Active_Subscribers: "450", Churn_Reason: "Poor Support", User_ID: "USR-1003", Status: "Paused", Customer_ID_Alt: "USR-1003" },
      { rowNum: 4, Cohort_Month: months[3], Subscription_Plan: plans[3], Retention_Rate: retRates[3], Monthly_Charges: "64.00", Active_Subscribers: "1,100", Churn_Reason: null, User_ID: "USR-1004", Status: "Active", Customer_ID_Alt: "USR-1004" },
      { rowNum: 5, Cohort_Month: months[4], Subscription_Plan: plans[4], Retention_Rate: retRates[4], Monthly_Charges: "$124.50", Active_Subscribers: "980", Churn_Reason: "Competitor Switch", User_ID: "USR-1005", Status: "Canceled", Customer_ID_Alt: "USR-1005" },
      { rowNum: 6, Cohort_Month: months[5], Subscription_Plan: plans[5], Retention_Rate: retRates[5], Monthly_Charges: "89.00", Active_Subscribers: null, Churn_Reason: null, User_ID: "USR-1006", Status: "Active", Customer_ID_Alt: "USR-1006-OLD" },
      { rowNum: 7, Cohort_Month: months[6], Subscription_Plan: plans[6], Retention_Rate: retRates[6], Monthly_Charges: "99.50", Active_Subscribers: "610", Churn_Reason: "Feature Gap", User_ID: "USR-1007", Status: "Active", Customer_ID_Alt: "USR-1007" },
      { rowNum: 8, Cohort_Month: months[7], Subscription_Plan: plans[7], Retention_Rate: retRates[7], Monthly_Charges: "49.99", Active_Subscribers: "1,400", Churn_Reason: null, User_ID: "USR-1008", Status: "Active", Customer_ID_Alt: "USR-1008" },
      { rowNum: 9, Cohort_Month: months[8], Subscription_Plan: plans[8], Retention_Rate: retRates[8], Monthly_Charges: "9 usd", Active_Subscribers: "830", Churn_Reason: "Budget Cut", User_ID: "USR-1009", Status: "Active", Customer_ID_Alt: "USR-1009" },
      { rowNum: 10, Cohort_Month: months[9], Subscription_Plan: plans[9], Retention_Rate: retRates[9], Monthly_Charges: "119.00", Active_Subscribers: "1,050", Churn_Reason: null, User_ID: "USR-1010", Status: "Active", Customer_ID_Alt: "USR-1010" },
      { rowNum: 11, Cohort_Month: months[10], Subscription_Plan: plans[10], Retention_Rate: retRates[10], Monthly_Charges: "84.50", Active_Subscribers: "520", Churn_Reason: "Low Engagement", User_ID: "USR-1011", Status: "Canceled", Customer_ID_Alt: "USR-1011" },
      { rowNum: 12, Cohort_Month: months[11], Subscription_Plan: plans[11], Retention_Rate: retRates[11], Monthly_Charges: "99.00", Active_Subscribers: null, Churn_Reason: null, User_ID: "USR-1012", Status: "Active", Customer_ID_Alt: "USR-1012-ALT" },
      { rowNum: 13, Cohort_Month: "2026-07", Subscription_Plan: "Pro Annual", Retention_Rate: "93.1%", Monthly_Charges: "79.99", Active_Subscribers: "1,310", Churn_Reason: null, User_ID: "USR-1013", Status: "Active", Customer_ID_Alt: "USR-1013" },
      { rowNum: 14, Cohort_Month: "2026-07", Subscription_Plan: "Starter", Retention_Rate: "71.4%", Monthly_Charges: "49.99", Active_Subscribers: "1,150", Churn_Reason: "High Pricing", User_ID: "USR-1014", Status: "Paused", Customer_ID_Alt: "USR-1014" },
      { rowNum: 15, Cohort_Month: "2026-08", Subscription_Plan: "Enterprise", Retention_Rate: "98.0%", Monthly_Charges: "199.00", Active_Subscribers: "420", Churn_Reason: null, User_ID: "USR-1015", Status: "Active", Customer_ID_Alt: "USR-1015" },
      { rowNum: 16, Cohort_Month: "2026-08", Subscription_Plan: "Starter", Retention_Rate: "69.8%", Monthly_Charges: "$54.00", Active_Subscribers: "990", Churn_Reason: "Poor Support", User_ID: "USR-1016", Status: "Canceled", Customer_ID_Alt: "USR-1016" },
      { rowNum: 17, Cohort_Month: "2026-09", Subscription_Plan: "Pro Annual", Retention_Rate: "89.5%", Monthly_Charges: "79.99", Active_Subscribers: "1,450", Churn_Reason: null, User_ID: "USR-1017", Status: "Active", Customer_ID_Alt: "USR-1017" },
      { rowNum: 18, Cohort_Month: "2026-09", Subscription_Plan: "Starter", Retention_Rate: "73.2%", Monthly_Charges: "49.99", Active_Subscribers: null, Churn_Reason: null, User_ID: "USR-1018", Status: "Active", Customer_ID_Alt: "USR-1018" },
      { rowNum: 19, Cohort_Month: "2026-10", Subscription_Plan: "Enterprise", Retention_Rate: "95.5%", Monthly_Charges: "199.00", Active_Subscribers: "480", Churn_Reason: null, User_ID: "USR-1019", Status: "Active", Customer_ID_Alt: "USR-1019" },
      { rowNum: 20, Cohort_Month: "2026-10", Subscription_Plan: "Starter", Retention_Rate: "66.0%", Monthly_Charges: "49.99", Active_Subscribers: "1,220", Churn_Reason: "Competitor Switch", User_ID: "USR-1020", Status: "Canceled", Customer_ID_Alt: "USR-1020" },
      { rowNum: 21, Cohort_Month: "2026-11", Subscription_Plan: "Pro Annual", Retention_Rate: "91.0%", Monthly_Charges: "79.99", Active_Subscribers: "1,520", Churn_Reason: null, User_ID: "USR-1021", Status: "Active", Customer_ID_Alt: "USR-1021" },
      { rowNum: 22, Cohort_Month: "2026-03", Subscription_Plan: "Pro Annual", Retention_Rate: "88.0%", Monthly_Charges: "$124.50", Active_Subscribers: "980", Churn_Reason: "Competitor Switch", User_ID: "USR-1005", Status: "Canceled", Customer_ID_Alt: "USR-1005" },
      { rowNum: 23, Cohort_Month: "2026-12", Subscription_Plan: "Enterprise", Retention_Rate: "97.2%", Monthly_Charges: "199.00", Active_Subscribers: "510", Churn_Reason: null, User_ID: "USR-1023", Status: "Active", Customer_ID_Alt: "USR-1023" },
      { rowNum: 24, Cohort_Month: "2026-12", Subscription_Plan: "Starter", Retention_Rate: "68.0%", Monthly_Charges: "49.99", Active_Subscribers: null, Churn_Reason: "High Pricing", User_ID: "USR-1024", Status: "Paused", Customer_ID_Alt: "USR-1024" },
      { rowNum: 25, Cohort_Month: "2026-12", Subscription_Plan: "Pro Annual", Retention_Rate: "94.0%", Monthly_Charges: "79.99", Active_Subscribers: "1,600", Churn_Reason: null, User_ID: "USR-1025", Status: "Active", Customer_ID_Alt: "USR-1025" },
      { rowNum: 26, Cohort_Month: "2026-12", Subscription_Plan: "Pro Annual", Retention_Rate: "94.0%", Monthly_Charges: "79.99", Active_Subscribers: "1,600", Churn_Reason: null, User_ID: "USR-1025", Status: "Active", Customer_ID_Alt: "USR-1025" },
      { rowNum: 27, Cohort_Month: "2027-01", Subscription_Plan: "Enterprise", Retention_Rate: "96.8%", Monthly_Charges: "199.00", Active_Subscribers: "530", Churn_Reason: null, User_ID: "USR-1027", Status: "Active", Customer_ID_Alt: "USR-1027" },
      { rowNum: 28, Cohort_Month: "2027-01", Subscription_Plan: "Starter", Retention_Rate: "72.0%", Monthly_Charges: "49.99", Active_Subscribers: "1,350", Churn_Reason: null, User_ID: "USR-1028", Status: "Active", Customer_ID_Alt: "USR-1028" },
      { rowNum: 29, Cohort_Month: "2027-02", Subscription_Plan: "Pro Annual", Retention_Rate: "90.4%", Monthly_Charges: "79.99", Active_Subscribers: "1,490", Churn_Reason: null, User_ID: "USR-1029", Status: "Active", Customer_ID_Alt: "USR-1029" },
      { rowNum: 30, Cohort_Month: "2027-02", Subscription_Plan: "Starter", Retention_Rate: "65.5%", Monthly_Charges: "49.99", Active_Subscribers: "920", Churn_Reason: "Budget Cut", User_ID: "USR-1030", Status: "Canceled", Customer_ID_Alt: "USR-1030" },
    ]
  } else if (datasetName.includes("Global_Sales")) {
    sampleRows = [
      { rowNum: 1, Order_ID: "ORD-901", Order_Date: "2026-03-15", Customer_Postal_Code: "94103", Discount_Rate: "0.15", Sales_Revenue: "1,420.50", Postal_Code_Copy: "94103" },
      { rowNum: 2, Order_ID: "ORD-902", Order_Date: "15/03/2026", Customer_Postal_Code: null, Discount_Rate: "0.10", Sales_Revenue: "890.00", Postal_Code_Copy: "94103" },
      { rowNum: 3, Order_ID: "ORD-903", Order_Date: "2026-03-16", Customer_Postal_Code: "10001", Discount_Rate: "0.00", Sales_Revenue: "2,150.00", Postal_Code_Copy: "10001" },
      { rowNum: 4, Order_ID: "ORD-904", Order_Date: "03/16/2026", Customer_Postal_Code: "90210", Discount_Rate: null, Sales_Revenue: "650.00", Postal_Code_Copy: "90210" },
      { rowNum: 5, Order_ID: "ORD-905", Order_Date: "2026-03-17", Customer_Postal_Code: null, Discount_Rate: "0.20", Sales_Revenue: "3,400.00", Postal_Code_Copy: "30301" },
      { rowNum: 6, Order_ID: "ORD-906", Order_Date: "2026-03-17", Customer_Postal_Code: "60601", Discount_Rate: "0.05", Sales_Revenue: "1,890.00", Postal_Code_Copy: "60601" },
      { rowNum: 7, Order_ID: "ORD-907", Order_Date: "17/03/2026", Customer_Postal_Code: null, Discount_Rate: "0.00", Sales_Revenue: "920.00", Postal_Code_Copy: "94103" },
      { rowNum: 8, Order_ID: "ORD-908", Order_Date: "2026-03-18", Customer_Postal_Code: "33101", Discount_Rate: null, Sales_Revenue: "2,410.00", Postal_Code_Copy: "33101" },
      { rowNum: 9, Order_ID: "ORD-909", Order_Date: "18/03/2026", Customer_Postal_Code: "94103", Discount_Rate: "0.15", Sales_Revenue: "9 usd", Postal_Code_Copy: "94103" },
      { rowNum: 10, Order_ID: "ORD-910", Order_Date: "2026-03-19", Customer_Postal_Code: null, Discount_Rate: "0.10", Sales_Revenue: "1,200.00", Postal_Code_Copy: "94103" },
      { rowNum: 11, Order_ID: "ORD-911", Order_Date: "2026-03-20", Customer_Postal_Code: "75001", Discount_Rate: "0.00", Sales_Revenue: "3,100.00", Postal_Code_Copy: "75001" },
      { rowNum: 12, Order_ID: "ORD-912", Order_Date: "20/03/2026", Customer_Postal_Code: null, Discount_Rate: "0.25", Sales_Revenue: "450.00", Postal_Code_Copy: "75001" },
      { rowNum: 13, Order_ID: "ORD-913", Order_Date: "2026-03-21", Customer_Postal_Code: "94107", Discount_Rate: "0.10", Sales_Revenue: "1,850.00", Postal_Code_Copy: "94107" },
      { rowNum: 14, Order_ID: "ORD-903", Order_Date: "2026-03-16", Customer_Postal_Code: "10001", Discount_Rate: "0.00", Sales_Revenue: "2,150.00", Postal_Code_Copy: "10001" },
      { rowNum: 15, Order_ID: "ORD-915", Order_Date: "2026-03-22", Customer_Postal_Code: "78701", Discount_Rate: "0.00", Sales_Revenue: "2,600.00", Postal_Code_Copy: "78701" },
      { rowNum: 16, Order_ID: "ORD-916", Order_Date: "22/03/2026", Customer_Postal_Code: null, Discount_Rate: "0.15", Sales_Revenue: "1,100.00", Postal_Code_Copy: "78701" },
      { rowNum: 17, Order_ID: "ORD-917", Order_Date: "2026-03-23", Customer_Postal_Code: "10012", Discount_Rate: "0.20", Sales_Revenue: "3,150.00", Postal_Code_Copy: "10012" },
      { rowNum: 18, Order_ID: "ORD-918", Order_Date: "2026-03-23", Customer_Postal_Code: "90001", Discount_Rate: null, Sales_Revenue: "800.00", Postal_Code_Copy: "90001" },
      { rowNum: 19, Order_ID: "ORD-919", Order_Date: "2026-03-24", Customer_Postal_Code: "30309", Discount_Rate: "0.05", Sales_Revenue: "1,750.00", Postal_Code_Copy: "30309" },
      { rowNum: 20, Order_ID: "ORD-920", Order_Date: "2026-03-24", Customer_Postal_Code: "94103", Discount_Rate: "0.00", Sales_Revenue: "2,400.00", Postal_Code_Copy: "94103" },
      { rowNum: 21, Order_ID: "ORD-921", Order_Date: "2026-03-25", Customer_Postal_Code: null, Discount_Rate: "0.10", Sales_Revenue: "1,350.00", Postal_Code_Copy: "94103" },
      { rowNum: 22, Order_ID: "ORD-922", Order_Date: "25/03/2026", Customer_Postal_Code: "60611", Discount_Rate: "0.25", Sales_Revenue: "4,200.00", Postal_Code_Copy: "60611" },
      { rowNum: 23, Order_ID: "ORD-923", Order_Date: "2026-03-26", Customer_Postal_Code: "33139", Discount_Rate: "0.00", Sales_Revenue: "950.00", Postal_Code_Copy: "33139" },
      { rowNum: 24, Order_ID: "ORD-924", Order_Date: "2026-03-26", Customer_Postal_Code: "75002", Discount_Rate: null, Sales_Revenue: "1,600.00", Postal_Code_Copy: "75002" },
      { rowNum: 25, Order_ID: "ORD-925", Order_Date: "2026-03-27", Customer_Postal_Code: "94103", Discount_Rate: "0.15", Sales_Revenue: "2,050.00", Postal_Code_Copy: "94103" },
      { rowNum: 26, Order_ID: "ORD-925", Order_Date: "2026-03-27", Customer_Postal_Code: "94103", Discount_Rate: "0.15", Sales_Revenue: "2,050.00", Postal_Code_Copy: "94103" },
      { rowNum: 27, Order_ID: "ORD-927", Order_Date: "2026-03-28", Customer_Postal_Code: "10001", Discount_Rate: "0.00", Sales_Revenue: "1,450.00", Postal_Code_Copy: "10001" },
      { rowNum: 28, Order_ID: "ORD-928", Order_Date: "2026-03-28", Customer_Postal_Code: null, Discount_Rate: "0.10", Sales_Revenue: "880.00", Postal_Code_Copy: "10001" },
      { rowNum: 29, Order_ID: "ORD-911", Order_Date: "2026-03-20", Customer_Postal_Code: "75001", Discount_Rate: "0.00", Sales_Revenue: "3,100.00", Postal_Code_Copy: "75001" },
      { rowNum: 30, Order_ID: "ORD-930", Order_Date: "2026-03-29", Customer_Postal_Code: "94107", Discount_Rate: "0.00", Sales_Revenue: "1,980.00", Postal_Code_Copy: "94107" },
    ]
  } else {
    const cols = columns.length > 0 ? columns : ["ID", "Category", "Metric", "Date"]
    for (let i = 1; i <= 32; i++) {
      if (i === 12 && sampleRows.length >= 2) {
        // Exact duplicate of Row 2
        sampleRows.push({ ...sampleRows[1], rowNum: 12 })
        continue
      }
      const rowObj: TableRow = { rowNum: i }
      cols.forEach((c) => {
        if (i % 3 === 0 && (c.toLowerCase().includes("reason") || c.toLowerCase().includes("tag") || c.toLowerCase().includes("code") || c.toLowerCase().includes("postal"))) {
          rowObj[c] = null
        } else if (i % 4 === 0 && (c.toLowerCase().includes("date") || c.toLowerCase().includes("time"))) {
          rowObj[c] = "15/03/2026"
        } else if (i % 5 === 0 && (c.toLowerCase().includes("price") || c.toLowerCase().includes("charge") || c.toLowerCase().includes("rate"))) {
          rowObj[c] = "9 usd"
        } else {
          rowObj[c] = `${c.slice(0, 3).toUpperCase()}-${100 + i}`
        }
      })
      sampleRows.push(rowObj)
    }
  }

  // Ensure any column defined in columns has a default non-undefined value if missing from mock
  if (columns.length > 0) {
    sampleRows.forEach((r, idx) => {
      columns.forEach((c) => {
        if (r[c] === undefined) {
          r[c] = `Record_${idx + 1}`
        }
      })
    })
  }

  return sampleRows
}
// ==============================================================================
// 🔴 END DEMO / SIMULATION CODE
// ==============================================================================

/**
 * Styling function:
 * When viewing a specific issue, ONLY that issue type is highlighted!
 * - viewMode === "missing": ONLY Missing values (Yellow)
 * - viewMode === "format": ONLY Format errors (Blue)
 * - viewMode === "duplicates": ONLY Duplicate columns (Pink)
 * - viewMode === "all": All issues highlighted
 */
export function getCellStyling({
  rowNum,
  columnName,
  cellValue,
  activeIssue,
  viewMode,
  isCellMissing,
  isCellFormatError,
  isDuplicateRow,
}: {
  rowNum: number
  columnName: string
  cellValue: any
  activeIssue: ActiveIssue | null
  viewMode: InspectorViewMode
  isCellMissing: boolean
  isCellFormatError: boolean
  isDuplicateRow: boolean
}) {
  const isTargetCell =
    activeIssue !== null &&
    activeIssue.column === columnName &&
    (activeIssue.targetRowIndex === rowNum - 1 || activeIssue.targetRowIndex === rowNum)

  // 1. Missing Values: YELLOW HIGHLIGHT (STRICTLY when viewMode is "missing" or "all")
  const showMissing = (viewMode === "all" || viewMode === "missing") && isCellMissing

  if (showMissing) {
    const isTargetMissing = activeIssue?.type === "missing" && activeIssue.column === columnName
    return {
      tdClassName: `bg-[#fef08a] dark:bg-[#713f12]/85 text-[#713f12] dark:text-[#fef08a] border-2 ${
        isTargetCell || isTargetMissing ? "border-amber-600 ring-2 ring-amber-400 font-black" : "border-[#eab308]"
      } font-semibold transition-all`,
      badge: (
        <span className="inline-flex items-center gap-1 font-bold">
          {cellValue !== null && cellValue !== undefined && cellValue !== "" ? (
            <span>{String(cellValue)}</span>
          ) : (
            <span className="opacity-80 italic font-mono text-[11px]">[null]</span>
          )}
        </span>
      ),
    }
  }

  // 2. Wrong Format: BLUE HIGHLIGHT (STRICTLY when viewMode is "format" or "all")
  const showFormat = (viewMode === "all" || viewMode === "format") && isCellFormatError

  if (showFormat) {
    const isTargetFormat = activeIssue?.type === "format" && activeIssue.column === columnName
    return {
      tdClassName: `bg-[#bae6fd] dark:bg-[#075985]/85 text-[#0c4a6e] dark:text-[#bae6fd] border-2 ${
        isTargetCell || isTargetFormat ? "border-sky-600 ring-2 ring-sky-400 font-black" : "border-[#0284c7]"
      } font-bold transition-all`,
      badge: <span>{String(cellValue)}</span>,
    }
  }

  // 3. Duplicate Row: PINK HIGHLIGHT across all cells of the duplicate copy row
  const showDuplicate = (viewMode === "all" || viewMode === "duplicates") && isDuplicateRow

  if (showDuplicate) {
    return {
      tdClassName:
        "bg-[#fdf2f8] dark:bg-[#831843]/35 text-[#9d174d] dark:text-[#fbcfe8] border-b border-[#fbcfe8] dark:border-[#831843]/60 font-medium transition-all",
      badge: <span>{cellValue !== null && cellValue !== undefined ? String(cellValue) : "—"}</span>,
    }
  }

  // 4. Default clean cell (render standard text without colored background)
  return {
    tdClassName:
      "bg-white dark:bg-[#1a1c23] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800/40",
    badge: (
      <span>
        {cellValue !== null && cellValue !== undefined && cellValue !== "" ? (
          String(cellValue)
        ) : (
          <span className="text-slate-400 dark:text-zinc-500 italic">—</span>
        )}
      </span>
    ),
  }
}

// ==========================================
// 3. Main Inspector Content Component
// ==========================================

export function DatasetErrorInspectorContent({
  datasetName,
  initialTargetColumn,
  initialActiveIssue,
  initialViewMode = "all",
  report,
  datasetMeta,
  onClose,
  onOpenCleaning,
  allowCellEditing = false,
}: DatasetErrorInspectorProps) {
  const activeDatasetName = datasetName || datasetMeta?.name || "Uploaded Dataset"

  const [activeIssue, setActiveIssue] = useState<ActiveIssue | null>(null)
  const [viewMode, setViewMode] = useState<InspectorViewMode>(initialViewMode)

  // Missing Cell Quick-Edit State (Double Click per cell)
  const [editingCell, setEditingCell] = useState<{
    columnName: string
    rowNum: number
    currentValue: any
  } | null>(null)
  const [fillInputValue, setFillInputValue] = useState<string>("")
  const [customFills, setCustomFills] = useState<Record<string, string>>({})

  const handleSaveFill = () => {
    if (!editingCell) return
    const trimmedVal = fillInputValue.trim()
    setCustomFills((prev) => ({
      ...prev,
      [`cell_${editingCell.rowNum}_${editingCell.columnName}`]: trimmedVal,
    }))
    setEditingCell(null)
  }

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const horizontalScrollRef = useRef<HTMLDivElement>(null)

  // Extract all columns
  const allColumns: string[] = useMemo(() => {
    if (datasetMeta?.columns && datasetMeta.columns.length > 0) {
      return datasetMeta.columns.map((c: any) => (typeof c === "string" ? c : c.name)) as string[]
    }
    const sample = getSampleRows(activeDatasetName)
    if (sample.length > 0) {
      return Object.keys(sample[0]).filter((k) => k !== "rowNum")
    }
    return ["Column1", "Column2", "Column3", "Column4", "Column5"]
  }, [datasetMeta, activeDatasetName])

  // Get raw sample dataset rows with cleaning applied if dataset is cleaned
  const rawRows = useMemo(() => {
    let rows = getSampleRows(activeDatasetName, allColumns)

    if (report?.isCleaned) {
      const summary = report.cleaningSummary
      const removedIndices = summary?.removedDuplicateRowIndices || [14, 29, 22, 12]
      const fills = summary?.missingFillValues || {}

      // 1. Filter out duplicate rows that were purged
      if (removedIndices.length > 0) {
        rows = rows.filter((r) => !removedIndices.includes(r.rowNum))
      }

      // 2. Fill missing cells and standardize formats
      rows = rows.map((r) => {
        const row = { ...r }
        allColumns.forEach((col) => {
          const val = row[col]
          const { isMissing, isFormatError } = checkCellError(col, val)

          if (isMissing) {
            const fillType = fills[col] || "mode"
            if (fillType === "mean") {
              row[col] = col.toLowerCase().includes("charge")
                ? "84.50"
                : col.toLowerCase().includes("subscriber")
                ? "980"
                : col.toLowerCase().includes("revenue") || col.toLowerCase().includes("sales")
                ? "1,850.00"
                : "0.10"
            } else if (fillType === "mode") {
              row[col] = col.toLowerCase().includes("reason")
                ? "High Pricing"
                : col.toLowerCase().includes("postal")
                ? "94103"
                : col.toLowerCase().includes("plan")
                ? "Pro Annual"
                : "Active"
            } else if (fillType === "null") {
              row[col] = "null"
            } else if (fillType === "NaN") {
              row[col] = "NaN"
            } else if (fillType === "NaT") {
              row[col] = "NaT"
            } else {
              row[col] = fillType
            }
          }

          if (isFormatError && typeof val === "string") {
            if (val.includes("/")) {
              const parts = val.split("/")
              if (parts.length === 3) {
                row[col] = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`
              }
            } else if (val.startsWith("$")) {
              row[col] = val.replace("$", "")
            } else if (val.toLowerCase().includes("usd")) {
              row[col] = val.replace(/usd/i, "").trim() + ".00"
            }
          }
        })
        return row
      })
    }

    return rows
  }, [activeDatasetName, allColumns, report])

  // Keep original dataset column order strictly consistent at all times (never reorder columns)
  const displayedColumns = allColumns

  // Compute issue counts for top tabs
  const missingRowsCount = useMemo(() => {
    return rawRows.filter((r) =>
      allColumns.some((col) => checkCellError(col, r[col]).isMissing)
    ).length
  }, [rawRows, allColumns])

  const formatRowsCount = useMemo(() => {
    return rawRows.filter((r) =>
      allColumns.some((col) => checkCellError(col, r[col]).isFormatError)
    ).length
  }, [rawRows, allColumns])

  const duplicateRowsCount = useMemo(() => {
    return report?.duplicateRows?.length || 0
  }, [report])

  const allIssuesCount = useMemo(() => {
    return rawRows.filter((r) => getRowIssues(r, allColumns, report).hasAnyIssue).length
  }, [rawRows, allColumns, report])

  // Filter rows strictly based on the active viewMode
  const filteredRows = useMemo(() => {
    const matchedRows: TableRow[] = []
    const seenRowNums = new Set<number>()

    rawRows.forEach((row) => {
      const issues = getRowIssues(row, allColumns, report)
      let shouldInclude = false

      if (viewMode === "missing") {
        if (activeIssue?.column) {
          shouldInclude = checkCellError(activeIssue.column, row[activeIssue.column]).isMissing
        } else {
          shouldInclude = displayedColumns.some((col) => checkCellError(col, row[col]).isMissing)
        }
      } else if (viewMode === "format") {
        if (activeIssue?.column) {
          shouldInclude = checkCellError(activeIssue.column, row[activeIssue.column]).isFormatError
        } else {
          shouldInclude = displayedColumns.some((col) => checkCellError(col, row[col]).isFormatError)
        }
      } else if (viewMode === "duplicates") {
        // Show the duplicate copy row and its original row for direct comparison
        shouldInclude = Boolean(
          report?.duplicateRows?.some(
            (dr) => dr.rowIndex === row.rowNum || dr.duplicateOfIndex === row.rowNum
          )
        )
      } else {
        // "all" mode: display the complete dataset with all rows; issues remain highlighted
        shouldInclude = true
      }

      if (shouldInclude && !seenRowNums.has(row.rowNum)) {
        seenRowNums.add(row.rowNum)
        matchedRows.push(row)
      }
    })

    return matchedRows
  }, [rawRows, allColumns, displayedColumns, report, viewMode, activeIssue])

  // All matching rows are rendered continuously (no pagination slicing)
  const totalRows = filteredRows.length

  // View dataset handler
  const handleViewDataset = (
    type: "missing" | "format" | "duplicates" | string,
    column: string,
    mode?: InspectorViewMode
  ) => {
    const newMode = (mode || type) as InspectorViewMode
    setViewMode(newMode)

    const targetIdx = filteredRows.findIndex((r) => {
      const val = r[column]
      const { isMissing, isFormatError } = checkCellError(column, val)
      if (type === "missing") return isMissing
      if (type === "format") return isFormatError
      if (type === "duplicates") return true
      return isMissing || isFormatError
    })

    const safeTargetIdx = targetIdx >= 0 ? targetIdx : 0

    setActiveIssue({
      type,
      column,
      targetRowIndex: safeTargetIdx,
    })

    setTimeout(() => {
      const rowTarget = filteredRows[safeTargetIdx]
      if (rowTarget) {
        const rowEl = document.getElementById(`dataset-inspector-row-${rowTarget.rowNum}`)
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }
    }, 80)
  }

  // Handle initialization when props change
  useEffect(() => {
    const mode = initialViewMode || "all"
    setViewMode(mode)

    if (initialActiveIssue) {
      handleViewDataset(
        initialActiveIssue.type,
        initialActiveIssue.column,
        mode
      )
    } else if (initialTargetColumn) {
      let type = "missing"
      if (report?.formatErrors?.some((f) => f.columnName === initialTargetColumn)) {
        type = "format"
      } else if (isColumnDuplicate(initialTargetColumn, report)) {
        type = "duplicates"
      }
      handleViewDataset(type, initialTargetColumn, mode)
    } else {
      setActiveIssue(null)
    }
  }, [initialTargetColumn, initialActiveIssue, initialViewMode])

// Removed pagination bounds effect since all rows render with continuous scroll

  // Smoothly scroll horizontally to the targeted column without changing column positions
  useEffect(() => {
    if (activeIssue?.column && horizontalScrollRef.current) {
      const colEl = horizontalScrollRef.current.querySelector(`[data-col-id="${activeIssue.column}"]`)
      if (colEl) {
        colEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
      }
    }
  }, [activeIssue])

  return (
    <div className="flex flex-col w-full bg-white dark:bg-[#1a1c23] select-text">
      {/* Header */}
      <div className="p-3.5 sm:p-4 pb-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-zinc-900/60">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#4a7ff7] dark:text-sky-400 border border-blue-200 dark:border-blue-900/60 shadow-2xs">
            <Table className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {report?.isCleaned ? "Dataset Table • Cleaned & Standardized" : "Dataset Table • Detected Issues"}
              </h3>
              <span className="rounded-full bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] font-bold px-2 py-0.5 border border-slate-300 dark:border-zinc-700">
                {activeDatasetName}
              </span>
              <span className={`rounded-full text-[10px] font-bold px-2.5 py-0.5 border ${
                report?.isCleaned
                  ? "bg-emerald-100/80 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                  : "bg-blue-100/80 dark:bg-blue-950 text-[#4a7ff7] dark:text-sky-300 border-blue-200 dark:border-blue-800"
              }`}>
                {report?.isCleaned ? `Cleaned (${filteredRows.length} Rows)` : `All ${filteredRows.length} Rows • Continuous Scroll`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              {allowCellEditing ? (
                <span>
                  Select a category below or <strong className="text-amber-600 dark:text-amber-400 font-semibold">double-click any empty cell</strong> to edit its value directly.
                </span>
              ) : (
                <span>
                  Select an issue category below to view and highlight only the relevant data.
                </span>
              )}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
            title="Close Viewer"
          >
            <X className="size-4.5" />
          </button>
        )}
      </div>

      {/* Top Options Bar: Missing Data, Duplicated, Format, and All Issues */}
      <div className="px-3.5 sm:px-5 py-2.5 bg-slate-100/80 dark:bg-[#20222a] border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        {report?.isCleaned ? (
          <div className="flex items-center gap-2 py-0.5">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 px-3 py-1 text-xs font-bold text-emerald-900 dark:text-emerald-200 shadow-2xs">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Cleaned Dataset ({filteredRows.length} Rows)</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              • All values imputed, formats standardized, and duplicate rows purged
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1.5">
            <Filter className="size-3.5 text-slate-400" />
            <span>Category:</span>
          </span>

          {/* 1. Missing Data - Yellow */}
          <button
            type="button"
            onClick={() => {
              setViewMode("missing")
              setActiveIssue(null)
              }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
              viewMode === "missing"
                ? "bg-[#fef08a] border-[#eab308] text-amber-950 shadow-xs ring-2 ring-amber-400/50"
                : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-zinc-700 hover:border-amber-300"
            }`}
          >
            <span className="size-2.5 rounded-full bg-[#eab308]" />
            <span>Missing Data</span>
            {missingRowsCount > 0 && (
              <span className="rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 text-[10px] px-1.5 py-0.2 font-mono">
                {missingRowsCount}
              </span>
            )}
          </button>

          {/* 2. Duplicate Rows - Pink */}
          <button
            type="button"
            onClick={() => {
              setViewMode("duplicates")
              setActiveIssue(null)
              }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
              viewMode === "duplicates"
                ? "bg-[#fbcfe8] border-[#db2777] text-pink-950 shadow-xs ring-2 ring-pink-400/50"
                : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-zinc-700 hover:border-pink-300"
            }`}
          >
            <span className="size-2.5 rounded-full bg-[#db2777]" />
            <span>Duplicate Rows</span>
            {duplicateRowsCount > 0 && (
              <span className="rounded-full bg-pink-200/80 dark:bg-pink-900/60 text-pink-950 dark:text-pink-200 text-[10px] px-1.5 py-0.2 font-mono">
                {duplicateRowsCount}
              </span>
            )}
          </button>

          {/* 3. Inconsistent Format - Blue */}
          <button
            type="button"
            onClick={() => {
              setViewMode("format")
              setActiveIssue(null)
              }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
              viewMode === "format"
                ? "bg-[#bae6fd] border-[#0284c7] text-sky-950 shadow-xs ring-2 ring-sky-400/50"
                : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-700 hover:border-sky-300"
            }`}
          >
            <span className="size-2.5 rounded-full bg-[#0284c7]" />
            <span>Format</span>
            {formatRowsCount > 0 && (
              <span className="rounded-full bg-sky-200/80 dark:bg-sky-900/60 text-sky-950 dark:text-sky-200 text-[10px] px-1.5 py-0.2 font-mono">
                {formatRowsCount}
              </span>
            )}
          </button>

          {/* 4. All Issues */}
          <button
            type="button"
            onClick={() => {
              setViewMode("all")
              setActiveIssue(null)
              }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              viewMode === "all"
                ? "bg-[#4a7ff7] text-white shadow-xs"
                : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50"
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>All Issues</span>
            {allIssuesCount > 0 && (
              <span className={`rounded-full text-[10px] px-1.5 py-0.2 font-mono ${viewMode === "all" ? "bg-white/30 text-white" : "bg-slate-200 dark:bg-zinc-700 text-slate-700"}`}>
                {allIssuesCount}
              </span>
            )}
          </button>
        </div>
        )}

        {activeIssue && !report?.isCleaned && (
          <button
            type="button"
            onClick={() => setActiveIssue(null)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span>Reset Target Filter</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div ref={tableContainerRef} className="p-3.5 sm:p-5 flex-1 min-h-0">
        {filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/40">
            <CheckCircle2 className="size-8 text-emerald-500 mb-2" />
            <div className="text-sm font-bold text-slate-800 dark:text-zinc-200">
              No Issues Found in this Category
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              All rows for this category are clean or within allowable limits.
            </p>
          </div>
        ) : (
          <div ref={horizontalScrollRef} className="w-full overflow-auto max-h-[58vh] rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1a1c22] shadow-xs">
            <table className="min-w-full text-left text-xs border-collapse font-sans table-auto">
              <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-[#252831] shadow-2xs">
                <tr className="border-b border-slate-200 dark:border-zinc-700">
                  <th className="sticky left-0 top-0 z-30 py-2.5 px-2.5 font-mono font-bold text-slate-500 dark:text-zinc-400 border-r border-slate-200 dark:border-zinc-700 w-12 min-w-[48px] max-w-[48px] text-center select-none bg-slate-200 dark:bg-zinc-800 shrink-0">                    #
                  </th>
                  {displayedColumns.map((col: string) => {
                    const isDupCol = isColumnDuplicate(col, report)
                    const isMissingCol = report?.missingValues?.some((m) => m.columnName === col)
                    const isFormatCol = report?.formatErrors?.some((f) => f.columnName === col)
                    const isTargetCol = activeIssue?.column === col
                    const colWidthClass = getColumnMinWidth(col)

                    let headerColorStyle = "text-slate-700 dark:text-zinc-300"
                    let dotColor = null

                    if (isTargetCol) {
                      headerColorStyle = "bg-blue-100 text-[#1a3a5c] dark:bg-blue-950/60 dark:text-sky-200 border-b-2 border-b-blue-600"
                    // Duplicates are row-level issues rather than column-level else if ((viewMode === "missing" || viewMode === "all") && isMissingCol) {
                      headerColorStyle = "bg-[#fef08a]/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 border-b-2 border-b-amber-500 font-bold"
                      dotColor = "bg-[#eab308]"
                    } else if ((viewMode === "format" || viewMode === "all") && isFormatCol) {
                      headerColorStyle = "bg-[#bae6fd]/80 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200 border-b-2 border-b-sky-500 font-bold"
                      dotColor = "bg-[#0284c7]"
                    }

                    return (
                      <th
                        key={col}
                        data-col-id={col}
                        className={`py-2 px-3 font-mono font-bold text-xs border-r border-slate-200/60 dark:border-zinc-700/60 last:border-r-0 ${colWidthClass} ${headerColorStyle}`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span
                            className="whitespace-normal break-words leading-tight"
                            title={col}
                          >
                            {col.replace(/_/g, "_\u200B")}
                          </span>
                          {dotColor && (
                            <span className={`size-2 rounded-full ${dotColor} shrink-0 mt-0.5`} />
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>

              {/* Body: Continuous scroll rows */}
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredRows.map((row) => {
                  const isRowTarget =
                    activeIssue !== null &&
                    (activeIssue.targetRowIndex === row.rowNum - 1 || activeIssue.targetRowIndex === row.rowNum)

                  const isDuplicatePair = Boolean(
                    report?.duplicateRows?.some(
                      (dr) => dr.rowIndex === row.rowNum || dr.duplicateOfIndex === row.rowNum
                    )
                  )

                  return (
                    <tr
                      key={row.rowNum}
                      id={`dataset-inspector-row-${row.rowNum}`}
                      className={`transition-colors ${
                        isRowTarget
                          ? "ring-2 ring-blue-500/60 z-10 relative bg-blue-50/70 dark:bg-blue-950/40"
                          : (viewMode === "duplicates" || viewMode === "all") && isDuplicatePair
                          ? "bg-rose-50/50 dark:bg-rose-950/25"
                          : "hover:bg-slate-50/60 dark:hover:bg-zinc-800/40"
                      }`}
                    >
                      {/* Row number column */}
                      <td className={`sticky left-0 z-10 py-2 px-2.5 text-center select-none font-mono text-[11px] font-bold border-r w-12 min-w-[48px] max-w-[48px] shrink-0 ${
                        (viewMode === "duplicates" || viewMode === "all") && isDuplicatePair
                          ? "bg-rose-100/90 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800"
                          : "bg-slate-100/95 dark:bg-[#20222a]/95 text-slate-500 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-800"
                      }`}>
                        {row.rowNum}
                      </td>

                      {/* Cells */}
                      {displayedColumns.map((col: string) => {
                        const rawVal = row[col]
                        const { isMissing: isRawMissing, isFormatError } = checkCellError(col, rawVal)
                        const customVal = customFills[`cell_${row.rowNum}_${col}`]
                        const hasCustomFill = isRawMissing && customVal !== undefined && customVal !== ""
                        const val = hasCustomFill ? customVal : rawVal
                        const isMissing = hasCustomFill ? false : isRawMissing

                        const isDupCol = isColumnDuplicate(col, report)
                        const colWidthClass = getColumnMinWidth(col)
                        const canEditThisCell = Boolean(allowCellEditing && isRawMissing)

                        const cellStyle = getCellStyling({
                          rowNum: row.rowNum,
                          columnName: col,
                          cellValue: val,
                          activeIssue,
                          viewMode,
                          isCellMissing: isMissing,
                          isCellFormatError: isFormatError,
                          isDuplicateRow: isDuplicatePair,
                        })

                        return (
                          <td
                            key={col}
                            onDoubleClick={() => {
                              if (canEditThisCell) {
                                setEditingCell({
                                  columnName: col,
                                  rowNum: row.rowNum,
                                  currentValue: val,
                                })
                                setFillInputValue(hasCustomFill ? customVal : "")
                              }
                            }}
                            title={canEditThisCell ? `Double-click to fill this cell (Row #${row.rowNum})` : undefined}
                            className={`py-2 px-3 text-xs font-mono border-r border-slate-100 dark:border-zinc-800/80 last:border-r-0 whitespace-nowrap ${colWidthClass} ${cellStyle.tdClassName} ${canEditThisCell ? "cursor-pointer select-none" : ""}`}
                          >
                            {hasCustomFill ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded text-[11px] shadow-2xs">
                                <Check className="size-3 text-emerald-600" />
                                <span>{val}</span>
                              </span>
                            ) : (
                              cellStyle.badge
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Continuous Scroll Status Footer */}
      <div className="p-3 sm:p-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-[#15171d] flex items-center justify-between shrink-0">
        
        {/* Row count & current category summary */}
        <div className="text-xs font-semibold text-slate-600 dark:text-zinc-400 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-slate-800 dark:text-zinc-200">
            <span className="size-2 rounded-full bg-emerald-500" />
            Showing all <strong>{filteredRows.length}</strong> rows
          </span>
          <span className="text-slate-300 dark:text-zinc-700">&bull;</span>
          <span className="rounded bg-slate-200/80 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-zinc-300">
            {viewMode === "missing"
              ? `${filteredRows.length} rows with missing values`
              : viewMode === "format"
              ? `${filteredRows.length} rows with format errors`
              : viewMode === "duplicates"
              ? `${filteredRows.length} duplicate rows`
              : report?.isCleaned
              ? `Cleaned Dataset (${filteredRows.length} rows) • 100% Quality Verified`
              : `Full Dataset (${filteredRows.length} rows) • Continuous scroll`}
          </span>
        </div>

        {/* Scroll to Top Action */}
        <button
          type="button"
          onClick={() => {
            if (horizontalScrollRef.current) {
              horizontalScrollRef.current.scrollTo({ top: 0, behavior: "smooth" })
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer transition-all shadow-2xs"
          title="Scroll back to top of dataset"
        >
          <ArrowUp className="size-3.5 text-slate-500 dark:text-zinc-400" />
          <span>Scroll to Top</span>
        </button>

      </div>

      {/* Mini Fill Missing Value Popup on Double Click (Only active in Data Cleaning) */}
      {allowCellEditing && editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1e2026] shadow-2xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/50 text-[#e99842]">
                  <Edit3 className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Edit Cell Value
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Row <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">#{editingCell.rowNum}</span> &bull; Column: <span className="font-mono font-bold text-[#4a7ff7]">{editingCell.columnName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Input Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Enter value for this specific cell
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Unknown, None, 0, N/A..."
                value={fillInputValue}
                onChange={(e) => setFillInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveFill()
                  }
                  if (e.key === "Escape") setEditingCell(null)
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-[#4a7ff7] focus:ring-2 focus:ring-[#4a7ff7]/20 transition-all shadow-inner"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFill}
                className="px-4 py-1.5 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] active:scale-95 text-xs font-bold text-white shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Check className="size-3.5" />
                <span>Save Cell Value</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// 4. Standalone Modal Wrapper (Dataset Table Popup)
// ==========================================

export function DatasetErrorInspectorModal({
  isOpen,
  onClose,
  ...props
}: DatasetErrorInspectorModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-5xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#1a1c23] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <DatasetErrorInspectorContent {...props} onClose={onClose} />
      </div>
    </div>
  )
}

export default DatasetErrorInspectorModal
