import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Event as EventType } from "./EventCard";

interface UpdateProgressModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: EventType | null;
    onSuccess?: () => void;
}

const statusOptions = [
    "Requested",
    "Assigned",
    "In Progress",
    "Uploaded",
    "Delivered"
];

export function UpdateProgressModal({ open, onOpenChange, event, onSuccess }: UpdateProgressModalProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("");
    const [driveLink, setDriveLink] = useState("");

    // Reset local state when event changes
    useEffect(() => {
        if (event) {
            setStatus(event.status || "Assigned");
            setDriveLink(event.drive_link || "");
        }
    }, [event]);

    const handleUpdate = async () => {
        if (!event) return;

        setLoading(true);

        const updateData: any = { status };
        if (driveLink !== "") {
            updateData.drive_link = driveLink;
        }

        const { error } = await supabase
            .from("events")
            .update(updateData)
            .eq("id", event.id);

        if (error) {
            toast.error("Failed to update progress.");
        } else {
            toast.success("Progress updated successfully!");
            onOpenChange(false);
            if (onSuccess) onSuccess();
        }

        setLoading(false);
    };

    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">Update Progress</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Update the status or add a Drive Link for <span className="text-white font-medium">{event.event_name}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="status" className="text-neutral-300">Current Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="status" className="bg-[#0a0a0a] border-neutral-800 text-white">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                {statusOptions.map((opt) => (
                                    <SelectItem key={opt} value={opt} className="hover:bg-neutral-800 cursor-pointer focus:bg-neutral-800 focus:text-white">
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="drive_link" className="text-neutral-300">Deliverables Drive Link</Label>
                        <Input
                            id="drive_link"
                            placeholder="https://drive.google.com/..."
                            value={driveLink}
                            onChange={(e) => setDriveLink(e.target.value)}
                            className="bg-[#0a0a0a] border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-red-600 focus-visible:ring-offset-0"
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                            Only fill this if you have finished the work and uploaded it.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleUpdate}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                    >
                        {loading ? "Saving..." : "Save Progress"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
