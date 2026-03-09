import { mockEvents } from "@/data/mockData";
import { STAGE_ORDER, STAGE_LABELS, EventStage } from "@/types/event";
import { Camera, Calendar, CheckCircle2, Clock, Upload, Send } from "lucide-react";

const stageIcons: Record<EventStage, React.ReactNode> = {
  requested: <Send className="w-4 h-4" />,
  approved: <CheckCircle2 className="w-4 h-4" />,
  assigned: <Camera className="w-4 h-4" />,
  in_progress: <Clock className="w-4 h-4" />,
  uploaded: <Upload className="w-4 h-4" />,
  delivered: <CheckCircle2 className="w-4 h-4" />,
};

const StatsBar = () => {
  const stageCounts = STAGE_ORDER.map((stage) => ({
    stage,
    count: mockEvents.filter((e) => e.stage === stage).length,
  }));

  const totalEvents = mockEvents.length;
  const upcomingEvents = mockEvents.filter(
    (e) => new Date(e.eventDate) > new Date()
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      <div className="col-span-2 md:col-span-4 lg:col-span-2 bg-card border border-border rounded-lg p-4 glow-red">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-foreground">{totalEvents}</p>
            <p className="text-xs text-muted-foreground font-mono">Total Events</p>
          </div>
        </div>
      </div>

      {stageCounts.map(({ stage, count }) => (
        <div
          key={stage}
          className="bg-card border border-border rounded-lg p-3 hover:border-primary/20 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            {stageIcons[stage]}
            <span className="text-[10px] font-mono uppercase tracking-wider">{STAGE_LABELS[stage]}</span>
          </div>
          <p className="text-xl font-display font-bold text-foreground">{count}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
