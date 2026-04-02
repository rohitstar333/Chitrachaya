import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Camera } from "lucide-react";
import { EditEventPanel } from "@/components/EditEventPanel";
import { RoleRequestsPanel } from "@/components/RoleRequestsPanel";
import { Header } from "@/components/Header";
import { EventCard, Event as EventType } from "@/components/EventCard";
import { PastEventsLog } from "@/components/PastEventsLog";
import { toast } from "sonner";

export default function AdminDashboard() {
    const { user, signOut } = useAuth();
    const [events, setEvents] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);

    const userName = user?.user_metadata?.full_name || "Admin User";
    const userRole = user?.user_metadata?.role || "Admin";

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .order("date", { ascending: false });

        if (!error && data) {
            setEvents(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

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

    const stats = {
        total: events.length,
        requested: events.filter(e => e.status === "Requested").length,
        assigned: events.filter(e => e.status === "Assigned").length,
        inProgress: events.filter(e => e.status === "In Progress").length,
        uploaded: events.filter(e => e.status === "Uploaded").length,
        delivered: events.filter(e => e.status === "Delivered").length,
    };

    const activeEvents = events.filter(e => e.status !== "Delivered");
    const pastEvents = events.filter(e => e.status === "Delivered");

    const navLinks = [
        { label: "Overview", onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
        { label: "Role Requests", onClick: () => document.getElementById("requests")?.scrollIntoView({ behavior: "smooth", block: "start" }) },
        { label: "Events", onClick: () => document.getElementById("events")?.scrollIntoView({ behavior: "smooth", block: "start" }) },
        { label: "Past Events", onClick: () => document.getElementById("past-events")?.scrollIntoView({ behavior: "smooth", block: "start" }) },
    ];

    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col items-center">
            <Header userName={userName} role={userRole} onSignOut={signOut} navLinks={navLinks} />

            <div className="w-full max-w-7xl px-6 md:px-8 py-10 space-y-12">

                {/* Hero / Header Section */}
                <div className="relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 p-8 md:p-12">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-white">Welcome, {userName}</h1>
                        <p className="text-xl text-white/90 font-medium mb-4">Chitrachaya Admin</p>
                        <p className="text-lg text-neutral-400 mb-8">
                            Manage event coverage requests, photographer assignments, and media delivery — all in one place.
                        </p>
                    </div>
                </div>

                {/* Role Requests Section for Leads/SubLeads */}
                <div id="requests" className="scroll-mt-24">
                    <RoleRequestsPanel />
                </div>

                {/* Overview Stats Row */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold tracking-widest text-neutral-500 uppercase">Overview</h2>
                    <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
                        <div className="shrink-0 w-48 rounded-xl border border-red-900/50 bg-[#0a0a0a] p-5 flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-red-900/10 transition-opacity opacity-0 group-hover:opacity-100"></div>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex items-center justify-center rounded bg-red-950/40 border border-red-900/40">
                                    <Camera className="h-5 w-5 text-red-500" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white leading-none mb-1">{stats.total}</div>
                                    <div className="text-xs text-neutral-500 font-medium">Total Events</div>
                                </div>
                            </div>
                        </div>

                        <StatCard title="Requested" icon="send" value={stats.requested} />
                        <StatCard title="Assigned" icon="user" value={stats.assigned} />
                        <StatCard title="In Progress" icon="clock" value={stats.inProgress} />
                        <StatCard title="Uploaded" icon="upload" value={stats.uploaded} />
                        <StatCard title="Delivered" icon="check" value={stats.delivered} />
                    </div>
                </div>

                {/* Events Grid */}
                <div id="events" className="space-y-4 scroll-mt-24">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-widest text-neutral-500 uppercase">Recent Events</h2>
                        <span className="text-xs font-medium text-red-500 hover:text-red-400 cursor-pointer transition-colors">View All →</span>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
                        </div>
                    ) : activeEvents.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-neutral-800 bg-[#0a0a0a] p-12 text-center text-neutral-500">
                            No active events found.
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {activeEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    userRole={userRole}
                                    onEditClick={() => setSelectedEvent(event)}
                                    onDeleteClick={handleDeleteEvent}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Past Events Log */}
                <div id="past-events" className="space-y-4 scroll-mt-24">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-widest text-neutral-500 uppercase">Past Events Log</h2>
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

            <EditEventPanel
                open={!!selectedEvent}
                onOpenChange={(open) => !open && setSelectedEvent(null)}
                event={selectedEvent}
                onSuccess={fetchEvents}
            />
        </div>
    );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: string }) {
    // Simple icon rendering based on string for the sleek stat cards
    const renderIcon = () => {
        switch (icon) {
            case 'send': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
            case 'check-circle': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
            case 'user': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
            case 'clock': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
            case 'upload': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>;
            case 'check': return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><polyline points="20 6 9 17 4 12" /></svg>;
            default: return null;
        }
    };

    return (
        <div className="shrink-0 w-36 rounded-xl border border-neutral-800 bg-[#0a0a0a] p-4 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">
                {renderIcon()}
                {title}
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    );
}
