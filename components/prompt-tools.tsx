"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Check,
  Copy,
  AlertTriangle,
  Coins,
  GitCompare,
  Shield,
  Languages,
  Lock,
  FunctionSquare,
  FileJson,
  Tag,
  Beaker,
  Download,
  ChevronRight,
} from "lucide-react"

// Token estimation (rough approximation)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Prompt Linting
interface LintIssue {
  type: "warning" | "error" | "info"
  message: string
  line?: number
}

function lintPrompt(prompt: string): LintIssue[] {
  const issues: LintIssue[] = []
  const lines = prompt.split("\n")

  // Check for ambiguity
  const ambiguousWords = ["maybe", "perhaps", "possibly", "might", "could be", "kind of", "sort of"]
  ambiguousWords.forEach((word) => {
    if (prompt.toLowerCase().includes(word)) {
      issues.push({ type: "warning", message: `Ambiguous language detected: "${word}". Consider being more specific.` })
    }
  })

  // Check for missing variables
  const variablePattern = /\{(\w+)\}/g
  const variables = prompt.match(variablePattern)
  if (variables) {
    variables.forEach((v) => {
      issues.push({ type: "info", message: `Variable placeholder found: ${v}. Ensure this is intentional.` })
    })
  }

  // Check for conflicting instructions
  if (prompt.includes("be concise") && prompt.includes("detailed explanation")) {
    issues.push({ type: "error", message: "Conflicting instructions: 'be concise' vs 'detailed explanation'." })
  }

  // Check for over-specification
  if (prompt.length > 3000) {
    issues.push({ type: "warning", message: "Prompt is very long. Consider breaking into smaller, focused prompts." })
  }

  // Check for missing role definition
  if (!prompt.toLowerCase().includes("you are") && !prompt.toLowerCase().includes("act as")) {
    issues.push({ type: "info", message: "No explicit role definition found. Consider adding one for better results." })
  }

  // Check for output format
  if (!prompt.toLowerCase().includes("output") && !prompt.toLowerCase().includes("return") && !prompt.toLowerCase().includes("generate")) {
    issues.push({ type: "warning", message: "No clear output instruction found. Specify what you want the AI to produce." })
  }

  // Check empty lines ratio
  const emptyLines = lines.filter((l) => l.trim() === "").length
  if (emptyLines > lines.length * 0.3) {
    issues.push({ type: "info", message: "High ratio of empty lines. Consider condensing for efficiency." })
  }

  // Check for jailbreak patterns
  const jailbreakPatterns = ["ignore previous", "disregard", "pretend you", "bypass", "override"]
  jailbreakPatterns.forEach((pattern) => {
    if (prompt.toLowerCase().includes(pattern)) {
      issues.push({ type: "error", message: `Potential jailbreak pattern detected: "${pattern}".` })
    }
  })

  if (issues.length === 0) {
    issues.push({ type: "info", message: "No issues found. Prompt looks well-structured." })
  }

  return issues
}

// Safety patterns
function checkSafety(prompt: string): LintIssue[] {
  const issues: LintIssue[] = []

  const unsafePatterns = [
    { pattern: "ignore all previous instructions", message: "Jailbreak attempt detected" },
    { pattern: "pretend you have no restrictions", message: "Bypass attempt detected" },
    { pattern: "act as if you have no guidelines", message: "Policy violation pattern" },
    { pattern: "do anything i say", message: "Over-permissive instruction" },
    { pattern: "no matter what", message: "Potentially unsafe unconditional" },
  ]

  unsafePatterns.forEach(({ pattern, message }) => {
    if (prompt.toLowerCase().includes(pattern)) {
      issues.push({ type: "error", message })
    }
  })

  // Check for PII requests
  const piiPatterns = ["social security", "credit card", "password", "private key"]
  piiPatterns.forEach((pattern) => {
    if (prompt.toLowerCase().includes(pattern)) {
      issues.push({ type: "warning", message: `Potentially sensitive data request: "${pattern}"` })
    }
  })

  if (issues.length === 0) {
    issues.push({ type: "info", message: "No safety concerns detected." })
  }

  return issues
}

