"use client"

import { useState } from "react"
import { PromptGeneratorForm } from "@/components/prompt-generator-form"
import { PromptTools } from "@/components/prompt-tools"
import { PromptShare } from "@/components/prompt-share"
import { Code2, Terminal, Sparkles, Wrench, Share2 } from "lucide-react"

type Tab = "generate" | "tools" | "share"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("generate")

  const tabs = [
    { id: "generate" as const, label: "Generate", icon: <Sparkles className="h-4 w-4" /> },
    { id: "tools" as const, label: "Tools", icon: <Wrench className="h-4 w-4" /> },
    { id: "share" as const, label: "Share", icon: <Share2 className="h-4 w-4" /> },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "generate":
        return <PromptGeneratorForm />
      case "tools":
        return <PromptTools />
      case "share":
        return <PromptShare />
      default:
        return <PromptGeneratorForm />
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
              <Terminal className="h-4 w-4 text-foreground" />
            </div>
            <span className="font-semibold text-foreground">DevPrompt Studio</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-accent">
            <Code2 className="h-3 w-3" />
            For Developers
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            DevPrompt Studio
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-pretty text-muted-foreground">
            7 generator modes, 10 analysis tools, and sharing options.
            Create, analyze, and share AI prompts for production applications.
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-10">
        <div className="mx-auto max-w-6xl px-6">
          {renderContent()}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Paste the generated prompt directly into any AI system.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-foreground font-medium">Robert Mestre</span>
              <span className="text-muted-foreground">·</span>
              <a 
                href="mailto:robertmestre@proton.me" 
                className="text-accent hover:underline transition-colors"
              >
                robertmestre@proton.me
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
