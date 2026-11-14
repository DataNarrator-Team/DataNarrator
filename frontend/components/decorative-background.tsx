"use client"

import React from "react"

// 1. Warm Data Flow Lines (Wide, elegant linear streams in signature warm tones)
export function WarmFlowLines({
  className = "",
  flip = false,
  variant = 1,
}: {
  className?: string
  flip?: boolean
  variant?: 1 | 2 | 3
}) {
  return (
    <svg
      className={`pointer-events-none select-none transition-colors w-full ${
        flip ? "-scale-x-100" : ""
      } ${className}`}
      viewBox="0 0 1920 380"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Stream line 1 - Upper dashed trajectory */}
      <path
        d={
          variant === 2
            ? "M-50 160 C 350 40, 750 260, 1150 90 C 1450 30, 1750 200, 1980 120"
            : variant === 3
            ? "M-50 80 C 400 220, 850 60, 1250 240 C 1550 120, 1800 180, 1980 140"
            : "M-50 110 C 320 30, 720 220, 1120 80 C 1420 30, 1720 190, 1980 120"
        }
        stroke="#F4D9C2"
        strokeWidth="2.5"
        strokeDasharray="8 10"
        className="opacity-45 dark:opacity-15"
      />

      {/* Stream line 2 - Secondary flowing wave */}
      <path
        d={
          variant === 2
            ? "M-50 220 C 380 90, 780 290, 1180 150 C 1480 80, 1780 240, 1980 170"
            : variant === 3
            ? "M-50 140 C 360 260, 820 110, 1280 270 C 1580 160, 1790 230, 1980 190"
            : "M-50 170 C 350 80, 750 260, 1150 130 C 1460 70, 1740 230, 1980 165"
        }
        stroke="#E6B894"
        strokeWidth="2"
        className="opacity-35 dark:opacity-15"
      />

      {/* Stream line 3 - Primary thick wave in signature warm tone */}
      <path
        d={
          variant === 2
            ? "M-50 270 C 400 150, 820 330, 1220 210 C 1500 140, 1800 280, 1980 225"
            : variant === 3
            ? "M-50 200 C 420 300, 880 170, 1320 320 C 1600 220, 1820 280, 1980 250"
            : "M-50 230 C 380 130, 800 300, 1200 180 C 1500 120, 1780 270, 1980 220"
        }
        stroke="#FCEDDF"
        strokeWidth="4"
        strokeLinecap="round"
        className="opacity-60 dark:opacity-25"
      />

      {/* Stream line 4 - Lower rhythmic dashed track */}
      <path
        d={
          variant === 2
            ? "M-50 320 C 420 210, 850 370, 1250 260 C 1520 200, 1820 320, 1980 275"
            : variant === 3
            ? "M-50 250 C 450 340, 920 220, 1360 360 C 1640 260, 1850 320, 1980 295"
            : "M-50 290 C 400 190, 840 350, 1240 240 C 1530 180, 1800 310, 1980 270"
        }
        stroke="#F5DDC6"
        strokeWidth="2"
        strokeDasharray="6 8"
        className="opacity-40 dark:opacity-15"
      />

      {/* Vertical cross-grid connectors */}
      <line x1="380" y1="40" x2="380" y2="340" stroke="#FCEDDF" strokeWidth="1.2" strokeDasharray="4 6" className="opacity-30 dark:opacity-10" />
      <line x1="860" y1="50" x2="860" y2="350" stroke="#FCEDDF" strokeWidth="1.2" strokeDasharray="4 6" className="opacity-30 dark:opacity-10" />
      <line x1="1340" y1="30" x2="1340" y2="330" stroke="#FCEDDF" strokeWidth="1.2" strokeDasharray="4 6" className="opacity-30 dark:opacity-10" />

      {/* Modern Data Nodes */}
      <circle cx="380" cy={variant === 2 ? 140 : 120} r="4.5" fill="#E6B894" className="opacity-55 dark:opacity-25" />
      <circle cx="860" cy={variant === 2 ? 260 : 240} r="5" fill="#E6B894" className="opacity-60 dark:opacity-30" />
      <circle cx="1340" cy={variant === 2 ? 180 : 160} r="4.5" fill="#F4D9C2" className="opacity-55 dark:opacity-25" />
      <circle cx="1120" cy="80" r="3.5" fill="#E6B894" className="opacity-50 dark:opacity-20" />
    </svg>
  )
}

