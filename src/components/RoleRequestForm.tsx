import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface RoleRequestFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    userName: string;
}

export function RoleRequestForm({ open, onOpenChange, userId, userName }: RoleRequestFormProps) {
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState<"Core" | "SubLead" | "Lead">("Core");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Check if there's already a pending request
        const { data: existing } = await supabase
            .from("role_requests")
            .select("*")
            .eq("user_id", userId)
            .eq("status", "Pending")
            .single();

        if (existing) {
            toast.error("You already have a pending role request.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.from("role_requests").insert([
            {
                user_id: userId,
                user_name: userName,
                requested_role: role,
            },
        ]);

        if (error) {
            toast.error(error.message || "Failed to submit request.");
            console.error("Role Request Error:", error);
        } else {
            toast.success(`Requested ${role} access! An admin will review it soon.`);
            onOpenChange(false);
        }

        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-neutral-950 text-white border-neutral-800">
                <DialogHeader>
                    <DialogTitle>Request Club Privileges</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Select the role you are applying for. Your request will be reviewed by the Leads.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label className="text-neutral-300">Requested Role</Label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            required
                            className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="Core">Core (1st Year)</option>
                            <option value="SubLead">SubLead (2nd Year)</option>
                            <option value="Lead">Lead (3rd Year)</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-neutral-800 text-neutral-300 hover:bg-neutral-900 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            {loading ? "Submitting..." : "Submit Request"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
