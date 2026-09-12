import { format } from "date-fns";
import { Calendar, MapPin, Camera, Clock, AlertCircle, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Event {
  id: string;
  event_name: string;
  club_name: string;
  date: string;
  event_time?: string;
  end_time?: string;
  venue: string;
  coverage_type: string;
  photographer?: string;
  uploader?: string;
  status: "Requested" | "Assigned" | "In Progress" | "Uploaded" | "Delivered";
  drive_link?: string;
}

interface EventCardProps {
  event: Event;
  userRole: string;
  userName?: string;
  cameraRequestStatus?: { status: string; requester_name: string; assignee_phone: string } | null;
  onEditClick?: (event: Event) => void;
  onDeleteClick?: (event: Event) => void;
  onClaimClick?: (eventId: string, roleType: "photographer" | "uploader") => void;
  onRequestMemberClick?: (event: Event) => void;
  onUpdateProgressClick?: (event: Event) => void;
  onReplaceMemberClick?: (event: Event, roleType: "photographer" | "uploader") => void;
  onRequestCameraClick?: (event: Event) => void;
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

export function EventCard({ event, userRole, userName, cameraRequestStatus, onEditClick, onDeleteClick, onClaimClick, onRequestMemberClick, onUpdateProgressClick, onReplaceMemberClick, onRequestCameraClick }: EventCardProps) {
  const isUrgent = () => {
    if (!event.date || !event.event_time) return false;
    if (event.photographer || event.uploader) return false;

    const eventDateTime = new Date(`${event.date}T${event.event_time}`);
    const now = new Date();
    const diffHours = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return diffHours > 0 && diffHours <= 1;
  };

  const urgent = isUrgent();
  const isClubMember = userRole !== "Event Requester";
  const isLeadOrSubLead = ["Lead", "SubLead", "Admin", "3rd year", "2nd year"].includes(userRole);
  const isAdmin = ["Lead", "Admin", "3rd year"].includes(userRole);

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
          <div className="flex items-center gap-1">
            {isAdmin && onEditClick && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-neutral-500 hover:text-white px-2"
                onClick={() => onEditClick(event)}
              >
                Edit Status
              </Button>
            )}
            {onDeleteClick && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-red-500 hover:text-red-400 hover:bg-red-950/30 px-2"
                onClick={() => onDeleteClick(event)}
                title="Delete Event"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
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
            <span>{event.event_time}{event.end_time ? ` - ${event.end_time}` : ''}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-red-600" />
          <span>{event.coverage_type}</span>
        </div>
      </div>

      {/* Camera IT Handoff Status Banner */}
      {cameraRequestStatus && (
        <div className={`mb-4 px-3.5 py-2 rounded-lg border text-xs font-mono flex items-center justify-between ${cameraRequestStatus.status === "Approved"
            ? "bg-red-950/40 border-red-900/60 text-red-300"
            : cameraRequestStatus.status === "Pending"
              ? "bg-yellow-950/40 border-yellow-900/60 text-yellow-300"
              : "bg-neutral-900 border-neutral-800 text-neutral-400"
          }`}>
          <div className="flex items-center gap-2">
            <Camera className="h-3.5 w-3.5" />
            <span>
              {cameraRequestStatus.status === "Approved"
                ? `Camera Issued: ${cameraRequestStatus.requester_name} (${cameraRequestStatus.assignee_phone})`
                : cameraRequestStatus.status === "Pending"
                  ? `Camera Request Pending IT Approval`
                  : `Camera Status: ${cameraRequestStatus.status}`}
            </span>
          </div>
        </div>
      )}

      {/* Assignees or Claim Buttons */}
      {(event.photographer || event.uploader || isClubMember) && (
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          {event.photographer && (
            <span className="px-3 py-1.5 bg-[#141414] border border-neutral-800 rounded-md text-xs font-medium text-neutral-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {event.photographer} (Photo)
              {(isAdmin || (userName && userName === event.photographer)) && onReplaceMemberClick && (
                <button
                  type="button"
                  onClick={() => onReplaceMemberClick(event, "photographer")}
                  className="ml-1 text-[10px] text-red-400 hover:text-red-300 underline font-sans"
                  title="Request member to replace photographer"
                >
                  Replace
                </button>
              )}
            </span>
          )}
          {event.uploader && (
            <span className="px-3 py-1.5 bg-[#141414] border border-neutral-800 rounded-md text-xs font-medium text-neutral-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {event.uploader} (Upload)
              {(isAdmin || (userName && userName === event.uploader)) && onReplaceMemberClick && (
                <button
                  type="button"
                  onClick={() => onReplaceMemberClick(event, "uploader")}
                  className="ml-1 text-[10px] text-blue-400 hover:text-blue-300 underline font-sans"
                  title="Request member to replace uploader"
                >
                  Replace
                </button>
              )}
            </span>
          )}

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

          {isLeadOrSubLead && onRequestCameraClick && !cameraRequestStatus && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-900/40 hover:text-white transition-all font-normal"
              onClick={() => onRequestCameraClick(event)}
            >
              <Camera className="mr-1.5 h-3 w-3" />
              Request Camera (IT)
            </Button>
          )}

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

      {/* Status Pipeline Visualizer */}
      <div className="pt-4 border-t border-neutral-800/80">
        <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono mb-2">
          <span>Pipeline Progress</span>
          <span>{event.status}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {statusOrder.map((status, index) => {
            const isCompleted = index <= statusOrder.indexOf(event.status);
            const isCurrent = status === event.status;
            return (
              <div
                key={status}
                className={`h-1.5 rounded-full transition-all ${isCurrent
                    ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                    : isCompleted
                      ? "bg-neutral-600"
                      : "bg-neutral-900"
                  }`}
                title={status}
              />
            );
          })}
        </div>
      </div>

      {/* Drive Link (if delivered) */}
      {event.drive_link && (
        <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-between items-center text-xs">
          <span className="text-neutral-400 font-medium">Drive Folder</span>
          <a
            href={event.drive_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-500 hover:text-red-400 font-semibold underline flex items-center gap-1"
          >
            Access Photos →
          </a>
        </div>
      )}
    </div>
  );
}
