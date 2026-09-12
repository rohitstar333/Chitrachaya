import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Phone, UserCheck, Shield } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import type { Event as EventType } from "./EventCard";

interface RequestCameraModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: EventType | null;
    userName: string;
    userRollNumber?: string;
}

export function RequestCameraModal({ open, onOpenChange, event, userName, userRollNumber }: RequestCameraModalProps) {
    const [loading, setLoading] = useState(false);
    const [assigneePhone, setAssigneePhone] = useState("");
    const [leadPhone, setLeadPhone] = useState("");
    const [cameraKit, setCameraKit] = useState("Standard Camera Kit (Body + Lens)");

    useEffect(() => {
        if (!open) {
            setAssigneePhone("");
            setLeadPhone("");
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!event) return;

        if (!assigneePhone.trim() || !leadPhone.trim()) {
            toast.error("Please fill in both phone numbers (Assignee & Lead Backup).");
            return;
        }

        setLoading(true);

        const { error } = await supabase.from("camera_requests").insert([
            {
                event_id: event.id,
                requester_id: (await supabase.auth.getUser()).data.user?.id,
                assignee_name: userName,
                assignee_roll_number: userRollNumber || "N/A",
                assignee_phone: assigneePhone,
                lead_phone: leadPhone,
                camera_details: cameraKit,
                status: "Requested"
            },
        ]);

        if (error) {
            toast.error(error.message || "Failed to submit camera request to IT.");
            console.error(error);
        } else {
            toast.success("Camera equipment request sent to IT Server Room!");
            onOpenChange(false);
        }

        setLoading(false);
    };

    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] bg-neutral-950 text-white border-neutral-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 border border-red-500/20 text-red-500">
                            <Camera className="h-4 w-4" />
                        </div>
                        Request Camera Equipment from IT
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Submit Digital ID & Contact info to IT Server Room for camera handover.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Event Summary Card */}
                    <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/50 text-xs space-y-1">
                        <p className="font-semibold text-white text-sm line-clamp-1">{event.event_name}</p>
                        <p className="text-neutral-400">Club: {event.club_name} • Venue: {event.venue}</p>
                    </div>

                    {/* Digital ID info */}
                    <div className="space-y-2 pt-1">
                        <Label className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Digital ID (Assigned Member)</Label>
                        <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/80 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-white text-sm flex items-center gap-1.5">
                                    <UserCheck className="h-4 w-4 text-red-500" />
                                    {userName}
                                </p>
                                <p className="text-xs text-neutral-400 mt-0.5">Roll No: {userRollNumber || "Provided on login"}</p>
                            </div>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">Verified</span>
                        </div>
                    </div>

                    {/* Assignee Phone No */}
                    <div className="space-y-2">
                        <Label htmlFor="assigneePhone" className="text-neutral-300 flex items-center gap-1.5 text-xs">
                            <Phone className="h-3.5 w-3.5 text-red-500" />
                            Your Contact Phone Number *
                        </Label>
                        <Input
                            id="assigneePhone"
                            placeholder="+91 9876543210"
                            value={assigneePhone}
                            onChange={(e) => setAssigneePhone(e.target.value)}
                            required
                            className="border-neutral-800 bg-neutral-900 text-white placeholder:text-neutral-600 focus-visible:ring-red-500"
                        />
                    </div>

                    {/* Lead Phone No */}
                    <div className="space-y-2">
                        <Label htmlFor="leadPhone" className="text-neutral-300 flex items-center gap-1.5 text-xs">
                            <Shield className="h-3.5 w-3.5 text-blue-500" />
                            Lead Backup Phone Number *
                        </Label>
                        <Input
                            id="leadPhone"
                            placeholder="+91 9123456789 (Contact if unavailable)"
                            value={leadPhone}
                            onChange={(e) => setLeadPhone(e.target.value)}
                            required
                            className="border-neutral-800 bg-neutral-900 text-white placeholder:text-neutral-600 focus-visible:ring-red-500"
                        />
                        <p className="text-[11px] text-neutral-500">
                            IT staff will contact Lead backup if assigned member is unreachable.
                        </p>
                    </div>

                    {/* Camera Kit Type */}
                    <div className="space-y-2">
                        <Label className="text-neutral-300 text-xs">Camera Kit Requested</Label>
                        <select
                            value={cameraKit}
                            onChange={(e) => setCameraKit(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="Standard Camera Kit (Body + Lens)">Standard Camera Kit (Body + Lens)</option>
                            <option value="Dual Camera Kit (Body + 2 Lenses)">Dual Camera Kit (Body + 2 Lenses)</option>
                            <option value="Videography Kit (Camera + Mic + Tripod)">Videography Kit (Camera + Mic + Tripod)</option>
                            <option value="Full Coverage Pro Gear">Full Coverage Pro Gear</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-900">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-neutral-800 text-neutral-300 hover:bg-neutral-900 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !assigneePhone.trim() || !leadPhone.trim()}
                            className="bg-red-600 text-white hover:bg-red-700 font-semibold"
                        >
                            {loading ? "Submitting..." : "Send Request to IT"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
