import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera } from "lucide-react";

export default function Signup() {
    const [name, setName] = useState("");
    const [rollNumber, setRollNumber] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const role = "Event Requester";
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.toLowerCase().endsWith("@iiitkottayam.ac.in")) {
            toast.error("Signups are strictly restricted to official @iiitkottayam.ac.in emails.");
            return;
        }

        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    roll_number: rollNumber,
                    role: role,
                },
            },
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
            return;
        }

        toast.success("Account created successfully. You can now log in!");
        navigate("/login");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
            <div className="w-full max-w-md space-y-8 rounded-xl border border-neutral-800 bg-neutral-950 p-8 shadow-2xl">
                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-2">
                        <Camera className="h-6 w-6 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Create Account</h2>
                    <p className="text-sm text-neutral-400">
                        Join Chitrachaya Manager
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-neutral-300">Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="border-neutral-800 bg-neutral-900 text-white placeholder:text-neutral-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rollNumber" className="text-neutral-300">Roll Number</Label>
                            <Input
                                id="rollNumber"
                                placeholder="12345678"
                                value={rollNumber}
                                onChange={(e) => setRollNumber(e.target.value)}
                                required
                                className="border-neutral-800 bg-neutral-900 text-white placeholder:text-neutral-500"
                            />
                        </div>
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
                            <Label className="text-neutral-300">Role</Label>
                            <div className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-400 cursor-not-allowed">
                                Event Requester
                            </div>
                            <p className="text-xs text-neutral-500">
                                Contact an existing Admin to request administrator privileges.
                            </p>
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
                        {loading ? "Creating account..." : "Sign Up"}
                    </Button>

                    <div className="text-center text-sm text-neutral-400">
                        Already have an account?{" "}
                        <Link to="/login" className="font-semibold text-red-500 hover:text-red-400">
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
