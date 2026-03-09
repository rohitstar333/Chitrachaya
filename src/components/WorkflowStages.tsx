import { EventStage, STAGE_ORDER, STAGE_LABELS } from "@/types/event";
import { Check, Circle } from "lucide-react";

interface WorkflowStagesProps {
  currentStage: EventStage;
}

const WorkflowStages = ({ currentStage }: WorkflowStagesProps) => {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="flex items-center gap-1 w-full overflow-x-auto py-2">
      {STAGE_ORDER.map((stage, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={stage} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-semibold transition-all ${
                  isComplete
                    ? "bg-stage-complete text-stage-complete-foreground"
                    : isCurrent
                    ? "bg-primary text-primary-foreground glow-red"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isComplete ? <Check className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
              </div>
              <span
                className={`text-[10px] font-mono whitespace-nowrap ${
                  isCurrent ? "text-primary font-semibold" : isComplete ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {STAGE_LABELS[stage]}
              </span>
            </div>
            {index < STAGE_ORDER.length - 1 && (
              <div
                className={`w-6 h-px mx-1 mt-[-18px] ${
                  index < currentIndex ? "bg-stage-complete" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WorkflowStages;
