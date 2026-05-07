"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  Shield,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
  Code2,
  Globe,
  Clock,
  Terminal,
  Gauge,
  Lock,
  Server,
  Layers,
  Eye,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* -- Helpers ------------------------------------------------------------- */

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/* -- Terminal chrome ----------------------------------------------------- */

function TerminalWindow({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card/70 shadow-2xl backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-chart-2/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="ml-1 text-[11px] text-muted-foreground font-mono">
            {title}
          </span>
        </div>
        {meta && (
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
            {meta}
          </span>
        )}
      </div>
      <div className="p-5 font-mono text-sm leading-relaxed">{children}</div>
    </div>
  );
}

/* -- Code block with line numbers --------------------------------------- */

function CodeFrame({
  filename,
  lang,
  children,
  lineCount,
}: {
  filename: string;
  lang: string;
  children: React.ReactNode;
  lineCount: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/70 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-chart-2/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-[11px] text-foreground font-mono">{filename}</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
          {lang}
        </span>
      </div>
      <div className="flex">
        <div
          aria-hidden
          className="select-none border-r border-border bg-background/40 px-3 py-5 font-mono text-[12px] leading-[1.7] text-muted-foreground/30 text-right"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{pad(i + 1)}</div>
          ))}
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.7]">
          {children}
        </div>
      </div>
    </div>
  );
}

/* -- Page ---------------------------------------------------------------- */

type SdkLang = "go" | "express" | "hono" | "fastify" | "elysia";
const SDK_LANGS: SdkLang[] = ["go", "express", "hono", "fastify", "elysia"];
const SDK_LABELS: Record<SdkLang, string> = {
  go: "Go",
  express: "Express",
  hono: "Hono",
  fastify: "Fastify",
  elysia: "Elysia",
};
const SDK_FILES: Record<SdkLang, string> = {
  go: "main.go",
  express: "express.js",
  hono: "index.ts",
  fastify: "index.js",
  elysia: "index.ts",
};
const SDK_LINES: Record<SdkLang, number> = {
  go: 14,
  express: 11,
  hono: 11,
  fastify: 11,
  elysia: 12,
};

