import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check, X, ShieldAlert } from "lucide-react";

type RoleRequest = {
    id: string;
    user_id: string;
    user_name: string;
    requested_role: string;
    status: string;
    created_at: string;
    auth_users?: {
        raw_user_meta_data: any;
    };
};

export function RoleRequestsPanel() {
    const { role } = useAuth();
    const [requests, setRequests] = useState<RoleRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        // In a real scenario you'd join with auth.users to get the name, 
        // but Supabase JS client doesn't directly join auth schema easily without a Postgres view.
        // For simplicity, we'll fetch requests and then fetch names if needed via an edge function, 
        // OR we can just show the IDs for now until we build a profile table. 
        // *Correction*: We can get it if we use a database function. Let's just fetch the raw requests first.

        const { data, error } = await supabase
            .from("role_requests")
            .select("*")
            .eq("status", "Pending")
            .order("created_at", { ascending: true });

        if (!error && data) {
            setRequests(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (role === "Lead" || role === "SubLead") {
            fetchRequests();
        }
    }, [role]);

    const handleApprove = async (requestId: string) => {
        try {
            const { error } = await supabase.rpc('approve_role_request', { request_id: requestId });

            if (error) throw error;

            toast.success("Role request approved successfully!");
            fetchRequests();
        } catch (error: any) {
            toast.error(error.message || "Failed to approve request.");
            console.error(error);
        }
    };

    const handleReject = async (requestId: string) => {
        const { error, data } = await supabase
            .from("role_requests")
            .update({ status: "Rejected" })
            .eq("id", requestId)
            .select();

        if (error) {
            toast.error("Failed to reject request.");
        } else if (!data || data.length === 0) {
            toast.error("You don't have permission to reject this request (RLS blocked).");
        } else {
            toast.success("Request rejected.");
            fetchRequests();
        }
    };

    if (role !== "Lead" && role !== "SubLead") return null;

    if (loading) {
        return <div className="animate-pulse h-32 bg-neutral-900 rounded-xl border border-neutral-800"></div>;
    }

    if (requests.length === 0) return null;

    return (
        <div className="mb-8 rounded-xl border border-red-900/50 bg-red-950/20 p-6">
            <div className="flex items-center gap-3 mb-4">
                <ShieldAlert className="h-6 w-6 text-red-500" />
                <h2 className="text-xl font-semibold text-white">Pending Role Requests</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {requests.map((req) => (
                    <div key={req.id} className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm text-neutral-400">User Name:</p>
                                <p className="font-semibold text-white line-clamp-1">{req.user_name || "Unknown User"}</p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full border bg-purple-500/20 text-purple-400 border-purple-500/30 whitespace-nowrap">
                                Wants {req.requested_role}
                            </span>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full border-neutral-800 hover:bg-neutral-900 text-neutral-300"
                                onClick={() => handleReject(req.id)}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                            </Button>
                            <Button
                                size="sm"
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleApprove(req.id)}
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
