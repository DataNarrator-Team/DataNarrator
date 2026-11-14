"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { FolderKanban, Plus, Loader2 } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { DecorativeBackground } from "@/components/decorative-background"
import { AppFooter } from "@/components/app-footer"

// ----------------------------------------------------
// 1. Data Fetching Services
// ----------------------------------------------------
// Project services
async function fetchProjects() {
  // Mock API request
  const response = await fetch("/api/projects")
  if (!response.ok) {
    throw new Error("Failed to load projects")
  }
  return response.json()
}

// ----------------------------------------------------
// 2. Sub-Components
// ----------------------------------------------------

// Create Project Button
function CreateProjectButton() {
  return (
    <Link
      href="/upload"
      className="inline-flex items-center gap-2 rounded-xl bg-[#4a7ff7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3870ec] active:scale-95 cursor-pointer"
    >
      <Plus className="size-4" />
      Create new project
    </Link>
  )
}

// Empty State View
function EmptyStateView() {
  return (
    <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#23262e]/90 p-8 text-center shadow-sm backdrop-blur-md">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#4a7ff7]/10 text-[#4a7ff7]">
        <FolderKanban className="size-8" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-zinc-100">
        No projects yet
      </h2>
      <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-500 dark:text-zinc-300">
        You haven&apos;t created or uploaded any datasets yet. Start your first analysis now!
      </p>
      <CreateProjectButton />
    </div>
  )
}

// Loading View
function LoadingView() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-zinc-500">
      <Loader2 className="size-8 animate-spin text-[#4a7ff7]" />
      <span className="text-sm">Loading your projects...</span>
    </div>
  )
}

// Project Card
function ProjectCard({ project }: { project: any }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#252830] p-5 shadow-sm transition hover:shadow-md">
      <h3 className="font-semibold text-slate-800 dark:text-zinc-100">{project.name}</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-300">{project.updatedAt}</p>
    </div>
  )
}

// Projects Content Renderer
function ProjectsContent({ projects, isLoading }: { projects: any[], isLoading: boolean }) {
  if (isLoading) return <LoadingView />
  if (!projects || projects.length === 0) return <EmptyStateView />

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

// ----------------------------------------------------
// 3. Orchestrator Page
// ----------------------------------------------------
export default function MyProjectsPage() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Page orchestrates components
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-white dark:bg-[#181a20]">
      <DecorativeBackground />
      <AppSidebar />
      <main className="relative z-10 flex flex-1 flex-col h-full min-w-0 overflow-y-auto">
        <div className="flex-1 flex w-full items-center justify-center px-6 py-10 sm:px-10">
          <ProjectsContent projects={projects} isLoading={isLoading} />
        </div>
        <AppFooter className="mt-auto w-full" />
      </main>
    </div>
  )
}