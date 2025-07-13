"use client"

import { Spinner } from "@/components/ui/spinner"

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = "読み込み中..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}