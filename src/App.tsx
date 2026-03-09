import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "sonner";
import AdminDashboard from "./pages/AdminDashboard";
import RequesterDashboard from "./pages/RequesterDashboard";
import ClubDashboard from "./pages/ClubDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function RedirectHome() {
  const { user, role, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role === "Lead") return <Navigate to="/admin" replace />;
  if (role === "SubLead" || role === "Core") return <Navigate to="/club" replace />;
  return <Navigate to="/requester" replace />;
}

function AppContent() {
  return (
    <>
      <Routes>
        <Route path="/" element={<RedirectHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={["Lead"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/club" element={<ProtectedRoute allowedRoles={["SubLead", "Core"]}><ClubDashboard /></ProtectedRoute>} />
        <Route path="/requester" element={<ProtectedRoute allowedRoles={["Event Requester"]}><RequesterDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" richColors theme="dark" />
    </>
  );
}

import { useEffect } from "react";
import OneSignal from "react-onesignal";

export default function App() {
  useEffect(() => {
    // Initialize OneSignal for Web Push Notifications
    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: "e4a8d7d7-dba0-4ea9-9bc2-d4f7995e5fda",
          safari_web_id: "web.onesignal.auto.668b47bc-14aa-4b15-bbce-a605ba29fca6",
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: "/" },
          serviceWorkerPath: "sw.js"
        });
        // Prompt the user for notification permissions automatically
        OneSignal.Slidedown.promptPush();
      } catch (error) {
        console.error("OneSignal Initialization Error:", error);
      }
    };

    initOneSignal();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