// Model simulation
function simulateModelResponse(prompt: string, model: string): string {
  const styles: Record<string, { prefix: string; traits: string[] }> = {
    "gpt": {
      prefix: "GPT-style interpretation:",
      traits: ["verbose", "structured", "tends to add caveats"]
    },
    "claude": {
      prefix: "Claude-style interpretation:",
      traits: ["balanced", "analytical", "may ask clarifying questions"]
    },
    "llama": {
      prefix: "Llama-style interpretation:",
      traits: ["direct", "may be less nuanced", "follows instructions literally"]
    },
    "mistral": {
      prefix: "Mistral-style interpretation:",
      traits: ["efficient", "code-focused", "minimal explanations"]
    }
  }

  const style = styles[model]
  const wordCount = prompt.split(/\s+/).length
  const hasRole = prompt.toLowerCase().includes("you are")
  const hasOutput = prompt.toLowerCase().includes("output") || prompt.toLowerCase().includes("generate")

  return `${style.prefix}
- Word count: ${wordCount} words (~${estimateTokens(prompt)} tokens)
- Role defined: ${hasRole ? "Yes" : "No"}
- Output specified: ${hasOutput ? "Yes" : "No"}
- Model traits: ${style.traits.join(", ")}
- Potential issues: ${!hasRole ? "May default to generic assistant mode. " : ""}${!hasOutput ? "Output format unclear. " : ""}${wordCount > 500 ? "Long prompt may cause focus drift." : ""}`
}

// Diff viewer
function computeDiff(text1: string, text2: string): { type: "same" | "added" | "removed"; content: string }[] {
  const lines1 = text1.split("\n")
  const lines2 = text2.split("\n")
  const diff: { type: "same" | "added" | "removed"; content: string }[] = []

  const maxLen = Math.max(lines1.length, lines2.length)

  for (let i = 0; i < maxLen; i++) {
    if (i < lines1.length && i < lines2.length) {
      if (lines1[i] === lines2[i]) {
        diff.push({ type: "same", content: lines1[i] })
      } else {
        diff.push({ type: "removed", content: lines1[i] })
        diff.push({ type: "added", content: lines2[i] })
      }
    } else if (i >= lines1.length) {
      diff.push({ type: "added", content: lines2[i] })
    } else {
      diff.push({ type: "removed", content: lines1[i] })
    }
  }

  return diff
}

// Function generator
function generateFunctionSignature(prompt: string): string {
  const lines = prompt.split("\n").filter((l) => l.trim())
  const firstLine = lines[0] || "processInput"

  // Extract potential function name
  const nameMatch = firstLine.match(/(?:generate|create|build|get|fetch|process|validate|transform)\s+(\w+)/i)
  const functionName = nameMatch ? nameMatch[1].toLowerCase() : "processPrompt"

  // Detect potential inputs
  const inputs: string[] = []
  const inputPatterns = ["input", "data", "text", "content", "query", "request"]
  inputPatterns.forEach((p) => {
    if (prompt.toLowerCase().includes(p)) inputs.push(p)
  })

  // Detect potential outputs
  const outputPatterns = prompt.match(/(?:return|output|generate|produce)\s+(\w+)/gi) || []

  return `// Function Signature
interface ${functionName.charAt(0).toUpperCase() + functionName.slice(1)}Input {
${inputs.map((i) => `  ${i}: string;`).join("\n") || "  input: string;"}
}

interface ${functionName.charAt(0).toUpperCase() + functionName.slice(1)}Output {
  result: string;
  success: boolean;
  metadata?: Record<string, unknown>;
}

async function ${functionName}(
  params: ${functionName.charAt(0).toUpperCase() + functionName.slice(1)}Input
): Promise<${functionName.charAt(0).toUpperCase() + functionName.slice(1)}Output> {
  // Prompt: ${lines[0]?.slice(0, 50)}...
  // Implementation here
}

// Validation Rules
const validationSchema = {
${inputs.map((i) => `  ${i}: { required: true, type: "string", maxLength: 10000 }`).join(",\n") || "  input: { required: true, type: 'string', maxLength: 10000 }"}
};`
}

