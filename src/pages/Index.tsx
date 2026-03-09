import StatsBar from "@/components/StatsBar";
import EventCard from "@/components/EventCard";
import { mockEvents } from "@/data/mockData";
import heroBg from "@/assets/hero-bg.jpg";
import { Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const recentEvents = mockEvents.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden border border-border">
        <img src={heroBg} alt="" className="w-full h-48 md:h-56 object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 flex items-center px-6 md:px-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Chitrachaya
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md">
              Manage event coverage requests, photographer assignments, and media delivery — all in one place.
            </p>
            <Link to="/request">
              <Button className="mt-4 gap-2">
                <Camera className="w-4 h-4" />
                Submit a Request
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <section>
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-4">Overview</h2>
        <StatsBar />
      </section>

      {/* Recent Events */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Recent Events</h2>
          <Link to="/events" className="text-xs text-primary hover:underline font-mono">View All →</Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {recentEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
