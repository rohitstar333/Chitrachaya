import { Camera, Calendar, MapPin, Users, Link as LinkIcon, AlertCircle, Check, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export type Event = {
  id: string;
  event_name: string;
  club_name: string;
  date: string;
  event_time: string | null;
  venue: string;
  coverage_type: string;
  photographer: string | null;
  uploader: string | null;
  status: string;
  drive_link?: string;
};

interface EventCardProps {
  event: Event;
  userRole: string; // "Admin" | "Lead" | "SubLead" | "Core" | "Event Requester"
  userName?: string;
  onEditClick?: (event: Event) => void;
  onClaimClick?: (eventId: string, roleType: "photographer" | "uploader") => void;
  onRequestMemberClick?: (event: Event) => void;
  onUpdateProgressClick?: (event: Event) => void;
}

const statusOrder = [
  "Requested",
  "Assigned",
  "In Progress",
  "Uploaded",
  "Delivered"
];

const statusColors: Record<string, string> = {
  "Requested": "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
  "Assigned": "bg-blue-600/10 text-blue-500 border-blue-600/20",
  "In Progress": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Uploaded": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Delivered": "bg-green-500/10 text-green-400 border-green-500/20",
};

export function EventCard({ event, userRole, userName, onEditClick, onClaimClick, onRequestMemberClick, onUpdateProgressClick }: EventCardProps) {
  const currentStatusIndex = statusOrder.indexOf(event.status);

  const isUrgent = () => {
    if (!event.date || !event.event_time) return false;
    if (event.photographer || event.uploader) return false; // Not urgent if someone claimed it

    const eventDateTime = new Date(`${event.date}T${event.event_time}`);
    const now = new Date();
    const diffHours = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return diffHours > 0 && diffHours <= 1; // within 1 hour and not started yet
  };

  const urgent = isUrgent();
  const isClubMember = ["Lead", "SubLead", "Core"].includes(userRole);
  const isAdmin = ["Lead", "Admin"].includes(userRole);

  return (
    <div className={`rounded-xl border p-6 flex flex-col bg-[#0a0a0a] transition-all hover:bg-[#0f0f0f] ${urgent && isClubMember ? "border-red-900/50" : "border-neutral-800"
      }`}>
      {/* Header part */}
      <div className="flex justify-between items-start mb-6">
        <div>
          {urgent && isClubMember && (
            <div className="flex items-center gap-1 text-xs font-bold text-red-500 mb-2">
              <AlertCircle className="h-3 w-3" /> URGENT (Starts {'<'} 1hr)
            </div>
          )}
          <h3 className="font-semibold text-xl text-white tracking-tight line-clamp-1">{event.event_name}</h3>
          <p className="text-sm text-neutral-400 mt-1">{event.club_name}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs px-3 py-1 rounded-md border font-medium ${statusColors[event.status] || statusColors["Requested"]}`}>
            {event.status}
          </span>
          {isAdmin && onEditClick && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-neutral-500 hover:text-white"
              onClick={() => onEditClick(event)}
            >
              Edit Status
            </Button>
          )}
        </div>
      </div>

      {/* Meta tags */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm text-neutral-300 mb-6 font-mono">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-red-600" />
          <span>{format(new Date(event.date), "dd MMM yyyy")}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-red-600" />
          <span className="line-clamp-1">{event.venue}</span>
        </div>
        {(event.event_time) && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-600" />
            <span>{event.event_time}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-red-600" />
          <span>{event.coverage_type}</span>
        </div>
      </div>

      {/* Assignees (If anyone has claimed) or Claim Buttons for Club Members */}
      {(event.photographer || event.uploader || isClubMember) && (
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          {/* Display existing assignees */}
          {event.photographer && (
            <span className="px-3 py-1.5 bg-[#141414] border border-neutral-800 rounded-md text-xs font-medium text-neutral-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {event.photographer} (Photo)
            </span>
          )}
          {event.uploader && (
            <span className="px-3 py-1.5 bg-[#141414] border border-neutral-800 rounded-md text-xs font-medium text-neutral-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {event.uploader} (Upload)
            </span>
          )}

          {/* Show Tick to Claim buttons if club member and spots are open */}
          {isClubMember && !event.photographer && onClaimClick && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-dashed border-neutral-700 bg-transparent text-neutral-400 hover:text-white hover:border-red-500 hover:bg-red-500/10 transition-all font-normal"
              onClick={() => onClaimClick(event.id, "photographer")}
            >
              Tick to Claim (Photographer)
            </Button>
          )}
          {isClubMember && !event.uploader && onClaimClick && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-dashed border-neutral-700 bg-transparent text-neutral-400 hover:text-white hover:border-blue-500 hover:bg-blue-500/10 transition-all font-normal"
              onClick={() => onClaimClick(event.id, "uploader")}
            >
              Tick to Claim (Uploader)
            </Button>
          )}

          {/* Update Progress Button for Assigned User */}
          {(event.photographer === userName || event.uploader === userName) && onUpdateProgressClick && event.status !== "Delivered" && (
            <Button
              size="sm"
              variant="default"
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white ml-auto"
              onClick={() => onUpdateProgressClick(event)}
            >
              Update Progress
            </Button>
          )}

          {/* Request Members Action for Leads/SubLeads */}
          {["Lead", "SubLead", "Admin", "2nd year", "3rd year"].includes(userRole) && (!event.photographer || !event.uploader) && onRequestMemberClick && (
            <Button
              size="sm"
              variant="outline"
              className={`h-8 text-xs border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all font-normal ${(event.photographer === userName || event.uploader === userName) ? '' : 'ml-auto'}`}
              onClick={() => onRequestMemberClick(event)}
            >
              <Users className="mr-2 h-3 w-3" />
              Request Coverage
            </Button>
          )}
        </div>
      )}

      {/* Drive Link */}
      {event.drive_link && event.status === "Delivered" && (
        <div className="mb-6">
          <a
            href={event.drive_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-col text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
          >
            <span className="flex items-center gap-2 mb-1"><LinkIcon className="h-4 w-4" /> View Drive Folder</span>
          </a>
        </div>
      )}

      <div className="mt-auto border-t border-neutral-900 pt-6">
        {/* Linear Progress Bar */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-3 left-2 right-2 h-[2px] bg-neutral-900 -z-10 bg-gradient-to-r from-neutral-800 to-neutral-900"></div>

          <div className="flex justify-between items-center text-center px-1">
            {statusOrder.map((statusStep, i) => {
              const isCompleted = i < currentStatusIndex || (i === 4 && currentStatusIndex === 4); // 4 is Delivered
              const isActive = i === currentStatusIndex;

              return (
                <div key={statusStep} className="flex flex-col items-center gap-2 group relative z-10">
                  {/* Circle */}
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted && !isActive
                    ? "bg-green-500 border-green-500" // Completed
                    : isActive && i === 4
                      ? "bg-green-500 border-green-500" // Delivered active
                      : isActive
                        ? "bg-red-600 border-red-600 shadow-[0_0_12px_rgba(220,38,38,0.5)]" // Active step
                        : "bg-black border-neutral-800" // Future step
                    }`}>
                    {isCompleted && !isActive ? (
                      <Check className="h-3 w-3 text-black font-extrabold stroke-[3px]" />
                    ) : isActive && i === 4 ? (
                      <Check className="h-3 w-3 text-black font-extrabold stroke-[3px]" />
                    ) : isActive ? (
                      <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                    ) : null}
                  </div>

                  {/* Label */}
                  <span className={`text-[9px] sm:text-[10px] font-medium block w-max absolute top-8 whitespace-nowrap ${isActive ? "text-red-500" : isCompleted ? "text-neutral-400" : "text-neutral-600"
                    }`}>
                    {statusStep}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
