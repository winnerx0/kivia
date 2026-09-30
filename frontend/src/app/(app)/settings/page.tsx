"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Trash2, LogOut, Moon, Sun, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";
import { clearTokens } from "@/lib/auth";
import { getCurrentUser, updateUser, deleteAccount } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });

  // Initialize form fields when user data loads
  if (user && !initialized) {
    setName(user.name);
    setEmail(user.email);
    setInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: () => updateUser({ name, email }),
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      clearTokens();
      navigate("/login");
      toast.success("Account deleted");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete account",
      );
    },
  });

  function handleUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    updateMutation.mutate();
  }

  function handleDeleteAccount() {
    if (deleteConfirm !== "delete my account") return;
    deleteMutation.mutate();
  }

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("kivia_theme", next ? "dark" : "light");
    toast.success(`Switched to ${next ? "dark" : "light"} mode`);
  }

  function handleLogout() {
    clearTokens();
    navigate("/login");
  }

  return (
    <div className="p-6 md:p-10 w-full flex flex-col">
      <div className="mb-8 w-full animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div
        className="space-y-6 max-w-2xl self-center w-full animate-fade-in-up"
        style={{ animationDelay: "80ms" }}
      >
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-display text-base font-semibold">
                  Profile
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your account information
                </p>
              </div>
            </div>
            <Separator className="mb-5" />

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : (
              <>
                {user && (
                  <div className="flex items-center gap-3 mb-5 p-3 rounded-lg bg-muted/30">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {user.profile_picture && (
                <img
                          src={user.profile_picture}
                          alt={user.name}
                          className="h-9 w-9 rounded-full"
                          width={1000}
                          height={1000}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {formatDate(user.joined_at)}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {user.role}
                    </Badge>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={
                        updateMutation.isPending ||
                        (name === user?.name && email === user?.email)
                      }
                    >
                      {updateMutation.isPending
                        ? "Saving\u2026"
                        : "Save changes"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-4">
              {darkMode ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              <div>
                <h2 className="font-display text-base font-semibold">
                  Appearance
                </h2>
                <p className="text-sm text-muted-foreground">
                  Customize the look and feel
                </p>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Toggle between light and dark mode
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                {darkMode ? (
                  <>
                    <Sun className="h-4 w-4 mr-1.5" />
                    Light mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-1.5" />
                    Dark mode
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Session */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-4">
              <LogOut className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="font-display text-base font-semibold">
                  Session
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your current session
                </p>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sign out</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  End your current session and return to the login page
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1.5" />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="h-5 w-5 text-destructive" />
              <div>
                <h2 className="font-display text-base font-semibold text-destructive">
                  Danger Zone
                </h2>
                <p className="text-sm text-muted-foreground">
                  Irreversible actions
                </p>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeleteConfirm("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              Delete your account?
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your projects,
              API keys, and logs will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Type{" "}
              <span className="font-mono font-medium text-foreground">
                delete my account
              </span>{" "}
              to confirm.
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="delete my account"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirm("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={
                deleteConfirm !== "delete my account" ||
                deleteMutation.isPending
              }
              onClick={handleDeleteAccount}
            >
              {deleteMutation.isPending ? "Deleting\u2026" : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
