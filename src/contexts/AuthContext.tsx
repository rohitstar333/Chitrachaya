import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type UserRole = "Lead" | "SubLead" | "Core" | "Event Requester";

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
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setRole((session?.user?.user_metadata?.role as any) ?? null);
            setIsLoading(false);
            handleOneSignalIdentity(session?.user ?? null);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setRole((session?.user?.user_metadata?.role as any) ?? null);
                setIsLoading(false);
                handleOneSignalIdentity(session?.user ?? null);
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