// 2. Charts Shape (Bar & Line Chart Box with overlapping card)
export function ChartsShape({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`text-[#d3dde7] dark:text-zinc-500/70 transition-colors ${className}`}
      viewBox="0 0 220 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="10" y="10" width="130" height="90" rx="6" />
      <line x1="10" y1="28" x2="140" y2="28" />
      <rect x="24" y="60" width="12" height="28" fill="currentColor" stroke="none" opacity="0.4" />
      <rect x="42" y="48" width="12" height="40" fill="currentColor" stroke="none" opacity="0.4" />
      <rect x="60" y="66" width="12" height="22" fill="currentColor" stroke="none" opacity="0.4" />
      <polyline points="88,80 104,58 118,68 132,44" fill="none" />
      <rect x="70" y="80" width="120" height="70" rx="6" />
      <circle cx="100" cy="115" r="18" />
    </svg>
  )
}

// 3. Database Shape (Cylinder Drum with overlapping card)
export function DatabaseShape({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`text-[#d3dde7] dark:text-zinc-500/70 transition-colors ${className}`}
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <ellipse cx="70" cy="55" rx="45" ry="16" />
      <path d="M25 55 V95 A45 16 0 0 0 115 95 V55" />
      <path d="M25 95 V135 A45 16 0 0 0 115 135 V95" />
      <rect x="95" y="120" width="95" height="65" rx="6" />
      <circle cx="120" cy="152" r="14" />
    </svg>
  )
}

// 4. Dashboard Shape (Trend Line Window with mini bar card)
export function DashboardShape({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`text-[#d3dde7] dark:text-zinc-500/70 transition-colors ${className}`}
      viewBox="0 0 240 180"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="10" y="10" width="180" height="120" rx="6" />
      <line x1="10" y1="30" x2="190" y2="30" />
      <polyline points="30,110 70,80 100,95 140,55 180,70" fill="none" />
      <rect x="150" y="90" width="80" height="80" rx="6" />
      <rect x="164" y="140" width="10" height="18" fill="currentColor" stroke="none" opacity="0.4" />
      <rect x="180" y="128" width="10" height="30" fill="currentColor" stroke="none" opacity="0.4" />
      <rect x="196" y="118" width="10" height="40" fill="currentColor" stroke="none" opacity="0.4" />
    </svg>
  )
}

// 5. Circuit Lines Shape (Right / Left Circuit lines with node circles)
export function CircuitLinesShape({
  className = "",
  flip = false,
}: {
  className?: string
  flip?: boolean
}) {
  return (
    <svg
      className={`text-[#d3dde7] dark:text-zinc-500/70 transition-colors ${
        flip ? "-scale-x-100" : ""
      } ${className}`}
      viewBox="0 0 80 140"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M70 10 V50 H30" />
      <circle cx="24" cy="50" r="5" />
      <path d="M60 90 V130" />
      <circle cx="60" cy="86" r="5" />
    </svg>
  )
}

// 6. Dot Grid Matrix
export function DotGrid({ className = "" }: { className?: string }) {
  const dots = []
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      dots.push(<circle key={`${r}-${c}`} cx={4 + c * 12} cy={4 + r * 12} r="2" />)
    }
  }
  return (
    <svg
      className={`text-[#d3dde7] dark:text-zinc-500/70 transition-colors ${className}`}
      viewBox="0 0 60 60"
      fill="currentColor"
    >
      {dots}
    </svg>
  )
}

// ==========================================
// 7. Main Decorative Background Component
// ==========================================
interface DecorativeBackgroundProps {
  extended?: boolean
  className?: string
}

