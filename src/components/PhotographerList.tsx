import { mockPhotographers } from "@/data/mockData";
import { Camera, CheckCircle2, XCircle } from "lucide-react";

const PhotographerList = () => {
  return (
    <div className="space-y-2">
      {mockPhotographers.map((photographer) => (
        <div
          key={photographer.id}
          className="flex items-center justify-between bg-card border border-border rounded-lg p-4 hover:border-primary/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center">
              <Camera className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{photographer.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{photographer.specialization}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {photographer.available ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-stage-complete" />
                <span className="text-xs font-mono text-stage-complete">Available</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground">Busy</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PhotographerList;
