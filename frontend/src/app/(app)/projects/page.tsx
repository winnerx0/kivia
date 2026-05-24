"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  FolderOpen,
  KeyRound,
  Calendar,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getProjects, createProject, deleteProject, type Project } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createProject(name),
    onSuccess: () => {
      toast.success("Project created successfully");
      setDialogOpen(false);
      setNewProjectName("");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to create project"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: () => {
      toast.success("Project deleted");
      setProjectToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete project"
      );
    },
  });

  function handleCreateProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    createMutation.mutate(newProjectName.trim());
  }

  return (
    <div className="p-6 md:p-10 w-full">
      <div className="mb-8 flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and monitor your API projects
          </p>
        </div>
        <Button size="lg" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Project
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => setDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Create a new project</DialogTitle>
            <DialogDescription>
              Give your project a descriptive name to identify it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject}>
            <div className="py-4 space-y-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                placeholder="e.g. Production API"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                required
                autoFocus
              />
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
                {createMutation.isPending ? "Creating\u2026" : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={projectToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setProjectToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Delete project?</DialogTitle>
            <DialogDescription>
              This permanently deletes {projectToDelete?.name} and its API keys.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setProjectToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending || !projectToDelete}
              onClick={() => {
                if (projectToDelete) deleteMutation.mutate(projectToDelete.id);
              }}
            >
              {deleteMutation.isPending ? "Deleting\u2026" : "Delete project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <Skeleton className="h-9 w-9 rounded-lg mb-4" />
              <Skeleton className="h-5 w-32 mb-1.5" />
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-20 text-center animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
            <FolderOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-display text-base font-semibold mb-1">No projects yet</h3>
          <p className="text-muted-foreground text-sm mb-5 max-w-xs">
            Create your first project to start monitoring API traffic with
            the Kivia SDK.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative rounded-xl border bg-card p-5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/[0.03] transition-all h-full flex flex-col"
            >
              <Link
                href={`/projects/${project.id}`}
                className="absolute inset-0 z-0 rounded-xl"
                aria-label={`Open ${project.name}`}
              />
              <div className="relative z-10 flex h-full flex-col pointer-events-none">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => setProjectToDelete(project)}
                      aria-label={`Delete ${project.name}`}
                      title="Delete project"
                      className="pointer-events-auto opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-sm mb-1.5 leading-snug">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(project.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-3 mt-4">
                  <KeyRound className="h-3 w-3" />
                  <span>
                    {project.api_keys} API{" "}
                    {(project.api_keys) === 1 ? "key" : "keys"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
