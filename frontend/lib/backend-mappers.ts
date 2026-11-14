// ==============================================================================
// Mappers between Flask backend responses and the existing frontend models.
// They let the UI components stay unchanged while using real backend data.
// ==============================================================================

import type {
  ColumnDefinition,
  DatasetMeta,
  StoryBoardConfig,
  TrendPoint,
  BarItem,
  DonutSegment,
  BoxPlotData,
  ScatterPoint,
} from "@/lib/dataset-models"
import type { ValidationReport, CleaningDecisions } from "@/components/data-validation-modal"
import { cleanColumnKey } from "@/lib/api"

// ------------------------------------------------------------------------------
// Upload / validation
// ------------------------------------------------------------------------------

const ID_LIKE = /(^id$|_id$|^id_|\bid\b|uuid|code$|number$)/i

function categoryOf(inspect: any, column: string): ColumnDefinition["dataType"] {
  const cats = inspect?.column_categories || {}
  const has = (list: string[] | undefined) => (list || []).some((k) => cleanColumnKey(k) === column)
  if (has(cats.datetime)) return "date"
  if (has(cats.numerical)) return ID_LIKE.test(column) ? "identifier" : "numeric"
  if (ID_LIKE.test(column)) return "identifier"
  return "category"
}

const REASONS: Record<ColumnDefinition["dataType"], string> = {
  date: "Detected chronological date/time field",
  numeric: "Continuous numeric metric",
  category: "Categorical grouping dimension",
  identifier: "Row identifier (usually not analysed)",
}

/** Build the DatasetMeta used across the workflow from POST /dataset/test-upload */
export function buildDatasetMetaFromBackend(
  file: { name: string; size: string; type: string },
  inspect: any,
  datasetId: number
): DatasetMeta {
  const names: string[] = inspect?.column_names || []
  const columns: ColumnDefinition[] = names.map((name) => {
    const dataType = categoryOf(inspect, name)
    return { name, dataType, isAiPick: false, reason: REASONS[dataType] }
  })

  // Default picks until the AI recommendation arrives: first date/category + numerics
  let picked = 0
  const firstGroup = columns.find((c) => c.dataType === "date") || columns.find((c) => c.dataType === "category")
  if (firstGroup) {
    firstGroup.isAiPick = true
    picked++
  }
  columns.forEach((c) => {
    if (c.dataType === "numeric" && picked < 3) {
      c.isAiPick = true
      picked++
    }
  })

  const hasDate = columns.some((c) => c.dataType === "date")
  const hasCat = columns.some((c) => c.dataType === "category")
  const numericCount = columns.filter((c) => c.dataType === "numeric").length
  const recommendedAnalysisId = hasDate && numericCount
    ? "trend"
    : hasCat && numericCount
    ? "comparison"
    : numericCount >= 2
    ? "correlation"
    : hasCat
    ? "desc_freq"
    : "desc_numeric"

  return {
    id: `backend_${datasetId}`,
    backendId: datasetId,
    name: file.name,
    size: file.size,
    type: file.type,
    rowCount: Number(inspect?.rows) || 0,
    colCount: columns.length,
    desc: `Uploaded dataset: ${file.name}`,
    recommendedAnalysisId,
    analysisReason: "Recommended from the detected column types of your dataset.",
    columns,
  }
}

/** Apply GET /dataset/:id/ai-recommend-columns result to the column picks */
export function applyAiColumnRecommendation(meta: DatasetMeta, response: any): DatasetMeta {
  const rec = response?.recommendation
  if (!rec || typeof rec !== "object") return meta
  const picks = new Set<string>(
    [rec.grouping_column, ...(Array.isArray(rec.measure_columns) ? rec.measure_columns : [])]
      .filter(Boolean)
      .map((c: string) => cleanColumnKey(c))
  )
  if (picks.size === 0) return meta
  return {
    ...meta,
    analysisReason: rec.reason || meta.analysisReason,
    columns: meta.columns.map((c) => ({
      ...c,
      isAiPick: picks.has(c.name),
      reason: picks.has(c.name) && rec.reason ? `AI: ${rec.reason}` : c.reason,
    })),
  }
}

