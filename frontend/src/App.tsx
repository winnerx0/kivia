import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import GuestGuard from "@/components/GuestGuard";
import AppSidebar from "@/components/AppSidebar";
import HomePage from "@/app/page";
import LoginPage from "@/app/login/page";
import RegisterPage from "@/app/register/page";
import VerifyOTPPage from "@/app/verify-otp/page";
import GoogleCallbackPage from "@/app/auth/google/callback/page";
import DashboardPage from "@/app/(app)/dashboard/page";
import ProjectsPage from "@/app/(app)/projects/page";
import ProjectDetailPage from "@/app/(app)/projects/[id]/page";
import SettingsPage from "@/app/(app)/settings/page";
import NotFound from "@/app/not-found";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </AuthGuard>
  );
}

function GuestPage({ children }: { children: React.ReactNode }) {
  return <GuestGuard>{children}</GuestGuard>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<GuestPage><LoginPage /></GuestPage>} />
        <Route path="/register" element={<GuestPage><RegisterPage /></GuestPage>} />
        <Route path="/verify-otp" element={<GuestPage><VerifyOTPPage /></GuestPage>} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
        <Route path="/projects" element={<ProtectedLayout><ProjectsPage /></ProtectedLayout>} />
        <Route path="/projects/:id" element={<ProtectedLayout><ProjectDetailPage /></ProtectedLayout>} />
        <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