export function DecorativeBackground({ extended = false, className = "" }: DecorativeBackgroundProps) {
  // A) Default background for standard pages (subtle and transparent)
  if (!extended) {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden select-none opacity-60 dark:opacity-45 transition-opacity ${className}`}
      >
        <ChartsShape className="absolute -left-6 top-10 w-56 opacity-75" />
        <DatabaseShape className="absolute -left-4 bottom-6 w-52 opacity-75" />
        <DashboardShape className="absolute -right-6 bottom-10 w-64 opacity-75" />
        <CircuitLinesShape className="absolute right-6 top-1/3 h-40 w-24 opacity-75" />
        <DotGrid className="absolute right-16 top-10 h-14 w-14 opacity-65" />
        <DotGrid className="absolute left-1/3 bottom-8 h-14 w-14 opacity-65" />
      </div>
    )
  }

  // B) Extended decorative background (landing page - well balanced and soft)
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none opacity-50 dark:opacity-35 transition-opacity ${className}`}
    >
      {/* 1. Hero Section - Full-width wide linear data streams */}
      <div className="absolute inset-x-0 top-0 h-[460px] w-full overflow-hidden">
        <WarmFlowLines variant={1} className="w-full h-full opacity-60" />
      </div>
      <ChartsShape className="absolute -left-6 top-10 w-56 opacity-65" />
      <CircuitLinesShape className="absolute right-6 top-28 h-40 w-24 opacity-60" />
      <DotGrid className="absolute right-20 top-10 h-14 w-14 opacity-55" />
      <DotGrid className="absolute left-1/4 top-80 h-14 w-14 opacity-50" />

      {/* 2. Metrics Section - Flows across stats */}
      <div className="absolute inset-x-0 top-[20%] h-[420px] w-full overflow-hidden">
        <WarmFlowLines variant={2} flip className="w-full h-full opacity-50" />
      </div>
      <DatabaseShape className="absolute -right-6 top-[22%] w-52 opacity-70" />
      <CircuitLinesShape flip className="absolute left-6 top-[26%] h-40 w-24 opacity-65" />
      <DashboardShape className="absolute -left-8 top-[33%] w-60 opacity-65" />
      <DotGrid className="absolute right-1/4 top-[24%] h-14 w-14 opacity-50" />
      <DotGrid className="absolute left-12 top-[37%] h-14 w-14 opacity-50" />

      {/* 3. Workflow Steps Section - Flows across features */}
      <div className="absolute inset-x-0 top-[43%] h-[440px] w-full overflow-hidden">
        <WarmFlowLines variant={3} className="w-full h-full opacity-55" />
      </div>
      <ChartsShape className="absolute -right-8 top-[44%] w-56 opacity-70" />
      <CircuitLinesShape className="absolute right-8 top-[50%] h-40 w-24 opacity-70" />
      <DatabaseShape className="absolute -left-6 top-[52%] w-52 opacity-70" />
      <DotGrid className="absolute right-12 top-[55%] h-14 w-14 opacity-50" />
      <DotGrid className="absolute left-1/3 top-[48%] h-14 w-14 opacity-50" />

      {/* 4. Lower Section / Transitions */}
      <div className="absolute inset-x-0 top-[65%] h-[420px] w-full overflow-hidden">
        <WarmFlowLines variant={1} flip className="w-full h-full opacity-45" />
      </div>
      <DashboardShape className="absolute -right-6 top-[66%] w-64 opacity-70" />
      <CircuitLinesShape flip className="absolute left-6 top-[70%] h-40 w-24 opacity-65" />
      <ChartsShape className="absolute -left-8 top-[76%] w-56 opacity-70" />
      <DotGrid className="absolute right-1/4 top-[72%] h-14 w-14 opacity-50" />
      <DotGrid className="absolute left-16 top-[79%] h-14 w-14 opacity-50" />

      {/* 5. Bottom & Footer Section */}
      <div className="absolute inset-x-0 bottom-0 h-[380px] w-full overflow-hidden">
        <WarmFlowLines variant={2} className="w-full h-full opacity-50" />
      </div>
      <DatabaseShape className="absolute -left-4 bottom-8 w-52 opacity-85" />
      <DashboardShape className="absolute -right-6 bottom-10 w-64 opacity-85" />
      <CircuitLinesShape className="absolute right-8 bottom-44 h-40 w-24 opacity-75" />
      <DotGrid className="absolute left-1/3 bottom-8 h-14 w-14 opacity-70" />
      <DotGrid className="absolute right-20 bottom-36 h-14 w-14 opacity-70" />
    </div>
  )
}

export default DecorativeBackground