/** Build the ValidationReport shown in the quality modals */
export function buildValidationReportFromBackend(inspect: any, preview?: any): ValidationReport {
  const recByColumn: Record<string, any> = {}
  Object.entries(inspect?.missing_value_recommendations || {}).forEach(([k, v]) => {
    recByColumn[cleanColumnKey(k)] = v
  })
  const percentages: Record<string, number> = {}
  Object.entries(inspect?.missing_percentage?.columns || {}).forEach(([k, v]: [string, any]) => {
    const pct = typeof v === "number" ? v : v?.missing_percentage
    if (typeof pct === "number") percentages[cleanColumnKey(k)] = pct
  })
  const threshold = Number(inspect?.missing_percentage?.threshold) || 20

  const numeric = new Set((inspect?.column_categories?.numerical || []).map(cleanColumnKey))
  const dates = new Set((inspect?.column_categories?.datetime || []).map(cleanColumnKey))

  const missingValues = Object.entries(inspect?.missing_values_by_column || {}).map(([key, count]) => {
    const columnName = cleanColumnKey(key)
    const dataType: "text" | "numeric" | "date" = numeric.has(columnName) ? "numeric" : dates.has(columnName) ? "date" : "text"
    const percentage = percentages[columnName] !== undefined
      ? Math.round(percentages[columnName])
      : inspect?.rows ? Math.round((Number(count) / Number(inspect.rows)) * 100) : undefined
    return {
      columnName,
      backendKey: key, // e.g. "Revenue (column 4)" as expected by /clean-missing
      count: Number(count),
      dataType,
      defaultFill: recByColumn[columnName]?.recommended_strategy === "leave_missing"
        ? (dataType === "numeric" ? "NaN" : dataType === "date" ? "NaT" : "null")
        : recByColumn[columnName]?.recommended_strategy || (dataType === "numeric" ? "mean" : "mode"),
      percentage,
      isExceededLimit: percentage !== undefined ? percentage > threshold : false,
      limitThreshold: threshold,
    }
  })

  const formatErrors = Object.entries(inspect?.invalid_formats?.columns || {}).map(([key, count]) => ({
    columnName: cleanColumnKey(key),
    count: Number(count),
    detail: "Values that do not match the column's main data format",
    detectedFormats: [],
  }))

  const previewColumns: string[] = preview?.columns || inspect?.column_names || []
  // Find the first earlier row with identical values (1-based)
  const previewRows: any[] = preview?.rows || []
  const rowKey = (values: any[]) => JSON.stringify(values.map((v) => (v === null || v === undefined ? null : String(v))))
  const findOriginal = (d: any): number => {
    const key = rowKey(d.values || [])
    const idx = previewRows.findIndex((r, i) => i < d.row - 1 && rowKey(previewColumns.map((c) => r?.[c])) === key)
    return idx >= 0 ? idx + 1 : d.row
  }
  const duplicateRows = (preview?.duplicate_rows?.duplicate_rows || []).map((d: any) => {
    const original = findOriginal(d)
    const rowData: Record<string, string> = {}
    ;(d.values || []).slice(0, 6).forEach((v: any, i: number) => {
      rowData[previewColumns[i] ?? `Column ${i + 1}`] = v === null || v === undefined ? "" : String(v)
    })
    return {
      id: `dup-row-${d.row}`,
      rowIndex: d.row,
      duplicateOfIndex: original,
      matchType: "exact" as const,
      matchRate: "100%",
      rowData,
      reason: `Row #${d.row} is an exact duplicate of Row #${original}`,
    }
  })

  const isClean = missingValues.length === 0 && formatErrors.length === 0 && duplicateRows.length === 0
  return { missingValues, formatErrors, duplicateRows, isCleaned: isClean || undefined }
}

/** Map the cleaning studio decisions to POST /dataset/:id/clean-missing strategies */
export function mapCleaningToStrategies(decisions: CleaningDecisions, report?: ValidationReport): Record<string, string> {
  const strategies: Record<string, string> = {}
  ;(report?.missingValues || []).forEach((m) => {
    if (decisions.excludedColumns?.includes(m.columnName)) return
    const choice = decisions.missingFillValues?.[m.columnName] || m.defaultFill
    const key = (m as any).backendKey || m.columnName
    if (choice === "mean" && m.dataType === "numeric") strategies[key] = "mean"
    else if (choice === "mode") strategies[key] = "mode"
    else strategies[key] = "leave_missing"
  })
  return strategies
}

/** Map backend analysis types back to the frontend analysis ids */
export function backendTypeToFrontendId(type: string): string | null {
  switch (type) {
    case "descriptive":
      return "desc_freq"
    case "comparative":
      return "comparison"
    case "relationship":
      return "correlation"
    case "distribution":
    case "outlier":
      return "desc_numeric"
    default:
      return null
  }
}

