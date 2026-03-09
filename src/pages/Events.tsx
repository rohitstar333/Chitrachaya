import { useState } from "react";
import EventCard from "@/components/EventCard";
import { mockEvents } from "@/data/mockData";
import { STAGE_ORDER, STAGE_LABELS, EventStage } from "@/types/event";

const Events = () => {
  const [filter, setFilter] = useState<EventStage | "all">("all");

  const filteredEvents = filter === "all" ? mockEvents : mockEvents.filter((e) => e.stage === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">All Events</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and manage all event coverage requests.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
            filter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
          }`}
        >
          All ({mockEvents.length})
        </button>
        {STAGE_ORDER.map((stage) => {
          const count = mockEvents.filter((e) => e.stage === stage).length;
          return (
            <button
              key={stage}
              onClick={() => setFilter(stage)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                filter === stage ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {STAGE_LABELS[stage]} ({count})
            </button>
          );
        })}
      </div>

      {/* Event Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-mono text-sm">No events found for this filter.</p>
        </div>
      )}
    </div>
  );
};

export default Events;
