import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type UserRole = "Lead" | "SubLead" | "Core" | "Event Requester" | "IT";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    role: UserRole | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import OneSignal from "react-onesignal";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleOneSignalIdentity = async (currentUser: User | null) => {
        try {
            if (currentUser) {
                await OneSignal.login(currentUser.id);
            } else {
                await OneSignal.logout();
            }
        } catch (error) {
            console.error("OneSignal Identity Error:", error);
        }
    };

    useEffect(() => {
        const processUser = async (session: Session | null) => {
            if (session?.user) {
                const email = session.user.email || "";
                if (!email.toLowerCase().endsWith("@iiitkottayam.ac.in")) {
                    toast.error("Access restricted: Please log in using your official @iiitkottayam.ac.in college email.");
                    await supabase.auth.signOut();
                    setUser(null);
                    setSession(null);
                    setRole(null);
                    setIsLoading(false);
                    return;
                }

                const userRole = (session.user.user_metadata?.role as any) || "Event Requester";
                setUser(session.user);
                setRole(userRole);
            } else {
                setUser(null);
                setRole(null);
            }
            setSession(session);
            setIsLoading(false);
            handleOneSignalIdentity(session?.user ?? null);
        };

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            processUser(session);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                processUser(session);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        handleOneSignalIdentity(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, role, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
