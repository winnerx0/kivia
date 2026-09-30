"use client";

import Link from "@/components/Link";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, KeyRound, ArrowRight, Activity } from "lucide-react";
import { getProjects } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const totalApiKeys = projects.reduce(
    (sum, p) => sum + (p.api_keys ?? 0),
    0
  );

  return (
    <div className="p-6 md:p-10 w-full">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back. Here&apos;s an overview of your API observability.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Projects"
              value={projects.length}
              description="Active projects being monitored"
              icon={FolderOpen}
              color="blue"
            />
            <StatCard
              title="Total API Keys"
              value={totalApiKeys}
              description="Keys across all projects"
              icon={KeyRound}
              color="indigo"
            />
          </>
        )}
      </div>

      {!isLoading && projects.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed bg-muted/20 px-8 py-14 text-center animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <FolderOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-display text-base font-semibold mb-1">No projects yet</h3>
          <p className="text-muted-foreground text-sm mb-5 max-w-xs mx-auto">
            Create your first project to start monitoring API traffic.
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            Go to Projects <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {!isLoading && projects.length > 0 && (
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Projects
            </h2>
            <Link
              href="/projects"
              className="text-xs text-primary hover:underline underline-offset-4 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="rounded-xl border divide-y overflow-hidden bg-card">
            {projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FolderOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium block">
                      {project.name}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Activity className="h-3 w-3" />
                      {project.api_keys} key
                      {(project.api_keys) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const colorMap = {
  blue: {
    bg: "bg-primary/10",
    icon: "text-primary",
    ring: "ring-primary/20",
  },
  indigo: {
    bg: "bg-chart-4/10",
    icon: "text-chart-4",
    ring: "ring-chart-4/20",
  },
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  color: keyof typeof colorMap;
}) {
  const colors = colorMap[color];
  return (
    <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${colors.bg} ${colors.ring}`}
          >
            <Icon className={`h-5 w-5 ${colors.icon}`} />
          </div>
        </div>
        <div className="font-display text-3xl font-bold tracking-tight tabular-nums mb-1">
          {value}
        </div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="border shadow-sm">
      <CardContent className="pt-6">
        <Skeleton className="h-10 w-10 rounded-lg mb-4" />
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-4 w-28 mb-1" />
        <Skeleton className="h-3 w-36" />
      </CardContent>
    </Card>
  );
}
