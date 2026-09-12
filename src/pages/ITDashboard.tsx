import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Camera, CheckCircle2, Clock, RotateCcw, XCircle, Phone, UserCheck, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export interface CameraRequestItem {
    id: string;
    event_id: string;
    event_name: string;
    requester_id: string;
    requester_name: string;
    requester_email: string;
    requester_roll: string;
    assignee_phone: string;
    lead_phone: string;
    equipment_details: string;
    status: "Pending" | "Approved" | "Returned" | "Rejected";
    approved_by?: string;
    created_at: string;
}

export default function ITDashboard() {
    const { user, role, signOut } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState<CameraRequestItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"pending" | "active" | "history">("pending");

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("camera_requests")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (err: any) {
            console.error("Fetch Camera Requests Error:", err);
            toast.error("Failed to load camera requests.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: "Approved" | "Returned" | "Rejected") => {
        try {
            const { error } = await supabase
                .from("camera_requests")
                .update({
                    status: newStatus,
                    approved_by: user?.email || "IT Server Room Staff",
                    updated_at: new Date().toISOString()
                })
                .eq("id", id);

            if (error) throw error;

            toast.success(`Camera status updated to ${newStatus}`);
            fetchRequests();
        } catch (err: any) {
            console.error("Status Update Error:", err);
            toast.error("Failed to update status.");
        }
    };

    const pendingList = requests.filter(r => r.status === "Pending");
    const activeList = requests.filter(r => r.status === "Approved");
    const historyList = requests.filter(r => r.status === "Returned" || r.status === "Rejected");

    const isLeadOrAdmin = ["Lead", "Admin", "3rd year"].includes(role || "");

    const navLinks = isLeadOrAdmin ? [
        {
            label: "Main Dashboard",
            icon: <ArrowLeft className="h-4 w-4" />,
            onClick: () => navigate("/admin")
        }
    ] : [];

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans">
            <Header
                userName={user?.user_metadata?.full_name || user?.email?.split("@")[0] || "IT Staff"}
                role={role || "IT Server Room"}
                onSignOut={signOut}
                navLinks={navLinks}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
                {/* HERO HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded bg-red-950/60 border border-red-900/60 text-xs font-bold text-red-400 tracking-wider uppercase">
                                IT Server Room
                            </span>
                            <span className="text-xs text-neutral-500 font-mono">Camera & Equipment Control</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
                            IT Camera Handoff Dashboard
                        </h1>
                        <p className="text-sm text-neutral-400 mt-1">
                            Verify Digital IDs, process camera issuing requests, and track active equipment holders.
                        </p>
                    </div>

                    <Button
                        onClick={fetchRequests}
                        variant="outline"
                        size="sm"
                        className="border-neutral-800 bg-[#0f0f0f] text-neutral-300 hover:text-white hover:bg-neutral-900 self-start md:self-auto"
                    >
                        <RotateCcw className="mr-2 h-4 w-4 text-red-500" />
                        Refresh Requests
                    </Button>
                </div>

                {/* SUMMARY STAT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    <div className="rounded-xl border border-yellow-900/40 bg-gradient-to-br from-[#18150a] to-[#0a0a0a] p-5">
                        <div className="flex justify-between items-center text-yellow-500 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Pending Approval</span>
                            <Clock className="h-5 w-5" />
                        </div>
                        <div className="text-3xl font-extrabold text-white">{pendingList.length}</div>
                        <p className="text-xs text-neutral-400 mt-1">Camera handoffs waiting for IT verification</p>
                    </div>

                    <div className="rounded-xl border border-red-900/40 bg-gradient-to-br from-[#1a0a0a] to-[#0a0a0a] p-5">
                        <div className="flex justify-between items-center text-red-500 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Active Cameras Issued</span>
                            <Camera className="h-5 w-5" />
                        </div>
                        <div className="text-3xl font-extrabold text-white">{activeList.length}</div>
                        <p className="text-xs text-neutral-400 mt-1">Cameras currently with club members</p>
                    </div>

                    <div className="rounded-xl border border-green-900/40 bg-gradient-to-br from-[#0a180f] to-[#0a0a0a] p-5">
                        <div className="flex justify-between items-center text-green-500 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Returned / Completed</span>
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="text-3xl font-extrabold text-white">{historyList.length}</div>
                        <p className="text-xs text-neutral-400 mt-1">Past handoffs processed & logged</p>
                    </div>
                </div>

                {/* TAB CONTROLS */}
                <div className="flex border-b border-neutral-800 mb-6 gap-2">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${activeTab === "pending"
                                ? "border-red-600 text-red-500"
                                : "border-transparent text-neutral-400 hover:text-white"
                            }`}
                    >
                        Pending Requests ({pendingList.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("active")}
                        className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${activeTab === "active"
                                ? "border-red-600 text-red-500"
                                : "border-transparent text-neutral-400 hover:text-white"
                            }`}
                    >
                        Active Handoffs ({activeList.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${activeTab === "history"
                                ? "border-red-600 text-red-500"
                                : "border-transparent text-neutral-400 hover:text-white"
                            }`}
                    >
                        History ({historyList.length})
                    </button>
                </div>

                {/* CONTENT AREA */}
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-neutral-500">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent mb-4"></div>
                        <span>Loading IT requests...</span>
                    </div>
                ) : (
                    <>
                        {/* PENDING TAB */}
                        {activeTab === "pending" && (
                            <div>
                                {pendingList.length === 0 ? (
                                    <div className="py-16 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                                        No pending camera requests at the moment.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {pendingList.map((req) => (
                                            <div key={req.id} className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-6 flex flex-col justify-between">
                                                <div>
                                                    {/* DIGITAL ID HEADER */}
                                                    <div className="flex justify-between items-start mb-4 pb-3 border-b border-neutral-900">
                                                        <div>
                                                            <span className="text-xs font-mono text-red-400 font-semibold uppercase">Digital ID Verified</span>
                                                            <h3 className="font-bold text-lg text-white mt-0.5">{req.requester_name}</h3>
                                                            <p className="text-xs text-neutral-400">{req.requester_email}</p>
                                                        </div>
                                                        <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300">
                                                            ID: {req.requester_roll}
                                                        </span>
                                                    </div>

                                                    {/* EVENT & GEAR INFO */}
                                                    <div className="space-y-2 text-sm text-neutral-300 mb-4">
                                                        <div>
                                                            <span className="text-neutral-500 text-xs block">Event Name:</span>
                                                            <span className="font-semibold text-white">{req.event_name}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-neutral-500 text-xs block">Equipment Details:</span>
                                                            <span className="font-mono text-red-300 bg-red-950/30 px-2 py-1 rounded border border-red-900/40 block mt-0.5">
                                                                {req.equipment_details}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* CONTACT NUMBERS */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#121212] p-3 rounded-lg border border-neutral-800 mb-6 font-mono text-xs">
                                                        <div>
                                                            <span className="text-neutral-500 block text-[10px] uppercase">Assignee Phone</span>
                                                            <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                                                                <Phone className="h-3 w-3 text-red-500" />
                                                                {req.assignee_phone}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-neutral-500 block text-[10px] uppercase">Fallback Lead Phone</span>
                                                            <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                                                                <Phone className="h-3 w-3 text-yellow-500" />
                                                                {req.lead_phone}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-2">
                                                    <Button
                                                        onClick={() => handleUpdateStatus(req.id, "Rejected")}
                                                        variant="outline"
                                                        className="flex-1 border-neutral-800 hover:border-red-900 text-neutral-400 hover:text-red-400 bg-transparent"
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleUpdateStatus(req.id, "Approved")}
                                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md shadow-red-950"
                                                    >
                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                        Approve Handoff
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ACTIVE HANDOFFS TAB */}
                        {activeTab === "active" && (
                            <div>
                                {activeList.length === 0 ? (
                                    <div className="py-16 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                                        No active cameras currently issued.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {activeList.map((req) => (
                                            <div key={req.id} className="rounded-xl border border-red-900/60 bg-gradient-to-br from-[#170a0a] to-[#0a0a0a] p-6 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-red-900/40">
                                                        <span className="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                                                            <Camera className="h-3.5 w-3.5" /> CAMERA ISSUED
                                                        </span>
                                                        <span className="text-xs font-mono text-neutral-400">
                                                            Approved by: {req.approved_by || 'IT Staff'}
                                                        </span>
                                                    </div>

                                                    <div className="mb-4">
                                                        <h3 className="text-xl font-bold text-white">{req.requester_name}</h3>
                                                        <p className="text-xs text-neutral-400">{req.requester_email} • ID: {req.requester_roll}</p>
                                                        <p className="text-sm font-medium text-red-400 mt-2">Event: {req.event_name}</p>
                                                    </div>

                                                    {/* ACTIVE CONTACT DETAILS */}
                                                    <div className="bg-[#1c0d0d] p-4 rounded-xl border border-red-900/50 space-y-2 mb-6">
                                                        <div className="text-xs text-red-300 font-semibold uppercase tracking-wide flex items-center gap-1">
                                                            <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                                                            Current Holder Contact Info
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                                                            <div>
                                                                <span className="text-neutral-400 block text-[10px]">Primary Contact:</span>
                                                                <a href={`tel:${req.assignee_phone}`} className="text-white font-bold text-sm underline hover:text-red-400">
                                                                    {req.assignee_phone}
                                                                </a>
                                                            </div>
                                                            <div>
                                                                <span className="text-neutral-400 block text-[10px]">Fallback Lead Contact:</span>
                                                                <a href={`tel:${req.lead_phone}`} className="text-yellow-400 font-bold text-sm underline hover:text-yellow-300">
                                                                    {req.lead_phone}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() => handleUpdateStatus(req.id, "Returned")}
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5"
                                                >
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Mark Camera Returned to IT
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* HISTORY TAB */}
                        {activeTab === "history" && (
                            <div>
                                {historyList.length === 0 ? (
                                    <div className="py-16 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                                        No history records available yet.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl overflow-hidden bg-[#0a0a0a]">
                                        {historyList.map((req) => (
                                            <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#0f0f0f]">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${req.status === "Returned"
                                                                ? "bg-green-950 text-green-400 border-green-900"
                                                                : "bg-red-950 text-red-400 border-red-900"
                                                            }`}>
                                                            {req.status}
                                                        </span>
                                                        <span className="text-sm font-semibold text-white">{req.event_name}</span>
                                                    </div>
                                                    <p className="text-xs text-neutral-400 mt-1">
                                                        Holder: <span className="text-neutral-200 font-medium">{req.requester_name}</span> ({req.requester_email})
                                                    </p>
                                                </div>
                                                <div className="text-right text-xs text-neutral-500 font-mono">
                                                    <div>Equipment: {req.equipment_details}</div>
                                                    <div>Processed by: {req.approved_by || 'IT Staff'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
