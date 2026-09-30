"use client";

import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { setTokens } from "@/lib/auth";
import { Loader2 } from "lucide-react";

function GoogleCallbackContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const error = searchParams.get("error");

    if (error) {
      const messages: Record<string, string> = {
        email_exists: "An account with this email already exists. Please sign in with your email and password.",
        missing_code: "Google sign-in was cancelled",
        auth_failed: "Google sign-in failed",
      };
      toast.error(messages[error] ?? "Google sign-in failed");
      navigate("/login");
      return;
    }

    if (!accessToken || !refreshToken) {
      toast.error("Google sign-in failed");
      navigate("/login");
      return;
    }

    setTokens(accessToken, refreshToken);
    toast.success("Signed in with Google");
    navigate("/dashboard");
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Signing in with Google...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return <GoogleCallbackContent />;
}
