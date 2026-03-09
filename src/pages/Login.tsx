import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
            return;
        }

        toast.success("Logged in successfully");
        const role = data.session.user.user_metadata?.role;
        if (role === "Admin") {
            navigate("/admin");
        } else {
            navigate("/requester");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
            <div className="w-full max-w-md space-y-8 rounded-xl border border-neutral-800 bg-neutral-950 p-8 shadow-2xl">
                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-2">
                        <Camera className="h-6 w-6 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
                    <p className="text-sm text-neutral-400">
                        Sign in to Chitrachaya Manager
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-neutral-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="border-neutral-800 bg-neutral-900 text-white placeholder:text-neutral-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-neutral-300">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="border-neutral-800 bg-neutral-900 text-white placeholder:text-neutral-500"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </Button>

                    <div className="text-center text-sm text-neutral-400">
                        Don't have an account?{" "}
                        <Link to="/signup" className="font-semibold text-red-500 hover:text-red-400">
                            Sign up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
