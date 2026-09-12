import React, { useState, useEffect } from "react";
import { Camera, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Event } from "./EventCard";

interface CameraRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
    eventsList?: Event[];
    currentUser: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    onSuccess?: () => void;
}

export function CameraRequestModal({ isOpen, onClose, event, eventsList, currentUser, onSuccess }: CameraRequestModalProps) {
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(event);
    const [assigneePhone, setAssigneePhone] = useState("");
    const [leadPhone, setLeadPhone] = useState("");
    const [equipmentDetails, setEquipmentDetails] = useState("Canon EOS R6 + 24-70mm Lens Kit & SD Card");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (event) {
            setSelectedEvent(event);
        } else if (eventsList && eventsList.length > 0) {
            setSelectedEvent(eventsList[0]);
        }
    }, [event, eventsList, isOpen]);

    const activeEvent = selectedEvent || (eventsList && eventsList.length > 0 ? eventsList[0] : null);

    // Extract roll number from email (e.g. john.21bcs101@iiitkottayam.ac.in -> 21BCS101)
    const extractRollNumber = (email: string) => {
        const parts = email.split("@")[0].split(".");
        if (parts.length > 1) {
            return parts[parts.length - 1].toUpperCase();
        }
        return "MEMBER-" + email.substring(0, 5).toUpperCase();
    };

    const rollNumber = extractRollNumber(currentUser.email);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeEvent) {
            toast.error("Please select an event for the camera request.");
            return;
        }

        if (!assigneePhone.trim() || !leadPhone.trim()) {
            toast.error("Please provide both your phone number and fallback Lead phone number.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from("camera_requests").insert([{
                event_id: activeEvent.id,
                event_name: activeEvent.event_name,
                requester_id: currentUser.id,
                requester_name: currentUser.name,
                requester_email: currentUser.email,
                requester_roll: rollNumber,
                assignee_phone: assigneePhone.trim(),
                lead_phone: leadPhone.trim(),
                equipment_details: equipmentDetails.trim(),
                status: "Pending"
            }]);

            if (error) throw error;

            toast.success("Camera request & Digital ID submitted to IT Server Room!");
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Camera Request Error:", err);
            toast.error(err.message || "Failed to submit camera request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[540px] bg-[#0c0c0c] border-neutral-800 text-white p-6 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-1 text-left">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                        <Camera className="h-5 w-5 text-red-500" />
                        IT Camera Request & Digital ID
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400 text-sm">
                        Generate your official Digital ID pass and submit a camera handoff request to IT Server Room.
                    </DialogDescription>
                </DialogHeader>

                {/* EVENT SELECTOR IF NOT PASSED DIRECTLY */}
                {eventsList && eventsList.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                        <Label className="text-xs text-neutral-300 font-medium">Select Target Event</Label>
                        <select
                            value={activeEvent?.id || ""}
                            onChange={(e) => {
                                const found = eventsList.find(ev => ev.id === e.target.value);
                                if (found) setSelectedEvent(found);
                            }}
                            className="w-full h-9 rounded-lg border border-neutral-800 bg-[#141414] px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer font-medium"
                        >
                            {eventsList.map((ev) => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.event_name} ({ev.date})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* DIGITAL ID CARD PREVIEW */}
                {activeEvent ? (
                    <div className="mt-4 rounded-xl border border-red-900/50 bg-gradient-to-br from-[#180a0a] via-[#111111] to-[#0a0a0a] p-5 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>

                        <div className="flex justify-between items-center pb-3 border-b border-red-900/40">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center font-bold text-xs text-white">
                                    CC
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold tracking-wider text-white uppercase">Chitrachaya Digital ID Pass</h4>
                                    <p className="text-[10px] text-neutral-400">IIIT Kottayam Official Photography Club</p>
                                </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-mono">
                                OFFICIAL
                            </span>
                        </div>

                        <div className="mt-4 flex gap-4 items-center">
                            <div className="h-16 w-16 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-neutral-400 font-bold text-xl uppercase shrink-0">
                                {currentUser.name.charAt(0)}
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                                <div className="font-semibold text-sm text-white truncate">{currentUser.name}</div>
                                <div className="text-xs text-neutral-400 truncate">{currentUser.email}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[11px] font-mono text-neutral-300 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                                        ID: {rollNumber}
                                    </span>
                                    <span className="text-[11px] font-semibold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-900/60">
                                        {currentUser.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-900 flex justify-between text-[11px] text-neutral-400 font-mono">
                            <span>Event: {activeEvent.event_name}</span>
                            <span>Date: {activeEvent.date}</span>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-lg">
                        No active events available to request a camera.
                    </div>
                )}

                {/* FORM INPUTS */}
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-neutral-300 font-medium">Equipment Requested</Label>
                        <Input
                            value={equipmentDetails}
                            onChange={(e) => setEquipmentDetails(e.target.value)}
                            placeholder="e.g. Canon EOS R6 + 24-70mm Lens Kit"
                            className="bg-[#141414] border-neutral-800 text-white placeholder:text-neutral-600 focus:border-red-600 text-sm"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-neutral-300 font-medium flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-red-500" />
                                Your Phone Number
                            </Label>
                            <Input
                                value={assigneePhone}
                                onChange={(e) => setAssigneePhone(e.target.value)}
                                placeholder="+91 9876543210"
                                className="bg-[#141414] border-neutral-800 text-white placeholder:text-neutral-600 focus:border-red-600 text-sm font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-neutral-300 font-medium flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-red-500" />
                                Fallback Lead Phone Number
                            </Label>
                            <Input
                                value={leadPhone}
                                onChange={(e) => setLeadPhone(e.target.value)}
                                placeholder="+91 9123456789"
                                className="bg-[#141414] border-neutral-800 text-white placeholder:text-neutral-600 focus:border-red-600 text-sm font-mono"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3 justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-neutral-400 hover:text-white hover:bg-neutral-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !activeEvent}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 shadow-md shadow-red-950"
                        >
                            {isSubmitting ? "Submitting..." : "Send Request to IT Server Room"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
