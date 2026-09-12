import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, ShieldCheck } from "lucide-react";

export default function Login() {
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
            <div className="w-full max-w-md space-y-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-8 shadow-2xl text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/10 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <Camera className="h-7 w-7 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Chitrachaya Manager</h2>
                    <p className="text-sm text-neutral-400 max-w-xs">
                        Official Photography Club Management Platform
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 text-left text-xs text-neutral-400 space-y-2">
                    <div className="flex items-center gap-2 text-white font-medium text-sm">
                        <ShieldCheck className="h-4 w-4 text-red-500" />
                        Domain Restricted Access
                    </div>
                    <p>
                        Sign-in is strictly restricted to official <span className="text-red-400 font-mono">@iiitkottayam.ac.in</span> college Google accounts.
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white py-6 text-base font-semibold shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
                >
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    {loading ? "Redirecting to Google..." : "Continue with Google"}
                </Button>
            </div>
        </div>
    );
}
