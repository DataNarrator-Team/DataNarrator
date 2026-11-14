import React from "react"
import Link from "next/link"
import { Table2, BarChart3, FileSearch, LucideIcon } from "lucide-react"

// Feature items list
const features = [
  {
    icon: Table2,
    title: "Upload & Validate",
    description: "Drop your CSV or Excel files. We instantly inspect your data, detect format issues, and flag missing values.",
    color: "text-[#b5762f]",
    bg: "bg-[#b5762f]/10",
    href: "/upload",
  },
  {
    icon: BarChart3,
    title: "Visualize Insights",
    description: "Transform verified numbers into clear, interactive charts tailored to your metrics.",
    color: "text-[#1a3a5c]",
    bg: "bg-[#1a3a5c]/10",
    href: "/upload",
  },
  {
    icon: FileSearch,
    title: "Generate Narrative Analysis",
    description: "Get automated insights and written insights from your data.",
    color: "text-[#4a9fc0]",
    bg: "bg-[#4a9fc0]/10",
    href: "/upload",
  },
]

// 1. Single Feature Card Item Component
function FeatureCardItem({
  icon: Icon,
  title,
  description,
  color,
  bg,
  href,
}: {
  icon: LucideIcon
  title: string
  description: string
  color: string
  bg: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition hover:border-[#4a7ff7]/50 hover:bg-white hover:shadow-md cursor-pointer"
    >
      <div className={`mb-4 inline-flex rounded-xl p-3 ${bg} transition group-hover:scale-105`}>
        <Icon className={`size-6 ${color}`} />
      </div>
      <h3 className="mb-1 text-base font-semibold text-slate-800 transition group-hover:text-[#4a7ff7]">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-slate-500">
        {description}
      </p>
    </Link>
  )
}

// 2. Primary Feature Cards Grid Container
export function FeatureCards() {
  return (
    <section aria-label="What DataNarrator does" className="grid gap-4 sm:grid-cols-3">
      {features.map((feature) => (
        <FeatureCardItem key={feature.title} {...feature} />
      ))}
    </section>
  )
}

export default FeatureCards