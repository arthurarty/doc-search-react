"use client"

import { useState, useCallback, useRef } from "react"
import {
  Upload,
  FileText,
  X,
  FolderOpen,
  Search,
  Settings,
  Moon,
  Sun,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type FileStatus = "done" | "indexing" | "uploading" | "queued" | "error"

interface FileItem {
  id: number
  name: string
  size: number
  status: FileStatus
  pct: number
  type: "pdf"
  added: string
}

const MOCK_FILES: FileItem[] = [
  { id: 1, name: "Q4-2024-Annual-Report.pdf", size: 4200000, status: "done", pct: 100, type: "pdf", added: "Apr 30" },
  { id: 2, name: "Product-Roadmap-2025.pdf", size: 1800000, status: "indexing", pct: 72, type: "pdf", added: "May 1" },
  { id: 3, name: "Competitive-Analysis-H1.pdf", size: 5100000, status: "queued", pct: 0, type: "pdf", added: "May 1" },
]

function fmtSize(bytes: number): string {
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function PulseDot() {
  return (
    <span
      className="size-1.5 rounded-full bg-brand inline-block"
      style={{ animation: "pulse-dot 1.4s ease-in-out infinite" }}
    />
  )
}

function StatusBadge({ status }: { status: FileStatus }) {
  if (status === "done")
    return (
      <Badge className="bg-green-100 text-green-700 border-transparent hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
        Indexed
      </Badge>
    )
  if (status === "indexing")
    return (
      <Badge className="bg-brand/10 text-brand border-transparent hover:bg-brand/10 gap-1.5">
        <PulseDot />
        Indexing
      </Badge>
    )
  if (status === "uploading")
    return (
      <Badge className="bg-brand/10 text-brand border-transparent hover:bg-brand/10 gap-1.5">
        <PulseDot />
        Uploading
      </Badge>
    )
  if (status === "error")
    return <Badge variant="destructive">Failed</Badge>
  return <Badge variant="outline">Queued</Badge>
}

function MiniProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full bg-brand rounded-full transition-[width] duration-400"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export function DocumentsPage() {
  const [dark, setDark] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<FileItem[]>(MOCK_FILES)
  const [activeNav, setActiveNav] = useState("Documents")
  const [search, setSearch] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const toggleDark = useCallback(() => {
    setDark((d) => {
      const next = !d
      document.documentElement.classList.toggle("dark", next)
      return next
    })
  }, [])

  const removeFile = (id: number) =>
    setFiles((f) => f.filter((x) => x.id !== id))

  const addFiles = useCallback(async (fileList: FileList) => {
    const now = new Date()
    const dateLabel = now.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const newItems: FileItem[] = Array.from(fileList)
      .filter((f) => f.name.endsWith(".pdf"))
      .map((f) => ({
        id: Date.now() + Math.random(),
        name: f.name,
        size: f.size,
        status: "queued" as const,
        pct: 0,
        type: "pdf" as const,
        added: dateLabel,
      }))
    if (newItems.length > 0) {
      setFiles((prev) => [...prev, ...newItems])
      await fetch("http://localhost:8000/signed-url/")
    }
  }, [])

  const doneCount = files.filter((f) => f.status === "done").length
  const processingCount = files.filter(
    (f) => f.status === "uploading" || f.status === "indexing"
  ).length

  const filtered = search
    ? files.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase())
      )
    : files

  const overallPct =
    files.length > 0 ? Math.round((doneCount / files.length) * 100) : 0

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ── Top nav ─────────────────────────────────────────────── */}
      <header className="h-14 border-b flex items-center px-6 gap-8 shrink-0 bg-background">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="size-[26px] rounded-md bg-brand flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M2 10L6.5 3 11 10H2z"
                fill="white"
                fillOpacity="0.9"
              />
            </svg>
          </div>
          <span className="font-semibold text-sm text-foreground">
            DocSearch
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex gap-0.5 flex-1">
          {(["Search", "Documents", "Settings"] as const).map((item) => {
            const active = item === activeNav
            return (
              <button
                key={item}
                onClick={() => setActiveNav(item)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer border-0 bg-transparent",
                  active
                    ? "font-medium text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item === "Search" && <Search className="size-3.5" />}
                {item === "Settings" && <Settings className="size-3.5" />}
                {item}
              </button>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDark}
            className="text-muted-foreground"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button
            size="sm"
            className="bg-brand text-brand-foreground hover:bg-brand/90 gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-3.5" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = "" }}
          />
        </div>
      </header>

      {/* ── Page body ────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto py-7 px-8 flex flex-col gap-5">
        {/* Page heading */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
              Documents
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload PDF files to index for search.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-6 items-center">
            {[
              { label: "Total", value: files.length },
              { label: "Indexed", value: doneCount },
              { label: "Processing", value: processingCount },
            ].map((s) => (
              <div key={s.label} className="text-right">
                <div className="text-xl font-semibold tracking-tight text-foreground">
                  {s.value}
                </div>
                <div className="text-[11px] text-muted-foreground mt-px">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Drop zone ─────────────────────────────────────────── */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            addFiles(e.dataTransfer.files)
          }}
          className={cn(
            "border border-dashed rounded-lg p-[18px] px-6 flex items-center gap-4 cursor-pointer transition-colors",
            dragging
              ? "border-brand bg-brand/[0.04]"
              : "border-border hover:border-brand/40 hover:bg-muted/30"
          )}
        >
          <div className="size-[38px] rounded-md bg-brand/10 flex items-center justify-center text-brand shrink-0">
            <Upload className="size-[15px]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">
              Drop PDF files here
            </div>
            <div className="text-xs text-muted-foreground mt-px">
              Up to 50 MB per file
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <FolderOpen className="size-3.5" />
              Browse files
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => folderInputRef.current?.click()}
            >
              <FolderOpen className="size-3.5" />
              Browse folder
            </Button>
            <input
              ref={folderInputRef}
              type="file"
              /* @ts-expect-error non-standard but widely supported */
              webkitdirectory=""
              accept=".pdf"
              className="hidden"
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = "" }}
            />
          </div>
        </div>

        {/* ── Document table card ───────────────────────────────── */}
        <div className="border rounded-lg bg-card overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-3 px-4 border-b gap-3">
            <div className="relative flex-1 max-w-[280px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter documents…"
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="flex gap-2 items-center">
              {processingCount > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <PulseDot /> {processingCount} processing…
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground gap-1"
              >
                Type <ChevronDown className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground gap-1"
              >
                Status <ChevronDown className="size-3" />
              </Button>
            </div>
          </div>

          {/* Table header */}
          <div
            className="grid px-4 py-2 border-b text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns: "1fr 68px 130px 110px 36px" }}
          >
            <span>Name</span>
            <span>Size</span>
            <span>Progress</span>
            <span>Status</span>
            <span />
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No documents match your filter.
            </div>
          )}

          {/* Rows */}
          {filtered.map((f, i) => (
            <div key={f.id}>
              <div
                className="grid px-4 py-3 items-center hover:bg-muted/40 transition-colors"
                style={{ gridTemplateColumns: "1fr 68px 130px 110px 36px" }}
              >
                {/* Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="size-4 shrink-0 text-brand" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {f.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-px">
                      Added {f.added}
                    </div>
                  </div>
                </div>

                {/* Size */}
                <div className="text-sm text-muted-foreground">
                  {fmtSize(f.size)}
                </div>

                {/* Progress */}
                <div className="pr-5">
                  {f.pct > 0 ? (
                    <div className="flex items-center gap-2">
                      <MiniProgressBar value={f.pct} />
                      <span className="text-[11px] text-muted-foreground min-w-[30px] tabular-nums">
                        {f.pct}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={f.status} />
                </div>

                {/* Remove */}
                <div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeFile(f.id)}
                    className="text-muted-foreground size-7"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
              {i < filtered.length - 1 && <Separator />}
            </div>
          ))}

          {/* Footer */}
          {files.length > 0 && (
            <div className="border-t px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {files.length} document{files.length !== 1 ? "s" : ""} ·{" "}
                {doneCount} indexed
              </span>
              <div className="flex items-center gap-2.5 w-[180px]">
                <MiniProgressBar value={overallPct} />
                <span className="text-[11px] text-muted-foreground min-w-[30px] tabular-nums">
                  {overallPct}%
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
