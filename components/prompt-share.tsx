"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Check,
  Copy,
  Link,
  QrCode,
  Code,
  FileText,
  Mail,
  MessageSquare,
  Hash,
  Globe,
  Lock,
  Users,
  ChevronRight,
  ExternalLink,
} from "lucide-react"

// Generate QR Code as SVG (simple implementation)
function generateQRCodeSVG(text: string, size: number = 200): string {
  // Simple placeholder pattern - in production, use a proper QR library
  const encoded = btoa(text.slice(0, 100))
  const gridSize = 21
  const cellSize = size / gridSize

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`
  svg += `<rect width="${size}" height="${size}" fill="white"/>`

  // Generate pattern based on encoded text
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const charIndex = (y * gridSize + x) % encoded.length
      const shouldFill = encoded.charCodeAt(charIndex) % 2 === 0

      // Always fill corners (finder patterns)
      const isCorner =
        (x < 7 && y < 7) ||
        (x >= gridSize - 7 && y < 7) ||
        (x < 7 && y >= gridSize - 7)

      if (isCorner) {
        // Finder pattern
        const inOuter = x < 7 && y < 7 ? (x === 0 || x === 6 || y === 0 || y === 6) :
                        x >= gridSize - 7 && y < 7 ? (x === gridSize - 7 || x === gridSize - 1 || y === 0 || y === 6) :
                        (x === 0 || x === 6 || y === gridSize - 7 || y === gridSize - 1)
        const inInner = x < 7 && y < 7 ? (x >= 2 && x <= 4 && y >= 2 && y <= 4) :
                        x >= gridSize - 7 && y < 7 ? (x >= gridSize - 5 && x <= gridSize - 3 && y >= 2 && y <= 4) :
                        (x >= 2 && x <= 4 && y >= gridSize - 5 && y <= gridSize - 3)

        if (inOuter || inInner) {
          svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`
        }
      } else if (shouldFill) {
        svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`
      }
    }
  }

  svg += `</svg>`
  return svg
}

// Format for different platforms
function formatForPlatform(prompt: string, platform: string): string {
  const timestamp = new Date().toISOString().split("T")[0]

  switch (platform) {
    case "gist":
      return `# Prompt
> Generated: ${timestamp}

\`\`\`
${prompt}
\`\`\``
    case "markdown":
      return `## AI Prompt

**Generated:** ${timestamp}

---

${prompt}

---

*Generated with Prompt Generator*`
    case "slack":
      return `*AI Prompt* (${timestamp})
\`\`\`
${prompt}
\`\`\``
    case "discord":
      return `**AI Prompt** \`${timestamp}\`
\`\`\`
${prompt}
\`\`\``
    case "email":
      return `Subject: AI Prompt - ${timestamp}

${prompt}

---
Generated with Prompt Generator`
    case "notion":
      return `# Prompt

> ${timestamp}

${prompt}`
    case "confluence":
      return `h1. AI Prompt

{info}Generated: ${timestamp}{info}

{code}
${prompt}
{code}`
    case "codeblock":
      return `\`\`\`plaintext
${prompt}
\`\`\``
    default:
      return prompt
  }
}

