"use client";

import { useState, useRef, useEffect } from "react";
import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Copy,
  Check,
  Plus,
  RefreshCw,
  TriangleAlert,
  KeyRound,
  Activity,
  FolderX,
  ArrowLeft,
  BarChart3,
  LineChart,
} from "lucide-react";
import { toast } from "sonner";
import {
  getProjects,
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getLogs,
  getLogsChart,
  type ApiKey,
  type Log,
  type LogChart,
} from "@/lib/api";
import { useLogStream } from "@/hooks/useLogStream";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function StatusBadge({ status }: { status: number }) {
  let className = "";

  if (status >= 200 && status < 300) {
    className =
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60";
  } else if (status >= 300 && status < 400) {
    className =
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/60";
  } else if (status >= 400 && status < 500) {
    className =
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60";
  } else if (status >= 500) {
    className =
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60";
  }

  return (
    <Badge
      variant="outline"
      className={`font-mono text-xs px-1.5 py-0 ${className}`}
    >
      {status}
    </Badge>
  );
}

// ── API Keys Tab ──────────────────────────────────────────────────────────

function ApiKeysTab({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const envPresets = ["production", "staging", "development", "test"];

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ["apiKeys", projectId],
    queryFn: () => getApiKeys(projectId),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createApiKey(name, projectId),
    onSuccess: (res) => {
      setNewKey(res.api_key);
      setDialogOpen(false);
      setKeyName("");
      setShowKeyDialog(true);
      queryClient.invalidateQueries({ queryKey: ["apiKeys", projectId] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to create API key",
      );
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: () => {
      toast.success("API key revoked");
      queryClient.invalidateQueries({ queryKey: ["apiKeys", projectId] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to revoke key");
    },
  });

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!keyName.trim()) return;
    createMutation.mutate(keyName.trim());
  }

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-base font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage keys used to authenticate SDK requests
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Key
        </Button>
      </div>

      {/* Create Key Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              Create a new API key
            </DialogTitle>
            <DialogDescription>
              Give this key a descriptive name so you can identify it later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="py-4 space-y-2">
              <Label htmlFor="key-name">Environment</Label>
              <Input
                id="key-name"
                placeholder="e.g. production"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                required
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {envPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setKeyName(preset)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      keyName === preset
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating\u2026" : "Create key"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Show New Key Dialog */}
      <Dialog
        open={showKeyDialog}
        onOpenChange={(open) => setShowKeyDialog(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Your new API key</DialogTitle>
            <DialogDescription>
              Copy this key now. For security reasons, it will not be shown
              again.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 px-3.5 py-3">
              <TriangleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
                This key will only be shown once. Store it somewhere safe.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border bg-muted px-3 py-2.5 text-sm font-mono break-all leading-relaxed">
                {newKey}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyKey}
                aria-label="Copy key"
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowKeyDialog(false)}>
              I&apos;ve saved this key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keys Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-14 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-display text-sm font-medium mb-0.5">
            No API keys yet
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Create a key to start sending requests with the SDK.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create your first key
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                  Environment
                </TableHead>
                <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                  Created
                </TableHead>
                <TableHead className="text-right font-display font-semibold text-xs uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key: ApiKey) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-mono">
                      {key.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {key.revoked ? (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground border-muted-foreground/30"
                      >
                        Revoked
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
                      >
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(key.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    {!key.revoked && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={revokeMutation.isPending}
                        onClick={() => revokeMutation.mutate(key.id)}
                        className="text-destructive border-destructive/30 hover:bg-destructive hover:text-white"
                      >
                        {revokeMutation.isPending ? "Revoking\u2026" : "Revoke"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Logs Tab ──────────────────────────────────────────────────────────────

const LOGS_PER_PAGE = 10;

type StatusKey = "2xx" | "3xx" | "4xx" | "5xx";
type ChartType = "bar" | "line";
type ChartRange = "7d" | "30d" | "8m" | "custom";

const STATUS_KEYS: StatusKey[] = ["2xx", "3xx", "4xx", "5xx"];

const STATUS_FILL: Record<StatusKey, string> = {
  "2xx": "#34d399",
  "3xx": "#38bdf8",
  "4xx": "#fbbf24",
  "5xx": "#f87171",
};

const STATUS_DOT: Record<StatusKey, string> = {
  "2xx": "bg-emerald-400",
  "3xx": "bg-sky-400",
  "4xx": "bg-amber-400",
  "5xx": "bg-red-400",
};

function niceMax(n: number): number {
  if (n <= 0) return 4;
  const exp = Math.floor(Math.log10(n));
  const mag = Math.pow(10, exp);
  const f = n / mag;
  if (f <= 1.5) return 2 * mag;
  if (f <= 3) return 4 * mag;
  if (f <= 7) return 8 * mag;
  return 10 * mag;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPresetDateRange(range: Exclude<ChartRange, "custom">) {
  const end = new Date();
  const start = new Date(end);

  if (range === "7d") {
    start.setDate(start.getDate() - 6);
  } else if (range === "30d") {
    start.setDate(start.getDate() - 29);
  } else {
    start.setMonth(start.getMonth() - 8);
  }

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
}

function getSmoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const commands = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    commands.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
  }

  return commands.join(" ");
}

function RequestStatusChart({
  chartData,
  chartType,
}: {
  chartData: LogChart[];
  chartType: ChartType;
}) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(700);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setChartWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => {
      setChartWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dailyStatusCounts = chartData.reduce(
    (acc, bucket) => {
      const dayKey = new Date(bucket.date).toISOString().slice(0, 10);
      if (!acc[dayKey])
        acc[dayKey] = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
      for (const log of bucket.logs) {
        const count = log.count ?? 1;
        const s = log.status;
        if (s >= 200 && s < 300) acc[dayKey]["2xx"] += count;
        else if (s >= 300 && s < 400) acc[dayKey]["3xx"] += count;
        else if (s >= 400 && s < 500) acc[dayKey]["4xx"] += count;
        else if (s >= 500) acc[dayKey]["5xx"] += count;
      }
      return acc;
    },
    {} as Record<string, Record<StatusKey, number>>,
  );

  const dayKeys = Object.keys(dailyStatusCounts).sort();
  const hasData = dayKeys.length > 0;
  const maxVal = dayKeys.reduce((max, day) => {
    const b = dailyStatusCounts[day];
    const dayMax =
      chartType === "bar"
        ? STATUS_KEYS.reduce((s, k) => s + b[k], 0)
        : Math.max(...STATUS_KEYS.map((k) => b[k]));
    return Math.max(max, dayMax);
  }, 0);

  const yMax = niceMax(maxVal);
  const TICKS = 4;
  const yTicks = Array.from(
    { length: TICKS + 1 },
    (_, i) => (i * yMax) / TICKS,
  );

  const ML = 44,
    MR = 16,
    MT = 12,
    MB = 32;
  const H = 180;
  const CW = Math.max(chartWidth - ML - MR, 1);
  const CH = H - MT - MB;
  const N = Math.max(dayKeys.length, 1);
  const slotW = CW / N;
  const barW = Math.max(6, Math.min(slotW * 0.55, 40));
  const yScale = (v: number) => CH - (v / yMax) * CH;
  const xScale = (i: number) =>
    dayKeys.length <= 1 ? CW / 2 : i * slotW + slotW / 2;
  const fmtTick = (v: number) =>
    v >= 1000
      ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`
      : String(Math.round(v));
  const fmtLabel = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  const labelStep = N > 20 ? 5 : N > 10 ? 2 : 1;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Requests per day by status
        </p>
        <div className="flex gap-4">
          {STATUS_KEYS.map((code) => (
            <div
              key={code}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[code]}`} />
              {code}
            </div>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative"
        onMouseLeave={() => setHoveredDay(null)}
      >
        <svg width={chartWidth} height={H} className="overflow-visible block">
          <g transform={`translate(${ML},${MT})`}>
            {/* Y-axis gridlines and labels */}
            {yTicks.map((tick) => {
              const y = yScale(tick);
              return (
                <g key={tick}>
                  <line
                    x1={0}
                    y1={y}
                    x2={CW}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity={tick === 0 ? 0.15 : 0.06}
                    strokeWidth={1}
                  />
                  <text
                    x={-8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={10}
                    fill="currentColor"
                    fillOpacity={0.4}
                  >
                    {fmtTick(tick)}
                  </text>
                </g>
              );
            })}

            {chartType === "line" &&
              STATUS_KEYS.map((code) => {
                const points = dayKeys.map((day, i) => ({
                  x: xScale(i),
                  y: yScale(dailyStatusCounts[day][code]),
                  value: dailyStatusCounts[day][code],
                }));
                const path = getSmoothPath(points);

                return (
                  <g key={code}>
                    {points.length > 1 && (
                      <path
                        d={path}
                        fill="none"
                        stroke={STATUS_FILL[code]}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.9}
                      />
                    )}
                    {points.map((point, i) => (
                      <circle
                        key={`${code}-${dayKeys[i]}`}
                        cx={point.x}
                        cy={point.y}
                        r={hoveredDay === dayKeys[i] || point.value > 0 ? 3 : 0}
                        fill={STATUS_FILL[code]}
                        opacity={hoveredDay === dayKeys[i] ? 1 : 0.85}
                      />
                    ))}
                  </g>
                );
              })}

            {dayKeys.map((day, i) => {
              const b = dailyStatusCounts[day];
              const cx = xScale(i);
              const x = cx - barW / 2;
              const isHovered = hoveredDay === day;
              const total = STATUS_KEYS.reduce((s, k) => s + b[k], 0);

              const rawSegs = STATUS_KEYS.map((code) => ({
                code,
                count: b[code],
                h: (b[code] / yMax) * CH,
              })).filter((seg) => seg.count > 0);
              const segments = (() => {
                let yPos = CH;
                return rawSegs.map((seg, si) => {
                  yPos -= seg.h;
                  return { ...seg, y: yPos, isTop: si === rawSegs.length - 1 };
                });
              })();

              return (
                <g key={day}>
                  {/* Wide invisible hover zone */}
                  <rect
                    x={cx - slotW / 2}
                    y={0}
                    width={slotW}
                    height={CH}
                    fill="transparent"
                    onMouseEnter={() => setHoveredDay(day)}
                  />
                  {/* Hover highlight column */}
                  {isHovered && (
                    <rect
                      x={x - 4}
                      y={0}
                      width={barW + 8}
                      height={CH}
                      fill="currentColor"
                      fillOpacity={0.05}
                      rx={4}
                    />
                  )}
                  {chartType === "bar" &&
                    segments.map((seg) => (
                      <rect
                        key={seg.code}
                        x={x}
                        y={seg.y}
                        width={barW}
                        height={seg.h}
                        fill={STATUS_FILL[seg.code]}
                        fillOpacity={isHovered ? 1 : 0.85}
                        rx={seg.isTop ? 2.5 : 0}
                        ry={seg.isTop ? 2.5 : 0}
                      />
                    ))}
                  {isHovered && total > 0 && chartType === "bar" && (
                    <text
                      x={cx}
                      y={yScale(total) - 6}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight={600}
                      fill="currentColor"
                      fillOpacity={0.65}
                    >
                      {total.toLocaleString()}
                    </text>
                  )}
                  {/* X-axis label */}
                  {i % labelStep === 0 && (
                    <text
                      x={cx}
                      y={CH + 16}
                      textAnchor="middle"
                      fontSize={9}
                      fill="currentColor"
                      fillOpacity={isHovered ? 0.7 : 0.4}
                    >
                      {fmtLabel(day)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            No chart data for this date range.
          </div>
        )}

        {/* Floating tooltip */}
        {hoveredDay &&
          (() => {
            const b = dailyStatusCounts[hoveredDay];
            const dayIdx = dayKeys.indexOf(hoveredDay);
            const total = STATUS_KEYS.reduce((s, k) => s + b[k], 0);
            const barCx = ML + xScale(dayIdx);
            const flip = barCx / chartWidth > 0.6;

            return (
              <div
                className="absolute top-0 z-20 pointer-events-none min-w-[9rem] rounded-lg border bg-popover text-popover-foreground shadow-md px-3 py-2.5 text-xs"
                style={{
                  left: barCx,
                  transform: flip
                    ? "translateX(calc(-100% - 10px))"
                    : "translateX(10px)",
                }}
              >
                <p className="font-semibold text-foreground mb-2">
                  {new Date(hoveredDay + "T00:00:00").toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </p>
                <div className="space-y-1">
                  {STATUS_KEYS.filter((c) => b[c] > 0).map((code) => (
                    <div
                      key={code}
                      className="flex items-center justify-between gap-5"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[code]}`}
                        />
                        <span className="text-muted-foreground">{code}</span>
                      </div>
                      <span className="font-mono font-semibold tabular-nums">
                        {b[code].toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t flex items-center justify-between gap-5">
                  <span className="text-muted-foreground font-medium">
                    Total
                  </span>
                  <span className="font-mono font-semibold tabular-nums">
                    {total.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}

function LogsTab({ projectId }: { projectId: string }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [apiKeyType, setApiKeyType] = useState("");
  const [chartRange, setChartRange] = useState<ChartRange>("7d");
  const [chartStartDate, setChartStartDate] = useState("");
  const [chartEndDate, setChartEndDate] = useState("");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [page, setPage] = useState(1);

  const hasFilters = !!(startDate || endDate || statusCode || apiKeyType);
  const {
    logs: streamedLogs,
    connected,
    clear: clearStream,
  } = useLogStream(projectId, page === 1 && !hasFilters);

  const { data: apiKeys = [] } = useQuery({
    queryKey: ["apiKeys", projectId],
    queryFn: () => getApiKeys(projectId),
  });

  // Build a lookup map: api_key UUID -> name
  const apiKeyNameMap = new Map(apiKeys.map((k: ApiKey) => [k.id, k.name]));

  const environments = Array.from(
    new Set(
      apiKeys.filter((k: ApiKey) => !k.revoked).map((k: ApiKey) => k.name),
    ),
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      "logs",
      projectId,
      page,
      startDate || undefined,
      endDate || undefined,
      statusCode || undefined,
      apiKeyType || undefined,
    ],
    queryFn: () =>
      getLogs(
        projectId,
        page,
        LOGS_PER_PAGE,
        startDate || undefined,
        endDate || undefined,
        statusCode || undefined,
        apiKeyType || undefined,
      ),
  });

  const presetChartRange =
    chartRange === "custom" ? null : getPresetDateRange(chartRange);
  const activeChartStartDate =
    chartRange === "custom" ? chartStartDate : presetChartRange?.startDate;
  const activeChartEndDate =
    chartRange === "custom" ? chartEndDate : presetChartRange?.endDate;
  const hasCustomChartRange =
    chartRange === "custom" && !!(chartStartDate || chartEndDate);

  const { data: chartData = [], isLoading: chartLoading } = useQuery({
    queryKey: [
      "logs-chart",
      projectId,
      chartRange,
      activeChartStartDate || undefined,
      activeChartEndDate || undefined,
    ],
    queryFn: () =>
      getLogsChart(
        projectId,
        activeChartStartDate || undefined,
        activeChartEndDate || undefined,
      ),
  });

  const paginatedLogs: Log[] = data?.logs ?? [];
  const totalItems = data?.total_items ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / LOGS_PER_PAGE));

  // On page 1 with no filters, prepend streamed logs (deduplicated)
  const paginatedIds = new Set(paginatedLogs.map((l) => l.id));
  const uniqueStreamed = streamedLogs.filter((l) => !paginatedIds.has(l.id));
  const logs: Log[] =
    page === 1 && !hasFilters
      ? [...uniqueStreamed, ...paginatedLogs]
      : paginatedLogs;

  function handleFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(1);
  }

  function getPageNumbers() {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis");
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
      ) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  }

  return (
    <div className="flex min-h-[calc(100vh-15rem)] flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">
              Request Logs
            </h2>
          </div>
          {connected && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            clearStream();
            refetch();
          }}
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Date filter */}
      <form
        onSubmit={handleFilter}
        className="flex flex-wrap items-end gap-3 mb-6 p-4 rounded-xl bg-muted/30 border"
      >
        <div className="space-y-1.5">
          <Label htmlFor="start-date" className="text-xs font-medium">
            Start date
          </Label>
          <Input
            id="start-date"
            type="date"
            className="w-40 h-8 text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end-date" className="text-xs font-medium">
            End date
          </Label>
          <Input
            id="end-date"
            type="date"
            className="w-40 h-8 text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status-code" className="text-xs font-medium">
            Status code
          </Label>
          <select
            id="status-code"
            className="w-32 h-8 text-sm rounded-md border border-input bg-background px-2"
            value={statusCode}
            onChange={(e) => setStatusCode(e.target.value)}
          >
            <option value="">All</option>
            <option value="200">2xx</option>
            <option value="300">3xx</option>
            <option value="400">4xx</option>
            <option value="500">5xx</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="api-key-type" className="text-xs font-medium">
            Environment
          </Label>
          <select
            id="api-key-type"
            className="w-36 h-8 text-sm rounded-md border border-input bg-background px-2"
            value={apiKeyType}
            onChange={(e) => setApiKeyType(e.target.value)}
          >
            <option value="">All</option>
            {environments.map((env: string) => (
              <option key={env} value={env}>
                {env}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={isFetching}>
          Apply filter
        </Button>
        {(startDate || endDate || statusCode || apiKeyType) && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setStatusCode("");
              setApiKeyType("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </form>

      <div className="rounded-xl border bg-card px-5 py-4 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Chart range
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="chart-range" className="text-xs font-medium">
                Range
              </Label>
              <select
                id="chart-range"
                className="h-8 w-36 rounded-md border border-input bg-background px-2 text-sm"
                value={chartRange}
                onChange={(e) => setChartRange(e.target.value as ChartRange)}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="8m">Last 8 months</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {chartRange === "custom" && (
              <>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="chart-start-date"
                    className="text-xs font-medium"
                  >
                    Start date
                  </Label>
                  <Input
                    id="chart-start-date"
                    type="date"
                    className="w-40 h-8 text-sm"
                    value={chartStartDate}
                    onChange={(e) => setChartStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="chart-end-date"
                    className="text-xs font-medium"
                  >
                    End date
                  </Label>
                  <Input
                    id="chart-end-date"
                    type="date"
                    className="w-40 h-8 text-sm"
                    value={chartEndDate}
                    onChange={(e) => setChartEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
            {hasCustomChartRange && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => {
                  setChartStartDate("");
                  setChartEndDate("");
                }}
              >
                Clear
              </Button>
            )}
            <div className="flex h-8 rounded-md border bg-background p-0.5">
              <Button
                type="button"
                size="sm"
                variant={chartType === "bar" ? "secondary" : "ghost"}
                className="h-7 px-2.5"
                aria-pressed={chartType === "bar"}
                onClick={() => setChartType("bar")}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Bar
              </Button>
              <Button
                type="button"
                size="sm"
                variant={chartType === "line" ? "secondary" : "ghost"}
                className="h-7 px-2.5"
                aria-pressed={chartType === "line"}
                onClick={() => setChartType("line")}
              >
                <LineChart className="h-3.5 w-3.5" />
                Line
              </Button>
            </div>
          </div>
        </div>

        {chartLoading ? (
          <Skeleton className="mt-6 h-44 w-full rounded-xl" />
        ) : (
          <RequestStatusChart chartData={chartData} chartType={chartType} />
        )}
      </div>

      {/* Logs table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-14 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-display text-sm font-medium mb-0.5">
            No logs found
          </p>
          <p className="text-xs text-muted-foreground">
            No requests captured for the selected date range.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                    Path
                  </TableHead>
                  <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                    API Key
                  </TableHead>
                  <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                    IP Address
                  </TableHead>
                  <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                    Latency
                  </TableHead>
                  <TableHead className="font-display font-semibold text-xs uppercase tracking-wider">
                    Timestamp
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: Log) => (
                  <TableRow key={log.id}>
                    <TableCell
                      className="font-mono text-sm max-w-50 truncate"
                      title={log.path}
                    >
                      {log.path}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={log.status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {apiKeyNameMap.get(log.api_key) || log.api_key}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {log.ip_address}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {log.latency}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="sticky bottom-0 z-30 mt-auto bg-background/95 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="relative flex min-h-10 items-center justify-center">
              <p className="absolute left-0 hidden text-sm text-muted-foreground sm:block">
                {totalItems} total log{totalItems !== 1 ? "s" : ""}
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-disabled={page <= 1}
                      className={
                        page <= 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {getPageNumbers().map((p, i) =>
                    p === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink
                          isActive={p === page}
                          onClick={() => setPage(p)}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      aria-disabled={page >= totalPages}
                      className={
                        page >= totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

type Tab = "api-keys" | "logs";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "api-keys", label: "API Keys", icon: KeyRound },
  { id: "logs", label: "Request Logs", icon: Activity },
];

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("api-keys");

  const { data: projects = [], isLoading: loadingProject } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const project = projects.find((p) => p.id === projectId) ?? null;

  if (!loadingProject && !project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-10 w-full min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="relative mb-6">
            <p className="text-[8rem] leading-none font-display font-black tracking-tighter text-primary/10 select-none">
              404
            </p>
            <p className="absolute inset-0 flex items-center justify-center text-5xl font-display font-bold tracking-tighter text-primary">
              404
            </p>
          </div>

          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <FolderX className="h-6 w-6 text-muted-foreground" />
          </div>

          <h1 className="font-display text-xl font-bold tracking-tight">
            Project not found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            The project you&apos;re looking for doesn&apos;t exist or may have
            been deleted.
          </p>

          <Separator className="my-6 max-w-xs" />

          <div className="flex gap-3">
            <Button nativeButton={false} render={<Link href="/projects" />}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              All Projects
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 w-full">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        {loadingProject ? (
          <>
            <Skeleton className="h-7 w-48 mb-1.5" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {project?.name ?? "Project"}
            </h1>
            {project && (
              <p className="text-muted-foreground text-sm mt-1">
                Created {formatDate(project.created_at)}
              </p>
            )}
          </>
        )}
      </div>

      {/* Tabs */}
      <div
        className="mb-6 flex gap-1 rounded-lg bg-muted/40 p-1 w-fit animate-fade-in-up"
        style={{ animationDelay: "80ms" }}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
        {activeTab === "api-keys" ? (
          <ApiKeysTab projectId={projectId} />
        ) : (
          <LogsTab projectId={projectId} />
        )}
      </div>
    </div>
  );
}
