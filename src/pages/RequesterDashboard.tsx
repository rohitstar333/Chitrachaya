import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Camera, ShieldPlus } from "lucide-react";
import { EventRequestForm } from "@/components/EventRequestForm";
import { RoleRequestForm } from "@/components/RoleRequestForm";
import { Header } from "@/components/Header";
import { EventCard, Event as EventType } from "@/components/EventCard";

export default function RequesterDashboard() {
    const { signOut, user } = useAuth();
    const userName = user?.user_metadata?.full_name || "Requester";
    const userRole = user?.user_metadata?.role || "Event Requester";

    const [events, setEvents] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEventFormOpen, setIsEventFormOpen] = useState(false);
    const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);

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

    const navLinks = [
        { label: "Dashboard", onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
        { label: "Events", onClick: () => document.getElementById("events")?.scrollIntoView({ behavior: "smooth", block: "start" }) },
        { label: "New Request", onClick: () => setIsEventFormOpen(true) },
        { label: "Team Access", onClick: () => setIsRoleFormOpen(true) },
    ];

    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col items-center">
            <Header userName={userName} role={userRole} onSignOut={signOut} navLinks={navLinks} />

            <div className="w-full max-w-7xl px-6 md:px-8 py-10 space-y-12">

                {/* Hero / Action Section */}
                <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-neutral-800 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 max-w-xl">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white">Welcome, {userName}</h1>
                        <p className="text-neutral-400">
                            Create new photography coverage requests for your club events and track their progress here.
                        </p>
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                            onClick={() => setIsRoleFormOpen(true)}
                        >
                            <ShieldPlus className="mr-2 h-4 w-4" />
                            Request Club Access
                        </Button>
                        <Button
                            className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-700 shadow-[0_0_16px_rgba(220,38,38,0.4)] transition-shadow hover:shadow-[0_0_24px_rgba(220,38,38,0.6)]"
                            onClick={() => setIsEventFormOpen(true)}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Request Event Coverage
                        </Button>
                    </div>
                </div>

                {/* Events Section */}
                <div id="events" className="space-y-6 scroll-mt-24">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-widest text-neutral-500 uppercase">
                            Your Requested Events
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-neutral-800 bg-[#0a0a0a] p-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800">
                                <Camera className="h-6 w-6 text-neutral-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">No events requested yet</h3>
                            <p className="text-neutral-500 max-w-sm mx-auto mb-8">
                                You haven't requested any photography coverage yet. Click below to create your first request.
                            </p>
                            <Button
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={() => setIsEventFormOpen(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Request Event
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {events.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    userRole={userRole}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <EventRequestForm
                open={isEventFormOpen}
                onOpenChange={setIsEventFormOpen}
                onSuccess={fetchEvents}
                userId={user?.id || ""}
            />

            <RoleRequestForm
                open={isRoleFormOpen}
                onOpenChange={setIsRoleFormOpen}
                userId={user?.id || ""}
                userName={userName}
            />
        </div>
    );
}