// Generate embed snippet
function generateEmbed(prompt: string, style: "minimal" | "card" | "inline"): string {
  const escaped = prompt.replace(/`/g, "\\`").replace(/\$/g, "\\$")

  switch (style) {
    case "minimal":
      return `<!-- Prompt Embed -->
<pre style="background:#1a1a1a;color:#fff;padding:16px;border-radius:8px;font-size:13px;overflow-x:auto;">
${prompt}
</pre>`
    case "card":
      return `<!-- Prompt Card Embed -->
<div style="border:1px solid #333;border-radius:12px;overflow:hidden;font-family:system-ui;">
  <div style="background:#222;padding:12px 16px;border-bottom:1px solid #333;">
    <span style="color:#888;font-size:12px;">AI Prompt</span>
  </div>
  <pre style="margin:0;padding:16px;background:#1a1a1a;color:#fff;font-size:13px;overflow-x:auto;">
${prompt}
  </pre>
</div>`
    case "inline":
      return `<code style="background:#222;color:#0f0;padding:2px 6px;border-radius:4px;">${prompt.slice(0, 100)}${prompt.length > 100 ? "..." : ""}</code>`
    default:
      return `<pre>${prompt}</pre>`
  }
}

// Generate shareable link content
function generateShareableContent(prompt: string, mode: "view" | "edit"): string {
  const encoded = btoa(unescape(encodeURIComponent(prompt)))
  return `https://prompt-generator.app/share?p=${encoded.slice(0, 50)}...&mode=${mode}`
}

type ShareTool = "link" | "qr" | "embed" | "format" | "email"

interface ShareConfig {
  id: ShareTool
  label: string
  description: string
  icon: React.ReactNode
}

const shareConfigs: ShareConfig[] = [
  { id: "link", label: "Share Link", description: "Generate shareable link", icon: <Link className="h-4 w-4" /> },
  { id: "qr", label: "QR Code", description: "Generate QR code for scanning", icon: <QrCode className="h-4 w-4" /> },
  { id: "embed", label: "Embed", description: "HTML embed snippets", icon: <Code className="h-4 w-4" /> },
  { id: "format", label: "Format", description: "Format for platforms", icon: <FileText className="h-4 w-4" /> },
  { id: "email", label: "Share", description: "Share via channels", icon: <Mail className="h-4 w-4" /> },
]

export function PromptShare() {
  const [selectedTool, setSelectedTool] = useState<ShareTool>("link")
  const [promptInput, setPromptInput] = useState("")
  const [output, setOutput] = useState<React.ReactNode>(null)
  const [copied, setCopied] = useState(false)
  const [shareMode, setShareMode] = useState<"view" | "edit">("view")
  const [embedStyle, setEmbedStyle] = useState<"minimal" | "card" | "inline">("card")
  const [platform, setPlatform] = useState("markdown")
  const [qrSvg, setQrSvg] = useState<string>("")

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const runTool = () => {
    if (!promptInput.trim()) {
      setOutput(<p className="text-muted-foreground">Enter a prompt to share.</p>)
      return
    }

    switch (selectedTool) {
      case "link": {
        const viewLink = generateShareableContent(promptInput, "view")
        const editLink = generateShareableContent(promptInput, "edit")

        setOutput(
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={shareMode === "view" ? "default" : "outline"}
                size="sm"
                onClick={() => setShareMode("view")}
                className="gap-2"
              >
                <Globe className="h-3 w-3" />
                View Only
              </Button>
              <Button
                variant={shareMode === "edit" ? "default" : "outline"}
                size="sm"
                onClick={() => setShareMode("edit")}
                className="gap-2"
              >
                <Lock className="h-3 w-3" />
                Editable
              </Button>
              <Button variant="outline" size="sm" disabled className="gap-2">
                <Users className="h-3 w-3" />
                Team
              </Button>
            </div>

            <Card className="bg-secondary/30 border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={shareMode === "view" ? viewLink : editLink}
                    className="font-mono text-xs bg-input"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(shareMode === "view" ? viewLink : editLink)}
                    className="shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {shareMode === "view"
                    ? "Anyone with this link can view the prompt."
                    : "Anyone with this link can view and edit (if logged in)."}
                </p>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground italic">
              Note: This is a preview of how shareable links would work. Full functionality requires backend integration.
            </p>
          </div>
        )
        break
      }

      case "qr": {
        const svg = generateQRCodeSVG(promptInput, 200)
        setQrSvg(svg)

        setOutput(
          <div className="space-y-4">
            <Card className="bg-secondary/30 border-border">
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <div
                  className="bg-white p-4 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
                <p className="text-sm text-muted-foreground text-center">
                  Scan to load prompt ({promptInput.length} characters)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([svg], { type: "image/svg+xml" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = "prompt-qr.svg"
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="gap-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Download SVG
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(svg)}
                    className="gap-2"
                  >
                    {copied ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
                    Copy SVG
                  </Button>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
              For prompts over ~100 characters, consider using a shortened link instead.
            </p>
          </div>
        )
        break
      }

      case "embed": {
        const embed = generateEmbed(promptInput, embedStyle)

        setOutput(
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              {(["minimal", "card", "inline"] as const).map((style) => (
                <Button
                  key={style}
                  variant={embedStyle === style ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEmbedStyle(style)}
                  className="capitalize"
                >
                  {style}
                </Button>
              ))}
            </div>

            <Card className="bg-secondary/30 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-lg overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: embed }}
                />
              </CardContent>
            </Card>

            <Card className="bg-secondary/30 border-border">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">HTML Code</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(embed)}
                  className="h-6 w-6 p-0"
                >
                  {copied ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {embed}
                </pre>
              </CardContent>
            </Card>
          </div>
        )
        break
      }

      case "format": {
        const formatted = formatForPlatform(promptInput, platform)

        setOutput(
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: "markdown", label: "Markdown", icon: <FileText className="h-3 w-3" /> },
                { id: "gist", label: "GitHub Gist", icon: <Code className="h-3 w-3" /> },
                { id: "codeblock", label: "Code Block", icon: <Hash className="h-3 w-3" /> },
                { id: "notion", label: "Notion", icon: <FileText className="h-3 w-3" /> },
                { id: "confluence", label: "Confluence", icon: <FileText className="h-3 w-3" /> },
              ].map((p) => (
                <Button
                  key={p.id}
                  variant={platform === p.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlatform(p.id)}
                  className="gap-2"
                >
                  {p.icon}
                  {p.label}
                </Button>
              ))}
            </div>

            <Card className="bg-secondary/30 border-border">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm capitalize">{platform} Format</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(formatted)}
                  className="h-6 w-6 p-0"
                >
                  {copied ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-foreground font-mono whitespace-pre-wrap bg-input p-4 rounded-lg max-h-[300px] overflow-y-auto">
                  {formatted}
                </pre>
              </CardContent>
            </Card>
          </div>
        )
        break
      }

      case "email": {
        const slackFormat = formatForPlatform(promptInput, "slack")
        const discordFormat = formatForPlatform(promptInput, "discord")
        const emailFormat = formatForPlatform(promptInput, "email")

        setOutput(
          <div className="space-y-4">
            {[
              { name: "Slack", format: slackFormat, icon: <MessageSquare className="h-4 w-4" /> },
              { name: "Discord", format: discordFormat, icon: <Hash className="h-4 w-4" /> },
              { name: "Email", format: emailFormat, icon: <Mail className="h-4 w-4" /> },
            ].map((channel) => (
              <Card key={channel.name} className="bg-secondary/30 border-border">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    {channel.icon}
                    <CardTitle className="text-sm">{channel.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(channel.format)}
                    className="h-6 w-6 p-0"
                  >
                    {copied ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                    {channel.format}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )
        break
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Tool Selector */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Share Options</h2>
        <div className="flex flex-wrap gap-2">
          {shareConfigs.map((tool) => (
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
          {shareConfigs.find((t) => t.id === selectedTool)?.description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Prompt to Share</h3>
          <Textarea
            placeholder="Paste your prompt here..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            rows={12}
            className="resize-none bg-input border-border placeholder:text-muted-foreground/50 focus:ring-accent font-mono text-sm"
          />

          <Button onClick={runTool} className="w-full gap-2">
            <ChevronRight className="h-4 w-4" />
            Generate {shareConfigs.find((t) => t.id === selectedTool)?.label}
          </Button>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Output</h3>
          <Card className="min-h-[400px] bg-card border-border">
            <CardContent className="p-4">
              {output || (
                <div className="flex h-[368px] items-center justify-center text-muted-foreground">
                  <p className="text-center text-sm">
                    Enter a prompt and select a share option.
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
