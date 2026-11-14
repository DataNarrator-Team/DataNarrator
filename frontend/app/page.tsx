"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { AuthView } from "@/components/auth-view"

export default function RootPage() {
  const router = useRouter()

  // Authentication router redirecting users based on role
  return (
    <AuthView
      onSuccess={(role) => {
        if (role === "admin") {
          router.push("/admin")
        } else {
          router.push("/upload")
        }
      }}
    />
  )
}