// ------------------------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------------------------

/** Frontend chart switcher ids -> backend visualization types */
export const CHART_ID_TO_VISUALIZATION: Record<string, string> = {
  line: "line_chart",
  area: "area_chart",
  stepline: "step_line_chart",
  vertical_bar: "vertical_bar_chart",
  horizontal_bar: "horizontal_bar_chart",
  lollipop: "lollipop_chart",
  donut: "donut_chart",
  pie: "pie_chart",
  bar: "frequency_bar_chart",
  histogram: "frequency_histogram",
  box: "box_plot",
  density: "density_area_curve",
  scatter: "scatter_plot_with_trendline",
  bubble: "bubble_chart",
}

function fmt(n: number): string {
  if (!isFinite(n)) return String(n)
  const abs = Math.abs(n)
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (abs >= 1e4) return `${(n / 1e3).toFixed(1)}K`
  return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2)
}

function sample<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items
  const step = items.length / max
  return Array.from({ length: max }, (_, i) => items[Math.floor(i * step)])
}

function toTrend(viz: any): TrendPoint[] | undefined {
  const data = sample<any>(viz?.data || [], 8)
  if (!data.length) return undefined
  const vals = data.map((d) => Number(d.value) || 0)
  const max = Math.max(...vals)
  const min = Math.min(...vals)
  const peak = vals.indexOf(max)
  return data.map((d, i) => {
    const x = data.length === 1 ? 250 : 40 + (420 * i) / (data.length - 1)
    const y = max === min ? 100 : 170 - ((vals[i] - min) / (max - min)) * 135
    const label = String(d.date || d.label || i + 1).slice(0, 10)
    return { x, y, label, val: vals[i], displayVal: fmt(vals[i]), isPeak: i === peak }
  })
}

function toBars(viz: any): BarItem[] | undefined {
  let rows: { name: string; v: number }[] = []
  if (Array.isArray(viz?.data) && viz.category_column) {
    rows = viz.data.map((d: any) => ({ name: String(d[viz.category_column] ?? d.category), v: Number(d.value ?? d[viz.value_column]) || 0 }))
  } else if (Array.isArray(viz?.data)) {
    rows = viz.data.map((d: any) => ({ name: String(d.category ?? d.group ?? d.label), v: Number(d.value ?? d.count) || 0 }))
  } else if (Array.isArray(viz?.charts) && viz.charts[0]) {
    rows = viz.charts[0].data.map((d: any) => ({ name: String(d.category), v: Number(d.count) || 0 }))
  }
  rows = rows.sort((a, b) => b.v - a.v).slice(0, 6)
  if (!rows.length) return undefined
  const max = Math.max(...rows.map((r) => r.v)) || 1
  return rows.map((r, i) => ({ name: r.name, val: Math.round((r.v / max) * 100), displayVal: fmt(r.v), isWarm: i === 0 }))
}

const DONUT_COLORS = ["#e99842", "#4a7ff7", "#60a5fa", "#94a3b8", "#cbd5e1"]

function toDonut(viz: any): DonutSegment[] | undefined {
  const chart = Array.isArray(viz?.charts) ? viz.charts[0] : null
  const rows: { name: string; v: number }[] = chart
    ? chart.data.map((d: any) => ({ name: String(d.category), v: Number(d.count) || 0 }))
    : Array.isArray(viz?.data)
    ? viz.data.map((d: any) => ({ name: String(d.category ?? d[viz.category_column]), v: Number(d.count ?? d.value) || 0 }))
    : []
  if (!rows.length) return undefined
  rows.sort((a, b) => b.v - a.v)
  const top = rows.slice(0, 4)
  const rest = rows.slice(4).reduce((s, r) => s + r.v, 0)
  if (rest > 0) top.push({ name: "Other", v: rest })
  const total = top.reduce((s, r) => s + r.v, 0) || 1
  return top.map((r, i) => ({
    name: r.name,
    share: Math.round((r.v / total) * 100),
    color: DONUT_COLORS[i % DONUT_COLORS.length],
    isWarm: i === 0,
    isPrimary: i === 1,
  }))
}

function toBox(viz: any): BoxPlotData | undefined {
  const b = viz?.boxes?.[0]
  if (!b) return undefined
  const outliers: number[] = b.outliers || []
  const r = (n: number) => Number(Number(n).toFixed(2))
  return {
    min: r(b.minimum),
    q1: r(b.q1),
    median: r(b.median),
    q3: r(b.q3),
    max: r(b.maximum),
    outlierValue: outliers.length ? r(Math.max(...outliers)) : r(b.maximum),
    outlierLabel: outliers.length ? `${outliers.length} outlier(s) in ${b.column}` : `No outliers in ${b.column}`,
    unit: "",
  }
}

