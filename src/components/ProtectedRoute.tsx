import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import { UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, role, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
        // Fallback redirects based on role
        if (role === "Lead") return <Navigate to="/admin" replace />;
        if (role === "SubLead" || role === "Core") return <Navigate to="/club" replace />;
        return <Navigate to="/requester" replace />;
    }

    return <>{children}</>;

    return <>{children}</>;
}
