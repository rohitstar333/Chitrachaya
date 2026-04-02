import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { RoleRequestsPanel } from "@/components/RoleRequestsPanel";
import { Header } from "@/components/Header";
import { EventCard, Event as EventType } from "@/components/EventCard";
import { RequestMemberModal } from "@/components/RequestMemberModal";
import { EventRequestForm } from "@/components/EventRequestForm";
import { Check, X, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { PastEventsLog } from "@/components/PastEventsLog";
import { UpdateProgressModal } from "@/components/UpdateProgressModal";

export default function ClubDashboard() {
    const { user, role, signOut } = useAuth();
    const [events, setEvents] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [taskRequests, setTaskRequests] = useState<any[]>([]);
    const [selectedEventForRequest, setSelectedEventForRequest] = useState<EventType | null>(null);
    const [selectedEventForUpdate, setSelectedEventForUpdate] = useState<EventType | null>(null);
    const [requestModalOpen, setRequestModalOpen] = useState(false);

    const userName = user?.user_metadata?.full_name || "Club Member";

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .order("date", { ascending: true });

        if (!error && data) {
            setEvents(data);
        }
        setLoading(false);
    };

    const fetchTaskRequests = async () => {
        if (!userName) return;
        const { data, error } = await supabase
            .from("task_requests")
            .select("*, event:events(*)")
            .eq("target_user_name", userName)
            .eq("status", "Pending");

        if (!error && data) {
            setTaskRequests(data);
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchTaskRequests();
        // Set up an interval to refresh urgency every minute
        const interval = setInterval(() => {
            fetchEvents();
            fetchTaskRequests();
        }, 60000);
        return () => clearInterval(interval);
    }, [userName]);

    const handleClaim = async (eventId: string, roleType: "photographer" | "uploader") => {
        const updateData = { [roleType]: userName };

        const { error, data } = await supabase
            .from("events")
            .update(updateData)
            .eq("id", eventId)
            .select();

        if (error) {
            toast.error("Failed to claim task.");
        } else if (!data || data.length === 0) {
            toast.error("You don't have permission to claim this task. Wait for your role request to be approved!");
        } else {
            toast.success(`Successfully claimed as ${roleType === "photographer" ? "Photographer" : "Uploader"}!`);

            // Also update status to Assigned if it was Requested/Approved
            const event = events.find(e => e.id === eventId);
            if (event && (event.status === "Requested" || event.status === "Approved")) {
                await supabase.from("events").update({ status: "Assigned" }).eq("id", eventId);
            }

            fetchEvents();
        }
    };

    const handleAcceptRequest = async (request: any) => {
        const updateData = { [request.role_type]: userName };

        const { error: eventError } = await supabase
            .from("events")
            .update(updateData)
            .eq("id", request.event_id);

        if (eventError) {
            toast.error("Failed to accept request.");
            return;
        }

        if (request.event?.status === "Requested" || request.event?.status === "Approved") {
            await supabase.from("events").update({ status: "Assigned" }).eq("id", request.event_id);
        }

        const { error: reqError } = await supabase
            .from("task_requests")
            .update({ status: "Accepted" })
            .eq("id", request.id);

        if (reqError) {
            toast.error("Failed to update request status.");
        } else {
            toast.success(`Accepted request to be ${request.role_type}!`);
            fetchEvents();
            fetchTaskRequests();
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        const { error } = await supabase
            .from("task_requests")
            .update({ status: "Rejected" })
            .eq("id", requestId);

        if (error) {
            toast.error("Failed to reject request.");
        } else {
            toast.success("Request rejected.");
            fetchTaskRequests();
        }
    };

    const handleDeleteEvent = async (event: EventType) => {
        if (!window.confirm(`Are you sure you want to delete "${event.event_name}"?`)) return;
        const { error } = await supabase.from("events").delete().eq("id", event.id);
        if (error) {
            toast.error("Failed to delete event: " + error.message);
        } else {
            toast.success("Event deleted successfully!");
            fetchEvents();
        }
    };

    const activeEvents = events.filter(e => e.status !== "Delivered");
    const pastEvents = events.filter(e => e.status === "Delivered").reverse(); // Most recent first for past events

    const myTasks = activeEvents.filter(e =>
        e.photographer === userName ||
        e.uploader === userName
    );

    const navLinks = [
        { label: "Event Pool", onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
        { label: "My Tasks", onClick: () => document.getElementById("tasks")?.scrollIntoView({ behavior: "smooth", block: "start" }) },
        { label: "Past Events", onClick: () => document.getElementById("past-events")?.scrollIntoView({ behavior: "smooth", block: "start" }) },
    ];

    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col items-center">
            <Header userName={userName} role={role || "Member"} onSignOut={signOut} navLinks={navLinks} />

            <div className="w-full max-w-7xl px-6 md:px-8 py-10 space-y-12">

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">Welcome, {userName}</h1>
                        <p className="text-neutral-400">Here's what's happening in the club today.</p>
                    </div>
                    <Button 
                        onClick={() => setRequestModalOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap shrink-0"
                    >
                        Request Event Coverage
                    </Button>
                </div>

                {role === "SubLead" && (
                    <RoleRequestsPanel />
                )}

                {taskRequests.length > 0 && (
                    <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <BellRing className="h-6 w-6 text-blue-500" />
                            <h2 className="text-xl font-semibold text-white">Coverage Requests</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {taskRequests.map((req) => (
                                <div key={req.id} className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                                    <div className="mb-3">
                                        <p className="text-sm text-neutral-400">Requested by: <span className="font-medium text-white">{req.requester_name}</span></p>
                                        <p className="text-sm font-semibold text-white mt-1 line-clamp-1">{req.event?.event_name}</p>
                                    </div>
                                    <span className="text-xs px-2.5 py-1 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20 inline-block mb-4">
                                        Role needed: {req.role_type}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full border-neutral-800 text-neutral-300 hover:text-white"
                                            onClick={() => handleRejectRequest(req.id)}
                                        >
                                            <X className="mr-2 h-4 w-4" /> Decline
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={() => handleAcceptRequest(req)}
                                        >
                                            <Check className="mr-2 h-4 w-4" /> Accept
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* EVENT POOL (Left 2 columns) */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                Event Pool
                                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
                                    Open Tickets
                                </span>
                            </h2>
                        </div>

                        {loading ? (
                            <div className="flex justify-center p-12">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
                            </div>
                        ) : activeEvents.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-neutral-800 bg-[#0a0a0a] p-12 text-center text-neutral-500">
                                No open events at the moment. You're all caught up!
                            </div>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2">
                                {activeEvents.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        userRole={role || "Core"}
                                        userName={userName}
                                        onClaimClick={handleClaim}
                                        onRequestMemberClick={(event) => setSelectedEventForRequest(event)}
                                        onUpdateProgressClick={(event) => setSelectedEventForUpdate(event)}
                                        onDeleteClick={handleDeleteEvent}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* MY TASKS SIDEBAR */}
                    <div id="tasks" className="space-y-6 scroll-mt-24">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold tracking-widest text-neutral-500 uppercase">
                                My Tasks
                            </h2>
                        </div>

                        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-2 flex flex-col gap-2 min-h-[300px]">
                            {myTasks.length === 0 ? (
                                <div className="p-8 text-center text-sm text-neutral-500 my-auto">
                                    You haven't claimed any tasks yet. Tick an open ticket in the pool to get started!
                                </div>
                            ) : (
                                myTasks.map(task => (
                                    <div key={task.id} className="p-4 rounded-lg bg-neutral-950 border border-neutral-800/60 hover:border-neutral-700 transition-colors">
                                        <h4 className="font-semibold text-white mb-2 line-clamp-1">{task.event_name}</h4>
                                        <p className="text-xs text-neutral-400 mb-4 font-mono">
                                            {format(new Date(task.date), "MMM d, yyyy")} {task.event_time && `at ${task.event_time}`}
                                        </p>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex flex-wrap gap-2 text-xs font-medium">
                                                {task.photographer === userName && (
                                                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded">Photographer</span>
                                                )}
                                                {task.uploader === userName && (
                                                    <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-1 rounded">Uploader</span>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="h-7 text-[10px] bg-red-600 hover:bg-red-700 text-white px-2"
                                                onClick={() => setSelectedEventForUpdate(task)}
                                            >
                                                Update Progress
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* PAST EVENTS LOG */}
                <div id="past-events" className="mt-12 space-y-6 scroll-mt-24">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            Past Events Log
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-800/30">
                                Delivered
                            </span>
                        </h2>
                    </div>
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
                        </div>
                    ) : (
                        <PastEventsLog events={pastEvents} />
                    )}
                </div>
            </div>

            <RequestMemberModal
                open={!!selectedEventForRequest}
                onOpenChange={(open) => !open && setSelectedEventForRequest(null)}
                event={selectedEventForRequest}
                requesterId={user?.id || ""}
                requesterName={userName}
            />

            <EventRequestForm
                open={requestModalOpen}
                onOpenChange={setRequestModalOpen}
                onSuccess={fetchEvents}
                userId={user?.id || ""}
                userName={userName}
            />

            <UpdateProgressModal
                open={!!selectedEventForUpdate}
                onOpenChange={(open) => !open && setSelectedEventForUpdate(null)}
                event={selectedEventForUpdate}
                onSuccess={fetchEvents}
            />
        </div>
    );
}
