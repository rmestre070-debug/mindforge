"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, Copy, Sparkles, History, Trash2, ChevronDown, ChevronUp, Layers, Code, Palette, Server, Boxes, TestTube, Zap } from "lucide-react"

type GeneratorMode = 
  | "architecture"
  | "code"
  | "uiux"
  | "backend"
  | "fullstack"
  | "testing"
  | "performance"

interface ModeConfig {
  id: GeneratorMode
  label: string
  description: string
  icon: React.ReactNode
  fields: FieldConfig[]
  rolePrompt: string
  outputDescription: string
}

interface FieldConfig {
  key: string
  label: string
  placeholder: string
  rows: number
}

interface HistoryItem {
  id: string
  prompt: string
  mode: GeneratorMode
  label: string
  timestamp: Date
}

const modeConfigs: ModeConfig[] = [
  {
    id: "architecture",
    label: "Architecture",
    description: "System design, diagrams, component breakdowns",
    icon: <Layers className="h-4 w-4" />,
    rolePrompt: "You are a senior software architect specializing in system design and scalable architectures.",
    outputDescription: "system architecture diagram (text-based), component breakdown, data flow, API structure, storage model, and security considerations with reasoning",
    fields: [
      { key: "appType", label: "App Type", placeholder: "web, mobile, desktop, API, microservices", rows: 1 },
      { key: "scale", label: "Scale", placeholder: "startup MVP, mid-scale (10K users), enterprise (1M+ users)", rows: 1 },
      { key: "techStack", label: "Tech Stack", placeholder: "Node.js, PostgreSQL, Redis, AWS", rows: 1 },
      { key: "features", label: "Core Features", placeholder: "User auth\nReal-time messaging\nFile storage\nAnalytics dashboard", rows: 4 },
      { key: "constraints", label: "Constraints", placeholder: "Sub-100ms latency\n99.99% uptime\nGDPR compliance\nMulti-region deployment", rows: 3 },
    ],
  },
  {
    id: "code",
    label: "Code-First",
    description: "Production-ready code with file structure",
    icon: <Code className="h-4 w-4" />,
    rolePrompt: "You are a senior software engineer specializing in writing clean, production-ready code.",
    outputDescription: "complete production-ready code with file structure, coding standards applied, and all components implemented",
    fields: [
      { key: "language", label: "Language", placeholder: "TypeScript, Python, Go, Rust", rows: 1 },
      { key: "framework", label: "Framework", placeholder: "Next.js 16, FastAPI, Gin, Actix", rows: 1 },
      { key: "features", label: "Features", placeholder: "CRUD operations\nAuthentication\nFile upload\nSearch with filters", rows: 4 },
      { key: "dataModel", label: "Data Model", placeholder: "Users (id, email, role)\nPosts (id, title, content, authorId)\nComments (id, text, postId, userId)", rows: 3 },
      { key: "uiStyle", label: "UI Style", placeholder: "Minimal dark theme, shadcn/ui, responsive", rows: 1 },
      { key: "constraints", label: "Constraints", placeholder: "Type-safe\nFully tested\nAccessible (WCAG 2.1)\nOptimized for Core Web Vitals", rows: 3 },
    ],
  },
  {
    id: "uiux",
    label: "UI/UX",
    description: "Screens, components, layouts, styling",
    icon: <Palette className="h-4 w-4" />,
    rolePrompt: "You are a senior UI/UX engineer specializing in component architecture and design systems.",
    outputDescription: "UI screens, component tree, layout rules, styling guidelines, and interaction patterns with code or detailed specs",
    fields: [
      { key: "platform", label: "Platform", placeholder: "web, iOS, Android, desktop, cross-platform", rows: 1 },
      { key: "designSystem", label: "Design System", placeholder: "shadcn/ui, Material UI, Tailwind, custom", rows: 1 },
      { key: "colorTheme", label: "Color Theme", placeholder: "Dark mode primary, neutral grays, cyan accent", rows: 1 },
      { key: "components", label: "Components", placeholder: "Navigation bar\nDashboard cards\nData tables\nForm inputs\nModal dialogs", rows: 4 },
      { key: "interactions", label: "Interactions", placeholder: "Hover states\nLoading skeletons\nPage transitions\nDrag and drop\nKeyboard navigation", rows: 3 },
      { key: "constraints", label: "Constraints", placeholder: "Mobile-first\nWCAG 2.1 AA\n60fps animations\nRTL support", rows: 2 },
    ],
  },
  {
    id: "backend",
    label: "API & Backend",
    description: "Endpoints, schemas, auth, database",
    icon: <Server className="h-4 w-4" />,
    rolePrompt: "You are a senior backend engineer specializing in API design and database architecture.",
    outputDescription: "API endpoints with request/response schemas, authentication model, database schema, error handling patterns, and middleware structure",
    fields: [
      { key: "stack", label: "Stack", placeholder: "Node.js/Express, Python/FastAPI, Go/Gin", rows: 1 },
      { key: "features", label: "Features", placeholder: "User CRUD\nJWT authentication\nFile uploads to S3\nWebhook processing", rows: 4 },
      { key: "dataRules", label: "Data Rules", placeholder: "Soft deletes\nAudit logging\nOptimistic locking\nPagination (cursor-based)", rows: 3 },
      { key: "authModel", label: "Auth Model", placeholder: "JWT with refresh tokens, RBAC (admin, user, guest), API keys for services", rows: 2 },
      { key: "security", label: "Security Constraints", placeholder: "Rate limiting\nInput validation\nSQL injection prevention\nCORS policy\nSecrets management", rows: 3 },
    ],
  },
  {
    id: "fullstack",
    label: "Full-Stack",
    description: "Complete app with frontend, backend, database",
    icon: <Boxes className="h-4 w-4" />,
    rolePrompt: "You are a senior full-stack engineer capable of building complete, production-ready applications.",
    outputDescription: "complete full-stack application with frontend components, backend API, database schema, authentication, and deployment configuration",
    fields: [
      { key: "appType", label: "App Type", placeholder: "SaaS dashboard, e-commerce, social platform, internal tool", rows: 1 },
      { key: "stack", label: "Stack", placeholder: "Next.js 16, TypeScript, PostgreSQL, Prisma, Tailwind", rows: 1 },
      { key: "features", label: "Features", placeholder: "User auth with OAuth\nDashboard with charts\nCRUD for resources\nReal-time notifications", rows: 4 },
      { key: "dataModel", label: "Data Model", placeholder: "Users, Organizations, Projects, Tasks, Comments", rows: 2 },
      { key: "uiStyle", label: "UI Style", placeholder: "Clean, professional, dark/light mode, shadcn/ui", rows: 1 },
      { key: "constraints", label: "Constraints", placeholder: "Type-safe end-to-end\nOptimistic updates\nOffline support\nSEO optimized", rows: 3 },
    ],
  },
  {
    id: "testing",
    label: "Testing & QA",
    description: "Test suites, coverage, edge cases, mocks",
    icon: <TestTube className="h-4 w-4" />,
    rolePrompt: "You are a senior QA engineer specializing in test automation and comprehensive test coverage.",
    outputDescription: "unit tests, integration tests, edge case coverage, mock data factories, and test utilities",
    fields: [
      { key: "language", label: "Language", placeholder: "TypeScript, Python, Go", rows: 1 },
      { key: "framework", label: "Test Framework", placeholder: "Jest, Vitest, Pytest, testing-library", rows: 1 },
      { key: "modules", label: "Modules to Test", placeholder: "Auth service\nPayment processing\nUser API endpoints\nForm validation logic", rows: 4 },
      { key: "testTypes", label: "Test Types", placeholder: "Unit tests\nIntegration tests\nE2E tests\nSnapshot tests", rows: 3 },
      { key: "edgeCases", label: "Edge Cases", placeholder: "Empty inputs\nInvalid data\nNetwork failures\nRace conditions\nBoundary values", rows: 3 },
      { key: "constraints", label: "Constraints", placeholder: "90%+ coverage\nFast execution (<5s)\nNo flaky tests\nCI/CD compatible", rows: 2 },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    description: "Optimization, profiling, efficiency",
    icon: <Zap className="h-4 w-4" />,
    rolePrompt: "You are a senior performance engineer specializing in optimization and high-efficiency systems.",
    outputDescription: "optimization strategies, refactored code, caching implementation, profiling recommendations, and performance metrics",
    fields: [
      { key: "platform", label: "Platform", placeholder: "web frontend, Node.js backend, mobile app, database", rows: 1 },
      { key: "bottlenecks", label: "Current Bottlenecks", placeholder: "Slow API responses (2s+)\nLarge bundle size (500KB)\nDatabase N+1 queries\nMemory leaks", rows: 4 },
      { key: "currentStack", label: "Current Stack", placeholder: "React, Node.js, PostgreSQL, Redis", rows: 1 },
      { key: "metrics", label: "Target Metrics", placeholder: "LCP < 2.5s\nAPI response < 100ms\nBundle < 200KB\nMemory < 256MB", rows: 3 },
      { key: "constraints", label: "Constraints", placeholder: "No breaking changes\nBackward compatible\nMinimal dependencies\nMaintain readability", rows: 3 },
    ],
  },
]

const appTypeSuggestions: Record<string, Record<string, string>> = {
  web: {
    stack: "Next.js 16, TypeScript, Tailwind CSS, PostgreSQL, Prisma",
    features: "User authentication\nResponsive dashboard\nAPI routes\nForm validation",
    constraints: "WCAG 2.1 AA compliance\nCore Web Vitals optimization\nSSR/SSG where appropriate",
  },
  mobile: {
    stack: "React Native, Expo, TypeScript, Zustand, React Query",
    features: "Native navigation\nPush notifications\nOffline data sync\nBiometric authentication",
    constraints: "iOS and Android compatibility\n60fps animations\nMinimal battery drain",
  },
  desktop: {
    stack: "Electron, React, TypeScript, Tailwind CSS, SQLite",
    features: "System tray integration\nFile system access\nAuto-updates\nKeyboard shortcuts",
    constraints: "Cross-platform (Windows, macOS, Linux)\nLow memory footprint\nFast startup",
  },
  api: {
    stack: "Node.js, Express/Fastify, TypeScript, PostgreSQL, Redis, JWT",
    features: "RESTful endpoints\nAuthentication middleware\nRate limiting\nRequest validation",
    constraints: "Sub-100ms response times\nHorizontal scalability\n99.9% uptime",
  },
}

export function PromptGeneratorForm() {
  const [selectedMode, setSelectedMode] = useState<GeneratorMode>("fullstack")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [autoFill, setAutoFill] = useState(true)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null)

  const currentConfig = modeConfigs.find((m) => m.id === selectedMode)!

  const handleModeChange = (mode: GeneratorMode) => {
    setSelectedMode(mode)
    setFormData({})
    setGeneratedPrompt("")
  }

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))

    // Auto-fill for appType field
    if ((key === "appType" || key === "platform") && autoFill) {
      const normalizedType = value.toLowerCase().trim()
      const suggestions = appTypeSuggestions[normalizedType]
      if (suggestions) {
        setFormData((prev) => ({
          ...prev,
          [key]: value,
          ...suggestions,
        }))
      }
    }
  }

  const generatePrompt = () => {
    const parts: string[] = []

    // Role
    parts.push(currentConfig.rolePrompt)

    // Objective based on mode
    parts.push(`\n\n## Objective\nGenerate ${currentConfig.outputDescription}.`)

    // Dynamic sections based on filled fields
    const filledFields = currentConfig.fields.filter((f) => formData[f.key]?.trim())
    
    if (filledFields.length > 0) {
      parts.push("\n\n## Requirements")
      
      filledFields.forEach((field) => {
        const value = formData[field.key].trim()
        const isMultiline = value.includes("\n")
        
        if (isMultiline) {
          const items = value.split("\n").map((line) => `- ${line.trim()}`).filter((l) => l !== "- ").join("\n")
          parts.push(`\n\n**${field.label}:**\n${items}`)
        } else {
          parts.push(`\n\n**${field.label}:** ${value}`)
        }
      })
    }

    // Mode-specific output instructions
    const outputInstructions: Record<GeneratorMode, string> = {
      architecture: "\n\n## Expected Output\n- System architecture diagram (ASCII/text-based)\n- Component breakdown with responsibilities\n- Data flow description\n- API structure overview\n- Storage model\n- Security considerations\n- Trade-off analysis and reasoning",
      code: "\n\n## Expected Output\n- Complete file structure\n- Production-ready code for all components\n- Type definitions\n- Error handling\n- Comments for complex logic only",
      uiux: "\n\n## Expected Output\n- Component hierarchy/tree\n- Layout specifications\n- Styling guidelines with tokens\n- Interaction states\n- Responsive breakpoints\n- Accessibility annotations\n- Code or detailed specs",
      backend: "\n\n## Expected Output\n- API endpoint definitions (method, path, description)\n- Request/response schemas\n- Database schema with relationships\n- Authentication/authorization flow\n- Error response formats\n- Middleware structure",
      fullstack: "\n\n## Expected Output\n- Complete file structure\n- Frontend components with styling\n- Backend API routes\n- Database schema and migrations\n- Authentication implementation\n- Environment configuration",
      testing: "\n\n## Expected Output\n- Test file structure\n- Unit tests with assertions\n- Integration test scenarios\n- Mock data factories\n- Edge case coverage\n- Test utilities and helpers",
      performance: "\n\n## Expected Output\n- Performance analysis\n- Optimization strategies with priority\n- Refactored code snippets\n- Caching implementation\n- Monitoring recommendations\n- Before/after metrics estimates",
    }

    parts.push(outputInstructions[selectedMode])

    // Final instruction
    parts.push("\n\n---\nDeliver production-ready output. No placeholders. No filler explanations.")

    const newPrompt = parts.join("")
    setGeneratedPrompt(newPrompt)

    // Add to history
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      prompt: newPrompt,
      mode: selectedMode,
      label: formData.appType || formData.platform || formData.language || currentConfig.label,
      timestamp: new Date(),
    }
    setHistory((prev) => [historyItem, ...prev].slice(0, 20))
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const clearForm = () => {
    setFormData({})
    setGeneratedPrompt("")
  }

  const copyHistoryItem = async (item: HistoryItem) => {
    await navigator.clipboard.writeText(item.prompt)
    setCopiedHistoryId(item.id)
    setTimeout(() => setCopiedHistoryId(null), 2000)
  }

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }

  const loadHistoryItem = (item: HistoryItem) => {
    setGeneratedPrompt(item.prompt)
    setSelectedMode(item.mode)
  }

  const clearHistory = () => {
    setHistory([])
  }

  return (
    <div className="space-y-8">
      {/* Mode Selector */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Select Generator Mode</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {modeConfigs.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={`flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-center transition-all ${
                selectedMode === mode.id
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-accent/50 hover:text-foreground"
              }`}
            >
              {mode.icon}
              <span className="text-xs font-medium">{mode.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{currentConfig.description}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">Input Fields</h2>
            <Button variant="ghost" size="sm" onClick={clearForm} className="text-muted-foreground hover:text-foreground">
              Clear all
            </Button>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3 border border-border">
            <Checkbox
              id="autofill"
              checked={autoFill}
              onCheckedChange={(checked) => setAutoFill(checked === true)}
              className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
            />
            <label htmlFor="autofill" className="text-sm text-muted-foreground cursor-pointer select-none">
              Auto-fill suggestions based on app type
            </label>
          </div>

          <div className="space-y-5">
            {currentConfig.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{field.label}</label>
                <Textarea
                  placeholder={field.placeholder}
                  value={formData[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  rows={field.rows}
                  className="resize-none bg-input border-border placeholder:text-muted-foreground/50 focus:ring-accent"
                />
              </div>
            ))}
          </div>

          <Button onClick={generatePrompt} className="w-full gap-2" size="lg">
            <Sparkles className="h-4 w-4" />
            Generate {currentConfig.label} Prompt
          </Button>
        </div>

        {/* Output */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">Generated Prompt</h2>
            {generatedPrompt && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="gap-2 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-accent" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>

          <Card className="min-h-[400px] bg-card border-border">
            <CardContent className="p-4">
              {generatedPrompt ? (
                <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
                  {generatedPrompt}
                </pre>
              ) : (
                <div className="flex h-[368px] items-center justify-center text-muted-foreground">
                  <p className="text-center text-sm">
                    Select a mode, fill in the fields, and click Generate to create your optimized prompt.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History Section */}
          <div className="space-y-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex w-full items-center justify-between rounded-lg bg-secondary/50 px-4 py-3 border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>Prompt History ({history.length})</span>
              </div>
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showHistory && (
              <div className="space-y-2">
                {history.length > 0 ? (
                  <>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearHistory}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Clear all history
                      </Button>
                    </div>
                    {history.map((item) => {
                      const modeConfig = modeConfigs.find((m) => m.id === item.mode)
                      return (
                        <Card key={item.id} className="bg-secondary/30 border-border">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-3">
                              <button
                                onClick={() => loadHistoryItem(item)}
                                className="flex-1 text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">
                                    {modeConfig?.label}
                                  </span>
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {item.label}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.timestamp.toLocaleString()}
                                </p>
                              </button>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyHistoryItem(item)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                >
                                  {copiedHistoryId === item.id ? (
                                    <Check className="h-4 w-4 text-accent" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteHistoryItem(item.id)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No history yet. Generate a prompt to start.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
