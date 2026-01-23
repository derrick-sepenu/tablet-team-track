import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import TabletsPage from "./pages/TabletsPage";
import Workers from "./pages/Workers";
import Projects from "./pages/Projects";
import RepairRequests from "./pages/RepairRequests";
import DataManagers from "./pages/DataManagers";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import InventoryPage from "./pages/InventoryPage";
import ChangePasswordDialog from "./components/ChangePasswordDialog";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Protected route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profile } = useAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    if (profile?.must_change_password) {
      setShowPasswordDialog(true);
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      {children}
      <ChangePasswordDialog 
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
      />
    </>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/tablets" element={<ProtectedRoute><TabletsPage /></ProtectedRoute>} />
      <Route path="/workers" element={<ProtectedRoute><Workers /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/data-managers" element={<ProtectedRoute><DataManagers /></ProtectedRoute>} />
      <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/repair-requests" element={<ProtectedRoute><RepairRequests /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