function toHistogram(viz: any): number[] | undefined {
  const bins = viz?.histograms?.[0]?.bins
  if (!Array.isArray(bins) || !bins.length) return undefined
  const counts = sample<any>(bins, 8).map((b) => Number(b.count) || 0)
  const max = Math.max(...counts) || 1
  return counts.map((c) => Math.round((c / max) * 100))
}

function toScatter(viz: any): ScatterPoint[] | undefined {
  const data = sample<any>(viz?.data || [], 40)
  if (!data.length) return undefined
  const xs = data.map((d) => Number(d.x))
  const ys = data.map((d) => Number(d.y))
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  return data.map((d, i) => ({
    x: x1 === x0 ? 50 : ((xs[i] - x0) / (x1 - x0)) * 100,
    y: y1 === y0 ? 50 : ((ys[i] - y0) / (y1 - y0)) * 100,
    name: `P${i + 1}`,
    xVal: fmt(xs[i]),
    yVal: fmt(ys[i]),
  }))
}

/** Merge a single backend visualization result into a story config */
export function mergeVisualization(story: StoryBoardConfig, viz: any): StoryBoardConfig {
  if (!viz || typeof viz !== "object") return story
  const t = viz.visualization_type as string
  const next = { ...story }
  if (["line_chart", "area_chart", "step_line_chart"].includes(t)) next.trendData = toTrend(viz) || next.trendData
  if (["vertical_bar_chart", "horizontal_bar_chart", "lollipop_chart", "frequency_bar_chart", "stacked_proportional_bar"].includes(t)) {
    next.barData = toBars(viz) || next.barData
  }
  if (["pie_chart", "donut_chart", "frequency_bar_chart"].includes(t)) next.donutData = toDonut(viz) || next.donutData
  if (t === "box_plot") next.boxPlotData = toBox(viz) || next.boxPlotData
  if (t === "frequency_histogram") next.histogramBars = toHistogram(viz) || next.histogramBars
  if (t === "scatter_plot_with_trendline" || t === "bubble_chart") next.scatterData = toScatter(viz) || next.scatterData
  return next
}

/** Split the plain-text AI explanation into a short summary + insight bullets */
function splitExplanation(text: string): { summary: string; bullets: string[] } {
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^[#*\-\d.)\s]+/, "").replace(/\*\*/g, "").trim())
    .filter((l) => l.length > 25)
  return { summary: lines[0] || text.slice(0, 300), bullets: lines.slice(1, 6) }
}

/** Build the storyboard from POST /analysis/execute */
export function applyAnalysisResultToStory(
  base: StoryBoardConfig,
  result: any,
  meta?: DatasetMeta | null
): StoryBoardConfig {
  if (!result) return base
  let story: StoryBoardConfig = { ...base }
  ;(result.charts || []).forEach((c: any) => {
    story = mergeVisualization(story, c.visualization)
  })

  const cols: string[] = result.selected_columns || []
  story.datasetTitle = meta?.name || story.datasetTitle
  story.analysisTitle = `${String(result.analysis_type || "").replace(/^\w/, (c: string) => c.toUpperCase())} analysis of ${cols.join(", ")}`
  story.metrics = [
    { label: "Observed Records", value: `${(meta?.rowCount || 0).toLocaleString()} Rows`, badge: "Server", isWarm: false },
    { label: "Selected Columns", value: cols.slice(0, 2).join(" & ") || "-", badge: `${cols.length} cols`, isWarm: true },
    { label: "Charts Generated", value: String((result.charts || []).length), badge: "AI", isWarm: false },
  ]

  const chartReasons = (result.charts || []).map((c: any) => c.purpose || c.reason).filter(Boolean)
  if (typeof result.ai_explanation === "string" && result.ai_explanation.trim()) {
    const { summary, bullets } = splitExplanation(result.ai_explanation)
    story.chartExplanation = (result.charts?.[0]?.reason as string) || summary
    story.takeawayMessage = summary
    story.insights = bullets.length ? bullets : chartReasons.length ? chartReasons : story.insights
  } else if (chartReasons.length) {
    story.chartExplanation = result.charts[0].reason || story.chartExplanation
    story.insights = chartReasons
  }
  return story
}
