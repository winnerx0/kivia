import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import QueryProvider from "@/components/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import "@/globals.css";

document.title = "Kivia – API Observability";
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <App />
      <Toaster />
    </QueryProvider>
  </StrictMode>,
);