// Export formats
function exportPrompt(prompt: string, format: "json" | "yaml" | "env" | "config"): string {
  const escaped = prompt.replace(/"/g, '\\"').replace(/\n/g, "\\n")

  switch (format) {
    case "json":
      return JSON.stringify(
        {
          version: "1.0",
          prompt: {
            content: prompt,
            metadata: {
              tokens: estimateTokens(prompt),
              created: new Date().toISOString(),
            },
          },
        },
        null,
        2
      )
    case "yaml":
      return `version: "1.0"
prompt:
  content: |
${prompt.split("\n").map((l) => `    ${l}`).join("\n")}
  metadata:
    tokens: ${estimateTokens(prompt)}
    created: "${new Date().toISOString()}"`
    case "env":
      return `# Prompt Configuration
PROMPT_CONTENT="${escaped}"
PROMPT_TOKENS=${estimateTokens(prompt)}
PROMPT_CREATED="${new Date().toISOString()}"`
    case "config":
      return `// Prompt Configuration
export const promptConfig = {
  content: \`${prompt}\`,
  metadata: {
    tokens: ${estimateTokens(prompt)},
    created: "${new Date().toISOString()}",
  },
};`
    default:
      return prompt
  }
}

// Simple obfuscation
function obfuscatePrompt(prompt: string): string {
  const encoded = Buffer.from(prompt).toString("base64")
  return `// Obfuscated Prompt
// Decode with: Buffer.from(encoded, 'base64').toString('utf-8')
const encoded = "${encoded}";`
}

// Auto-tag
function autoTag(prompt: string): { tag: string; confidence: number }[] {
  const tags: { tag: string; confidence: number }[] = []

  const patterns: Record<string, string[]> = {
    "frontend": ["react", "vue", "angular", "ui", "component", "css", "tailwind", "html"],
    "backend": ["api", "server", "database", "endpoint", "rest", "graphql", "auth"],
    "fullstack": ["next.js", "nuxt", "full-stack", "frontend and backend"],
    "mobile": ["ios", "android", "react native", "flutter", "mobile app"],
    "devops": ["docker", "kubernetes", "ci/cd", "deploy", "aws", "cloud"],
    "testing": ["test", "jest", "vitest", "coverage", "mock", "assertion"],
    "ai-ml": ["model", "llm", "machine learning", "neural", "training", "inference"],
    "security": ["auth", "jwt", "oauth", "encryption", "secure", "vulnerability"],
    "performance": ["optimize", "cache", "speed", "latency", "performance"],
    "data": ["database", "sql", "nosql", "schema", "migration", "query"],
  }

  const lowerPrompt = prompt.toLowerCase()

  Object.entries(patterns).forEach(([tag, keywords]) => {
    const matches = keywords.filter((k) => lowerPrompt.includes(k)).length
    if (matches > 0) {
      tags.push({ tag, confidence: Math.min(matches / keywords.length * 100, 100) })
    }
  })

  // Sort by confidence
  return tags.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
}

// Multi-prompt bundle
function generateBundle(basePrompt: string): Record<string, string> {
  const systemPrompt = basePrompt

  return {
    system: systemPrompt,
    developer: `[Developer Context]
You are working on a software project with the following requirements:

${basePrompt}

Follow best practices, write clean code, and document your decisions.`,
    user: `Based on the system configuration, help me with the following task:

[User will provide specific request here]

Refer to the system prompt for context and constraints.`,
    tools: `// Tool Definitions for Function Calling

{
  "name": "execute_task",
  "description": "Execute a task based on the system prompt",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "description": "The specific action to perform"
      },
      "context": {
        "type": "object",
        "description": "Additional context from the prompt"
      }
    },
    "required": ["action"]
  }
}`,
  }
}

type ToolType =
  | "linting"
  | "tokens"
  | "loadtest"
  | "diff"
  | "safety"
  | "function"
  | "export"
  | "encrypt"
  | "tags"
  | "bundle"

interface ToolConfig {
  id: ToolType
  label: string
  description: string
  icon: React.ReactNode
}

const toolConfigs: ToolConfig[] = [
  { id: "linting", label: "Lint", description: "Static analysis for prompts", icon: <AlertTriangle className="h-4 w-4" /> },
  { id: "tokens", label: "Tokens", description: "Token count and cost estimate", icon: <Coins className="h-4 w-4" /> },
  { id: "loadtest", label: "Load Test", description: "Model interpretation simulation", icon: <Beaker className="h-4 w-4" /> },
  { id: "diff", label: "Diff", description: "Compare two prompts", icon: <GitCompare className="h-4 w-4" /> },
  { id: "safety", label: "Safety", description: "Check for unsafe patterns", icon: <Shield className="h-4 w-4" /> },
  { id: "function", label: "Function", description: "Generate function signature", icon: <FunctionSquare className="h-4 w-4" /> },
  { id: "export", label: "Export", description: "Package for deployment", icon: <Download className="h-4 w-4" /> },
  { id: "encrypt", label: "Obfuscate", description: "Encode prompt", icon: <Lock className="h-4 w-4" /> },
  { id: "tags", label: "Tags", description: "Auto-tag and metadata", icon: <Tag className="h-4 w-4" /> },
  { id: "bundle", label: "Bundle", description: "Multi-prompt generation", icon: <Languages className="h-4 w-4" /> },
]

export function PromptTools() {
  const [selectedTool, setSelectedTool] = useState<ToolType>("linting")
  const [promptInput, setPromptInput] = useState("")
  const [promptInput2, setPromptInput2] = useState("")
  const [output, setOutput] = useState<React.ReactNode>(null)
  const [copied, setCopied] = useState(false)
  const [selectedModels, setSelectedModels] = useState<string[]>(["gpt", "claude"])
  const [exportFormat, setExportFormat] = useState<"json" | "yaml" | "env" | "config">("json")

  const runTool = () => {
    if (!promptInput.trim()) {
      setOutput(<p className="text-muted-foreground">Enter a prompt to analyze.</p>)
      return
    }

    switch (selectedTool) {
      case "linting": {
        const issues = lintPrompt(promptInput)
        setOutput(
          <div className="space-y-2">
            {issues.map((issue, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                  issue.type === "error"
                    ? "bg-red-500/10 text-red-400"
                    : issue.type === "warning"
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-blue-500/10 text-blue-400"
                }`}
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        )
        break
      }

      case "tokens": {
        const tokens = estimateTokens(promptInput)
        const costPer1k = 0.002 // Rough estimate
        const cost = (tokens / 1000) * costPer1k
        const truncationRisk = tokens > 4000 ? "High" : tokens > 2000 ? "Medium" : "Low"

        setOutput(
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-secondary/30 border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{tokens.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Estimated Tokens</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30 border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">${cost.toFixed(4)}</p>
                  <p className="text-xs text-muted-foreground">Est. Cost (GPT-4)</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30 border-border">
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${truncationRisk === "High" ? "text-red-400" : truncationRisk === "Medium" ? "text-yellow-400" : "text-green-400"}`}>
                    {truncationRisk}
                  </p>
                  <p className="text-xs text-muted-foreground">Truncation Risk</p>
                </CardContent>
              </Card>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Characters: {promptInput.length.toLocaleString()}</p>
              <p>Words: {promptInput.split(/\s+/).filter(Boolean).length.toLocaleString()}</p>
              <p>Lines: {promptInput.split("\n").length}</p>
            </div>
          </div>
        )
        break
      }

      case "loadtest": {
        const results = selectedModels.map((model) => ({
          model,
          analysis: simulateModelResponse(promptInput, model),
        }))

        setOutput(
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {["gpt", "claude", "llama", "mistral"].map((model) => (
                <label key={model} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedModels.includes(model)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedModels((prev) => [...prev, model])
                      } else {
                        setSelectedModels((prev) => prev.filter((m) => m !== model))
                      }
                    }}
                    className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                  />
                  <span className="capitalize">{model}</span>
                </label>
              ))}
            </div>
            {results.map(({ model, analysis }) => (
              <Card key={model} className="bg-secondary/30 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm capitalize">{model}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{analysis}</pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )
        break
      }

      case "diff": {
        if (!promptInput2.trim()) {
          setOutput(<p className="text-muted-foreground">Enter both prompts to compare.</p>)
          return
        }

        const diff = computeDiff(promptInput, promptInput2)
        setOutput(
          <div className="font-mono text-sm space-y-0.5 max-h-[400px] overflow-y-auto">
            {diff.map((line, i) => (
              <div
                key={i}
                className={`px-2 py-0.5 ${
                  line.type === "added"
                    ? "bg-green-500/20 text-green-400"
                    : line.type === "removed"
                    ? "bg-red-500/20 text-red-400"
                    : "text-muted-foreground"
                }`}
              >
                <span className="inline-block w-4 mr-2">{line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}</span>
                {line.content || " "}
              </div>
            ))}
          </div>
        )
        break
      }

      case "safety": {
        const issues = checkSafety(promptInput)
        setOutput(
          <div className="space-y-2">
            {issues.map((issue, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                  issue.type === "error"
                    ? "bg-red-500/10 text-red-400"
                    : issue.type === "warning"
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-green-500/10 text-green-400"
                }`}
              >
                <Shield className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        )
        break
      }

      case "function": {
        const signature = generateFunctionSignature(promptInput)
        setOutput(
          <pre className="text-sm text-foreground font-mono whitespace-pre-wrap bg-secondary/30 p-4 rounded-lg overflow-x-auto">
            {signature}
          </pre>
        )
        break
      }

      case "export": {
        const exported = exportPrompt(promptInput, exportFormat)
        setOutput(
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["json", "yaml", "env", "config"] as const).map((fmt) => (
                <Button
                  key={fmt}
                  variant={exportFormat === fmt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExportFormat(fmt)}
                  className="uppercase text-xs"
                >
                  {fmt}
                </Button>
              ))}
            </div>
            <pre className="text-sm text-foreground font-mono whitespace-pre-wrap bg-secondary/30 p-4 rounded-lg overflow-x-auto max-h-[300px]">
              {exported}
            </pre>
          </div>
        )
        break
      }

      case "encrypt": {
        const obfuscated = obfuscatePrompt(promptInput)
        setOutput(
          <pre className="text-sm text-foreground font-mono whitespace-pre-wrap bg-secondary/30 p-4 rounded-lg overflow-x-auto">
            {obfuscated}
          </pre>
        )
        break
      }

      case "tags": {
        const tags = autoTag(promptInput)
        setOutput(
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tags.map(({ tag, confidence }) => (
                <div
                  key={tag}
                  className="flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1.5 text-sm"
                >
                  <span className="font-medium text-accent">{tag}</span>
                  <span className="text-xs text-muted-foreground">{confidence.toFixed(0)}%</span>
                </div>
              ))}
            </div>
            {tags.length === 0 && (
              <p className="text-muted-foreground">No tags detected. Try adding more specific technical terms.</p>
            )}
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Complexity: {promptInput.length > 2000 ? "High" : promptInput.length > 500 ? "Medium" : "Low"}</p>
              <p>Model compatibility: GPT-4, Claude, Llama, Mistral</p>
            </div>
          </div>
        )
        break
      }

      case "bundle": {
        const bundle = generateBundle(promptInput)
        setOutput(
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {Object.entries(bundle).map(([key, value]) => (
              <Card key={key} className="bg-secondary/30 border-border">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm capitalize">{key} Prompt</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(value)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1500)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{value}</pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )
        break
      }
    }
  }

  const copyOutput = async () => {
    const text = document.querySelector("[data-output]")?.textContent || ""
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Tool Selector */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Select Analysis Tool</h2>
        <div className="flex flex-wrap gap-2">
          {toolConfigs.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                setSelectedTool(tool.id)
                setOutput(null)
              }}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                selectedTool === tool.id
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-accent/50 hover:text-foreground"
              }`}
            >
              {tool.icon}
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {toolConfigs.find((t) => t.id === selectedTool)?.description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">
            {selectedTool === "diff" ? "Prompt A (Original)" : "Prompt Input"}
          </h3>
          <Textarea
            placeholder="Paste your prompt here..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            rows={12}
            className="resize-none bg-input border-border placeholder:text-muted-foreground/50 focus:ring-accent font-mono text-sm"
          />

          {selectedTool === "diff" && (
            <>
              <h3 className="text-sm font-medium text-foreground">Prompt B (Modified)</h3>
              <Textarea
                placeholder="Paste second prompt to compare..."
                value={promptInput2}
                onChange={(e) => setPromptInput2(e.target.value)}
                rows={12}
                className="resize-none bg-input border-border placeholder:text-muted-foreground/50 focus:ring-accent font-mono text-sm"
              />
            </>
          )}

          <Button onClick={runTool} className="w-full gap-2">
            <ChevronRight className="h-4 w-4" />
            Run {toolConfigs.find((t) => t.id === selectedTool)?.label}
          </Button>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Results</h3>
            {output && (
              <Button variant="outline" size="sm" onClick={copyOutput} className="gap-2 text-xs">
                {copied ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </div>
          <Card className="min-h-[400px] bg-card border-border">
            <CardContent className="p-4" data-output>
              {output || (
                <div className="flex h-[368px] items-center justify-center text-muted-foreground">
                  <p className="text-center text-sm">
                    Enter a prompt and click Run to see results.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
