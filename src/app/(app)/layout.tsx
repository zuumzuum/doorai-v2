"use client"

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";

function AppContent({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const { loading: tenantLoading } = useTenant();

  if (authLoading || tenantLoading) {
    return <LoadingScreen message="アカウント情報を読み込み中..." />;
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <TenantProvider>
        <AppContent>
          {children}
        </AppContent>
      </TenantProvider>
    </AuthProvider>
  );
}