export default function LandingPage() {
  const [sdkLang, setSdkLang] = useState<SdkLang>("go");
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");

  function handleLangChange(lang: SdkLang) {
    const newIdx = SDK_LANGS.indexOf(lang);
    const curIdx = SDK_LANGS.indexOf(sdkLang);
    setSlideDir(newIdx >= curIdx ? "right" : "left");
    setSdkLang(lang);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/logo.svg"
                alt="Kivia"
                width={30}
                height={30}
                priority
                className="rounded-lg transition-transform group-hover:scale-105"
              />
              <span className="text-lg font-display font-bold tracking-tight">
                Kivia
              </span>
              <span className="hidden md:inline-flex items-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground border border-border rounded px-1.5 py-0.5 ml-1">
                v0.9 · beta
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <button
                onClick={() => scrollTo("features")}
                className="hover:text-foreground transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollTo("how-it-works")}
                className="hover:text-foreground transition-colors"
              >
                Pipeline
              </button>
              <button
                onClick={() => scrollTo("sdk")}
                className="hover:text-foreground transition-colors"
              >
                SDK
              </button>
              <button
                onClick={() => scrollTo("capabilities")}
                className="hover:text-foreground transition-colors"
              >
                Capabilities
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
        
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-foreground/[0.04] blur-[120px]" />
        <div className="pointer-events-none absolute top-40 -left-32 h-[300px] w-[300px] rounded-full bg-chart-2/[0.05] blur-[80px]" />

        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28 md:pb-36">
          {/* Headline */}
          <div>
            <p
              className="mb-6 inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground animate-fade-in-up"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              API observability platform · in public beta
            </p>
            <h1 className="font-display font-bold tracking-tight leading-[0.92] text-[clamp(3rem,11vw,9rem)]">
              <span
                className="block animate-fade-in-up text-foreground"
                style={{ animationDelay: "60ms" }}
              >
                Observe
              </span>
              <span
                className="block italic font-light text-foreground/50 animate-fade-in-up"
                style={{ animationDelay: "140ms" }}
              >
                every
              </span>
              <span
                className="block animate-fade-in-up text-foreground"
                style={{ animationDelay: "220ms" }}
              >
                request
                <span className="inline-flex translate-y-[-0.15em] ml-3 align-middle">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inset-0 rounded-full bg-emerald-400/60 animate-ping" />
                    <span className="relative h-3 w-3 rounded-full bg-emerald-400" />
                  </span>
                </span>
              </span>
            </h1>
          </div>

          {/* Sub-copy + CTAs */}
          <div className="mt-12 grid grid-cols-12 gap-6 md:gap-10 border-t border-dashed border-border pt-8">
            <p
              className="col-span-12 lg:col-span-7 text-lg leading-relaxed text-muted-foreground md:text-xl animate-fade-in-up"
              style={{ animationDelay: "500ms" }}
            >
              Kivia is a lightweight platform that captures every HTTP request
              your APIs serve — keys, latency, status codes, paths — and
              surfaces them in a live dashboard you can read at a glance.
            </p>
            <div
              className="col-span-12 lg:col-span-5 lg:justify-self-end flex flex-col sm:flex-row gap-3 self-end animate-fade-in-up"
              style={{ animationDelay: "560ms" }}
            >
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-7 py-3.5 text-base font-medium text-background hover:bg-foreground/90 transition-all shadow-xl shadow-foreground/10 hover:-translate-y-0.5"
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={() => scrollTo("how-it-works")}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-7 py-3.5 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all backdrop-blur-sm"
              >
                See the pipeline
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mb-16 grid grid-cols-12 gap-6 md:gap-10">
            <div className="col-span-12 lg:col-span-7">
              <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-foreground leading-[1.02]">
                A first-class
                <br />
                <span className="italic font-light text-foreground/60">developer</span>
                <span> experience.</span>
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-5 lg:border-l lg:border-border lg:pl-8 flex flex-col justify-end">
              <p className="text-muted-foreground text-base leading-relaxed">
                Integrate Kivia in minutes. Native SDKs for Go and JavaScript —
                works with Express, Hono, Fastify, and Elysia. Zero config, zero
                overhead, zero ceremony.
              </p>
            </div>
          </div>

          {/* Feature cards: 12-column composition */}
          <div className="grid grid-cols-12 gap-px bg-border rounded-2xl overflow-hidden border border-border">
            {[
              {
                num: "01",
                icon: Code2,
                title: "Online in three lines",
                description:
                  "Create a client, wrap your handler, and Kivia captures everything automatically.",
                code: `client := kiviasdk.NewClient("kivia_sk_...")
handler := client.NewLog(mux)
http.ListenAndServe(":8080", handler)`,
                codeLang: "go",
                span: "lg:col-span-7 col-span-12",
              },
              {
                num: "02",
                icon: Eye,
                title: "Instant observability",
                description:
                  "Watch live traffic, statuses, and latency in the dashboard.",
                code: `POST /auth/login            200  45ms
GET  /api/v1/projects/all   200  12ms
POST /api/v1/logs/create    201   8ms
GET  /api/v1/logs/all/abc   200   3ms`,
                codeLang: "stream",
                span: "lg:col-span-5 col-span-12",
              },
              {
                num: "03",
                icon: Lock,
                title: "API key management",
                description:
                  "Create and revoke keys per project. Keys are hashed and stored securely.",
                code: `Name        Key              Status
production  kivia_sk_a3f•••  ● Active
staging     kivia_sk_7x2•••  ● Active
deprecated  kivia_sk_old•••  ○ Revoked`,
                codeLang: "keys",
                span: "lg:col-span-5 col-span-12",
              },
              {
                num: "04",
                icon: Layers,
                title: "Multi-project support",
                description:
                  "Scope keys and logs per project. Ideal for microservice architectures.",
                code: `production-api    3 keys   12,847 reqs
staging-api       2 keys    1,203 reqs
internal-tools    1 key       456 reqs`,
                codeLang: "projects",
                span: "lg:col-span-7 col-span-12",
              },
            ].map(({ num, icon: Icon, title, description, code, codeLang, span }) => (
              <div
                key={num}
                className={cn(
                  "group relative bg-background p-7 md:p-8 transition-colors hover:bg-card/40",
                  span
                )}
              >
                <div className="absolute right-5 top-5 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground/60">
                  / {num}
                </div>
                <div className="flex items-start gap-4 mb-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground ring-1 ring-border">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="pr-10">
                    <h3 className="font-display text-xl font-semibold text-foreground tracking-tight">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-md">
                      {description}
                    </p>
                  </div>
                </div>
                <TerminalWindow title={codeLang} className="bg-background/60">
                  <pre className="text-[12.5px] text-emerald-400/80 whitespace-pre-wrap">
                    <code>{code}</code>
                  </pre>
                </TerminalWindow>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works (Pipeline) ───────────────────────────────────── */}
      <section
        id="how-it-works"
        className="relative border-b border-border bg-muted/15 dot-grid"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mb-20 grid grid-cols-12 gap-6 md:gap-10">
            <h2 className="col-span-12 lg:col-span-8 font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-foreground leading-[1.02]">
              Up and running
              <br />
              <span className="italic font-light text-foreground/60">in minutes,</span>
              <span> not days.</span>
            </h2>
          </div>

          {/* Horizontal stepper */}
          <div className="relative">
            {/* connecting hairline */}
            <div className="hidden lg:block absolute left-8 right-8 top-[42px] h-px border-t border-dashed border-border" />

            <div className="grid gap-12 lg:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: 1,
                  icon: Terminal,
                  title: "Install SDK",
                  description: "Add Kivia to your Go or JavaScript project.",
                  highlight: "go get / npm install",
                },
                {
                  step: 2,
                  icon: Lock,
                  title: "Create API key",
                  description: "Generate a key in the dashboard for your project.",
                  highlight: "kivia_sk_...",
                },
                {
                  step: 3,
                  icon: Server,
                  title: "Add middleware",
                  description: "One line captures every request automatically.",
                  highlight: "client.middleware()",
                },
                {
                  step: 4,
                  icon: Gauge,
                  title: "View dashboard",
                  description: "See live traffic, latency, and status codes instantly.",
                  highlight: "dashboard >",
                },
              ].map(({ step, icon: Icon, title, description, highlight }) => (
                <div key={step} className="group relative">
                  {/* sequence header */}
                  <div className="mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    <span className="text-foreground">{pad(step)}</span>
                    <span>{step < 4 ? "→ next" : "● final"}</span>
                  </div>
                  {/* node */}
                  <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background ring-4 ring-background transition-all group-hover:border-foreground group-hover:scale-105">
                    <Icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground tracking-tight mb-1.5">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-[260px]">
                    {description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-xs font-mono text-foreground/80 bg-background border border-border px-2.5 py-1 rounded-md">
                    <span className="text-muted-foreground">›</span>
                    {highlight}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── SDK section (IDE-style) ───────────────────────────────────── */}
      <section id="sdk" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-12 gap-6 md:gap-10">
            <div className="col-span-12 lg:col-span-5">
              <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-foreground leading-[1.02]">
                Drop-in
                <br />
                middleware for
                <br />
                <span className="italic font-light text-foreground/60">any backend.</span>
              </h2>
              <p className="mt-6 text-muted-foreground text-base leading-relaxed max-w-md">
                Lightweight SDKs that wrap your existing HTTP handlers. No
                refactoring, no config files. Import and observe.
              </p>
              <ul className="mt-10 space-y-0">
                {[
                  "Zero-config request capture",
                  "Automatic latency measurement",
                  "Async log shipping (no overhead)",
                  "Status code & path extraction",
                ].map((item, i) => (
                  <li
                    key={item}
                    className="flex items-center gap-4 border-t border-dashed border-border py-3 text-sm last:border-b"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground w-8">
                      {pad(i + 1)}
                    </span>
                    <Plus className="h-3.5 w-3.5 text-foreground/40" />
                    <span className="text-foreground/85">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-12 lg:col-span-7">
              {/* IDE-style header with vertical-feeling tab rail above code */}
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1">
                  {SDK_LANGS.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLangChange(lang)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[11px] font-mono font-medium transition-all border",
                        sdkLang === lang
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      )}
                    >
                      {SDK_LABELS[lang]}
                    </button>
                  ))}
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground hidden sm:inline">
                  {SDK_LINES[sdkLang]} lines · {SDK_FILES[sdkLang]}
                </span>
              </div>

              <div
                key={sdkLang}
                className={cn(
                  slideDir === "right"
                    ? "animate-slide-in-right"
                    : "animate-slide-in-left"
                )}
              >
                <CodeFrame
                  filename={SDK_FILES[sdkLang]}
                  lang={SDK_LABELS[sdkLang]}
                  lineCount={SDK_LINES[sdkLang]}
                >
                  {sdkLang === "go" ? (
                    <pre>
                      <code>
                        <span className="text-chart-1">package</span>{" "}
                        <span className="text-foreground/70">main</span>
                        {"\n\n"}
                        <span className="text-chart-1">import</span>
                        <span className="text-muted-foreground"> (</span>
                        {"\n"}
                        {"    "}
                        <span className="text-emerald-400/80">&quot;net/http&quot;</span>
                        {"\n"}
                        {"    "}
                        <span className="text-emerald-400/80">
                          &quot;github.com/kivia-observe/kivia-sdk-go&quot;
                        </span>
                        {"\n"}
                        <span className="text-muted-foreground">)</span>
                        {"\n\n"}
                        <span className="text-chart-1">func</span>{" "}
                        <span className="text-chart-2">main</span>
                        <span className="text-muted-foreground">()</span>{" "}
                        <span className="text-muted-foreground">{"{"}</span>
                        {"\n"}
                        {"    "}
                        <span className="text-muted-foreground">{"// Initialize the client"}</span>
                        {"\n"}
                        {"    "}
                        <span className="text-foreground/70">client</span>{" "}
                        <span className="text-chart-1">:=</span>{" "}
                        <span className="text-chart-2">kiviasdk.NewClient</span>
                        <span className="text-muted-foreground">(</span>
                        {"\n"}
                        {"        "}
                        <span className="text-emerald-400/80">&quot;kivia_sk_your_key&quot;</span>
                        <span className="text-muted-foreground">,</span>
                        {"\n"}
                        {"    "}
                        <span className="text-muted-foreground">)</span>
                        {"\n\n"}
                        {"    "}
                        <span className="text-muted-foreground">{"// Wrap your handler — that&apos;s it"}</span>
                        {"\n"}
                        {"    "}
                        <span className="text-foreground/70">handler</span>{" "}
                        <span className="text-chart-1">:=</span>{" "}
                        <span className="text-chart-2">client.NewLog</span>
                        <span className="text-muted-foreground">(</span>
                        <span className="text-foreground/70">mux</span>
                        <span className="text-muted-foreground">)</span>
                        {"\n\n"}
                        {"    "}
                        <span className="text-chart-2">http.ListenAndServe</span>
                        <span className="text-muted-foreground">(</span>
                        <span className="text-emerald-400/80">&quot;:8080&quot;</span>
                        <span className="text-muted-foreground">,</span>{" "}
                        <span className="text-foreground/70">handler</span>
                        <span className="text-muted-foreground">)</span>
                        {"\n"}
                        <span className="text-muted-foreground">{"}"}</span>
                      </code>
                    </pre>
                  ) : sdkLang === "express" ? (
                    <pre>
                      <code>
                        <span className="text-chart-1">import</span>{" "}
                        <span className="text-muted-foreground">{"{ "}</span>
                        <span className="text-foreground/70">KiviaClient</span>
                        <span className="text-muted-foreground">{" }"}</span>{" "}
                        <span className="text-chart-1">from</span>{" "}
                        <span className="text-emerald-400/80">&quot;@kivia/sdk&quot;</span>
                        <span className="text-muted-foreground">;</span>
                        {"\n"}
                        <span className="text-chart-1">import</span>{" "}
                        <span className="text-foreground/70">express</span>{" "}
                        <span className="text-chart-1">from</span>{" "}
                        <span className="text-emerald-400/80">&quot;express&quot;</span>
                        <span className="text-muted-foreground">;</span>
                        {"\n\n"}
                        <span className="text-foreground/70">const</span>{" "}
                        <span className="text-foreground/70">app</span>{" "}
                        <span className="text-chart-1">=</span>{" "}
                        <span className="text-chart-2">express</span>
                        <span className="text-muted-foreground">();</span>
                        {"\n\n"}
                        <span className="text-muted-foreground">{"// Initialize the client"}</span>
                        {"\n"}
                        <span className="text-foreground/70">const</span>{" "}
                        <span className="text-foreground/70">client</span>{" "}
                        <span className="text-chart-1">=</span>{" "}
                        <span className="text-chart-1">new</span>{" "}
                        <span className="text-chart-2">KiviaClient</span>
                        <span className="text-muted-foreground">(</span>
                        <span className="text-emerald-400/80">&quot;kivia_sk_your_key&quot;</span>
                        <span className="text-muted-foreground">);</span>
                        {"\n\n"}
                        <span className="text-muted-foreground">{"// Plug in the middleware — that&apos;s it"}</span>
                        {"\n"}
                        <span className="text-foreground/70">app</span>
                        <span className="text-muted-foreground">.</span>
                        <span className="text-chart-2">use</span>
                        <span className="text-muted-foreground">(</span>
                        <span className="text-foreground/70">client</span>
                        <span className="text-muted-foreground">.</span>
                        <span className="text-chart-2">middleware</span>
                        <span className="text-muted-foreground">());</span>
                        {"\n\n"}
                        <span className="text-foreground/70">app</span>
                        <span className="text-muted-foreground">.</span>
                        <span className="text-chart-2">listen</span>
                        <span className="text-muted-foreground">(</span>
                        <span className="text-emerald-400/80">3000</span>
                        <span className="text-muted-foreground">);</span>
                      </code>
                    </pre>
                  ) : sdkLang === "hono" ? (
                    <pre>
                      <code>
                        <span className="text-chart-1">import</span>{" "}
                        <span className="text-muted-foreground">{"{ "}</span>
                        <span className="text-foreground/70">KiviaClient</span>
                        <span className="text-muted-foreground">{" }"}</span>{" "}
                        <span className="text-chart-1">from</span>{" "}
                        <span className="text-emerald-400/80">&quot;@kivia/sdk&quot;</span>
                        <span className="text-muted-foreground">;</span>
                        {"\n"}
                        <span className="text-chart-1">import</span>{" "}
                        <span className="text-muted-foreground">{"{ "}</span>
                        <span className="text-foreground/70">Hono</span>
                        <span className="text-muted-foreground">{" }"}</span>{" "}
                        <span className="text-chart-1">from</span>{" "}
                        <span className="text-emerald-400/80">&quot;hono&quot;</span>
                        <span className="text-muted-foreground">;</span>
                        {"\n\n"}
                        <span className="text-foreground/70">const</span>{" "}
                        <span className="text-foreground/70">app</span>{" "}
                        <span className="text-chart-1">=</span>{" "}
                        <span className="text-chart-1">new</span>{" "}
                        <span className="text-chart-2">Hono</span>
                        <span className="text-muted-foreground">();</span>
                        {"\n\n"}
                        <span className="text-muted-foreground">{"// Initialize the client"}</span>
                        {"\n"}
                        <span className="text-foreground/70">const</span>{" "}
                        <span className="text-foreground/70">client</span>{" "}
                        <span className="text-chart-1">=</span>{" "}
                        <span className="text-chart-1">new</span>{" "}
                        <span className="text-chart-2">KiviaClient</span>
                        <span className="text-muted-foreground">(</span>
                        <span className="text-emerald-400/80">&quot;kivia_sk_your_key&quot;</span>
                        <span className="text-muted-foreground">);</span>
                        {"\n\n"}
                        <span className="text-muted-foreground">{"// Add middleware — that&apos;s it"}</span>
                        {"\n"}
                        <span className="text-foreground/70">app</span>
                        <span className="text-muted-foreground">.</span>
                        <span className="text-chart-2">use</span>
                        <span className="text-muted-foreground">(</span>
                        <span className="text-emerald-400/80">&quot;*&quot;</span>
                        <span className="text-muted-foreground">, </span>
                        <span className="text-foreground/70">client</span>
                        <span className="text-muted-foreground">.</span>
                        <span className="text-chart-2">middleware</span>
                        <span className="text-muted-foreground">());</span>
                        {"\n\n"}
                        <span className="text-chart-1">export default</span>{" "}
                        <span className="text-foreground/70">app</span>
                        <span className="text-muted-foreground">;</span>
                      </code>
                    </pre>
                  ) : sdkLang === "fastify" ? (
                    <pre>
                      <code>
                        <span className="text-chart-1">import</span>{" "}
                        <span className="text-muted-foreground">{"{ "}</span>
                        <span className="text-foreground/70">KiviaClient</span>
                        <span className="text-muted-foreground">{" }"}</span>{" "}
                        <span className="text-chart-1">from</span>{" "}
                        <span className="text-emerald-400/80">&quot;@kivia/sdk&quot;</span>
                        <span className="text-muted-foreground">;</span>
                        {"\n"}
                        <span className="text-chart-1">import</span>{" "}
                        <span className="text-foreground/70">Fastify</span>{" "}
                        <span className="text-chart-1">from</span>{" "}
                        <span className="text-emerald-400/80">&quot;fastify&quot;</span>
                        <span className="text-muted-foreground">;</span>
                        {"\n\n"}
                        <span className="text-foreground/70">const</span>{" "}
                        <span className="text-foreground/70">app</span>{" "}
                        <span className="text-chart-1">=</span>{" "}
                        <span className="text-chart-2">Fastify</span>
                        <span className="text-muted-foreground">();</span>
                        {"\n\n"}
                        <span className="text-muted-foreground">{"// Initialize the client"}</span>
                        {"\n"}
                        <span className="text-foreground/70">const</span>{" "}
                        <span className="text-foreground/70">client</span>{" "}
                        <span className="text-chart-1">=</span>{" "}
                        <span className="text-chart-1">new</span>{" "}
                        <span className="text-chart-2">KiviaClient</span>
                        <span className="text-muted-foreground">(</span>
                        <span className="text-emerald-400/80">&quot;kivia_sk_your_key&quot;</span>
                        <span className="text-muted-foreground">);</span>
                        {"\n\n"}
                        <span className="text-muted-foreground">{"// Register plugin — that&apos;s it"}</span>
                        {"\n"}
                        <span className="text-chart-1">await</span>{" "}
                        <span className="text-foreground/70">app</span>
                        <span className="text-muted-foreground">.</span>
                        <span className="text-chart-2">register</span>
                        <span className="text-muted-foreground">(</span>
                        <span className="text-foreground/70">client</span>
                        <span className="text-muted-foreground">.</span>
                        <span className="text-chart-2">plugin</span>
                        <span className="text-muted-foreground">());</span>
                        {"\n"}
                        <span className="text-chart-1">await</span>{" "}
                        <span className="text-foreground/70">app</span>
                        <span className="text-muted-foreground">.</span>
                        <span className="text-chart-2">listen</span>
                        <span className="text-muted-foreground">({"{ "}</span>
                        <span className="text-foreground/70">port</span>
                        <span className="text-muted-foreground">: </span>
                        <span className="text-emerald-400/80">3000</span>
                        <span className="text-muted-foreground">{" }});"}</span>
                      </code>
                    </pre>
                  ) : (
                    <pre>
                      <code>
                        <span className="text-chart-1">import</span>{" "}
                        <span className="text-muted-foreground">{"{ "}</span>
                        <span className="text-foreground/70">KiviaClient</span>
                        <span className="text-muted-foreground">{" }"}</span>{" "}
                        <span className="text-chart-1">from</span>{" "}
                        <span className="text-emerald-400/80">&quot;@kivia/sdk&quot;</span>
                        <span className="text-muted-foreground">;</span>
                        {"\n"}
                        <span className="text-chart-1">import</span>{" "}
                        <span className="text-muted-foreground">{"{ "}</span>
                        <span className="text-foreground/70">Elysia</span>
                        <span className="text-muted-foreground">{" }"}</span>{" "}
                        <span className="text-chart-1">from</span>{" "}
                        <span className="text-emerald-400/80">&quot;elysia&quot;</span>
                        <span className="text-muted-foreground">;</span>
                        {"\n\n"}
                        <span className="text-muted-foreground">{"// Initialize the client"}</span>
                        {"\n"}
                        <span className="text-foreground/70">const</span>{" "}
                        <span className="text-foreground/70">client</span>{" "}
                        <span className="text-chart-1">=</span>{" "}
                        <span className="text-chart-1">new</span>{" "}
                        <span className="text-chart-2">KiviaClient</span>
                        <span className="text-muted-foreground">(</span>
                        <span className="text-emerald-400/80">&quot;kivia_sk_your_key&quot;</span>
                        <span className="text-muted-foreground">);</span>
                        {"\n\n"}
                        <span className="text-muted-foreground">{"// Plug in — that&apos;s it"}</span>
                        {"\n"}
                        <span className="text-foreground/70">const</span>{" "}
                        <span className="text-foreground/70">app</span>{" "}
                        <span className="text-chart-1">=</span>{" "}
                        <span className="text-chart-1">new</span>{" "}
                        <span className="text-chart-2">Elysia</span>
                        <span className="text-muted-foreground">()</span>
                        {"\n"}
                        {"  "}
                        <span className="text-muted-foreground">.</span>
                        <span className="text-chart-2">use</span>
                        <span className="text-muted-foreground">(</span>
                        <span className="text-foreground/70">client</span>
                        <span className="text-muted-foreground">.</span>
                        <span className="text-chart-2">plugin</span>
                        <span className="text-muted-foreground">())</span>
                        {"\n"}
                        {"  "}
                        <span className="text-muted-foreground">.</span>
                        <span className="text-chart-2">listen</span>
                        <span className="text-muted-foreground">(</span>
                        <span className="text-emerald-400/80">3000</span>
                        <span className="text-muted-foreground">);</span>
                      </code>
                    </pre>
                  )}
                </CodeFrame>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Capabilities (numbered editorial table) ────────────────────── */}
      <section id="capabilities" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mb-16 grid grid-cols-12 gap-6 md:gap-10">
            <h2 className="col-span-12 lg:col-span-9 font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-foreground leading-[1.02]">
              Everything you need.
              <br />
              <span className="italic font-light text-foreground/60">Nothing</span>
              <span> you don&apos;t.</span>
            </h2>
          </div>

          <div className="border-t border-border">
            {[
              {
                icon: Activity,
                title: "Real-time monitoring",
                description:
                  "Watch every API request as it happens with live-updating logs and status indicators.",
                tag: "live · sse",
              },
              {
                icon: Shield,
                title: "API key management",
                description:
                  "Generate, rotate, and revoke API keys with fine-grained per-project control.",
                tag: "hashed · scoped",
              },
              {
                icon: BarChart3,
                title: "Latency analytics",
                description:
                  "Pinpoint slow endpoints with detailed latency breakdowns and percentile tracking.",
                tag: "p50 · p95 · p99",
              },
              {
                icon: Code2,
                title: "Drop-in SDK",
                description:
                  "Three lines of code. Works with Express, Hono, Fastify, Elysia, and Go out of the box.",
                tag: "5 runtimes",
              },
              {
                icon: Globe,
                title: "Per-project scoping",
                description:
                  "Isolated keys and logs per project. Perfect for multi-service architectures.",
                tag: "isolated",
              },
              {
                icon: Clock,
                title: "Historical logs",
                description:
                  "Query past requests by date range, status code, and path with full context.",
                tag: "queryable",
              },
            ].map(({ icon: Icon, title, description, tag }, i) => (
              <div
                key={title}
                className="group grid grid-cols-12 gap-4 md:gap-6 items-start border-b border-border py-7 md:py-8 transition-colors hover:bg-muted/15"
              >
                <div className="col-span-2 md:col-span-1 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground pt-1">
                  {pad(i + 1)}
                </div>
                <div className="col-span-2 md:col-span-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground ring-1 ring-border transition-colors group-hover:ring-foreground/40">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="col-span-8 md:col-span-6">
                  <h3 className="font-display text-xl font-semibold text-foreground tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
                <div className="col-span-12 md:col-span-3 md:text-right">
                  <span className="inline-flex items-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground border border-border rounded-md px-2.5 py-1">
                    {tag}
                  </span>
                </div>
                <div className="col-span-12 md:col-span-1 md:text-right pt-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowUpRight className="ml-auto h-4 w-4 text-foreground/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-muted/15">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-px bg-border rounded-2xl overflow-hidden border border-border">
            <div className="grid sm:grid-cols-3 gap-px bg-border">
              {[
                {
                  value: "< 2",
                  unit: "min",
                  label: "Integration time",
                  detail: "From npm install to first capture.",
                },
                {
                  value: "< 1",
                  unit: "ms",
                  label: "Middleware overhead",
                  detail: "Async log shipping. Non-blocking.",
                },
                {
                  value: "100",
                  unit: "%",
                  label: "Request capture rate",
                  detail: "Every request. Every status. Every path.",
                },
              ].map(({ value, unit, label, detail }, i) => (
                <div
                  key={label}
                  className="relative bg-background p-8 md:p-10 group hover:bg-card/40 transition-colors"
                >
                  <div className="flex items-start justify-between mb-6">
                    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                      {pad(i + 1)} / 03
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-6xl md:text-7xl font-bold tracking-tight text-foreground tabular-nums">
                      {value}
                    </span>
                    <span className="font-display text-2xl md:text-3xl font-light text-foreground/50">
                      {unit}
                    </span>
                  </div>
                  <p className="mt-4 font-display text-base font-semibold text-foreground tracking-tight">
                    {label}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-xs">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-foreground/[0.05] blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-36">
          <div className="relative mx-auto max-w-4xl">
            {/* corner brackets */}
            <span aria-hidden className="absolute -left-2 -top-2 h-5 w-5 border-l border-t border-foreground/40" />
            <span aria-hidden className="absolute -right-2 -top-2 h-5 w-5 border-r border-t border-foreground/40" />
            <span aria-hidden className="absolute -bottom-2 -left-2 h-5 w-5 border-b border-l border-foreground/40" />
            <span aria-hidden className="absolute -bottom-2 -right-2 h-5 w-5 border-b border-r border-foreground/40" />

            <div className="px-4 py-12 md:px-12 md:py-16 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-muted-foreground mb-8">
                / Begin transmission
              </p>
              <h2 className="font-display font-bold tracking-tight leading-[0.95] text-[clamp(2.5rem,9vw,7rem)] text-foreground">
                Ready to see what
                <br />
                <span className="italic font-light text-foreground/60">your APIs</span>{" "}
                are doing?
              </h2>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-8 py-3.5 text-base font-medium text-background hover:bg-foreground/90 transition-all shadow-xl shadow-foreground/10 hover:-translate-y-0.5"
                >
                  Create free account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-8 py-3.5 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all backdrop-blur-sm"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-muted/15">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2 mb-5">
                <Image
                  src="/logo.svg"
                  alt="Kivia"
                  width={28}
                  height={28}
                  className="rounded-md"
                />
                <span className="font-display font-bold text-lg">Kivia</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                  v0.9 · beta
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                Lightweight API observability for modern backends. Monitor,
                manage, and understand your API traffic — without the bloat or
                the bill.
              </p>
            </div>

            <div className="lg:col-span-2 lg:col-start-7">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground mb-4">
                Product
              </p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <button
                    onClick={() => scrollTo("features")}
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("sdk")}
                    className="hover:text-foreground transition-colors"
                  >
                    SDK
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("how-it-works")}
                    className="hover:text-foreground transition-colors"
                  >
                    Pipeline
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("capabilities")}
                    className="hover:text-foreground transition-colors"
                  >
                    Capabilities
                  </button>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground mb-4">
                Resources
              </p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-foreground transition-colors">
                    Get started
                  </Link>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground mb-4">
                Legal
              </p>
              <ul className="space-y-2.5 text-sm text-muted-foreground/60">
                <li>Terms</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
            <p>© {new Date().getFullYear()} · Kivia · all rights reserved</p>
            <p>Built for developers who care about their APIs.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
