import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import type { Event as EventType } from "./EventCard";

interface RequestMemberModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: EventType | null;
    requesterId: string;
    requesterName: string;
}

export function RequestMemberModal({ open, onOpenChange, event, requesterId, requesterName }: RequestMemberModalProps) {
    const [loading, setLoading] = useState(false);
    const [targetName, setTargetName] = useState("");
    const [roleType, setRoleType] = useState<"photographer" | "uploader">("photographer");
    const [members, setMembers] = useState<{ id: string, full_name: string, role: string }[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);

    useEffect(() => {
        if (open) {
            setIsLoadingMembers(true);
            const fetchMembers = async () => {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("id, full_name, role")
                    .order("full_name");

                if (data && !error) {
                    const validMembers = data.filter(m =>
                        m.full_name &&
                        m.full_name !== requesterName &&
                        m.role !== "Event Requester"
                    );
                    setMembers(validMembers);
                } else if (error) {
                    console.error("Error fetching profiles:", error);
                }
                setIsLoadingMembers(false);
            };
            fetchMembers();
        } else {
            // Reset when closed
            setTargetName("");
            setRoleType("photographer");
        }
    }, [open, requesterName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!event) return;

        setLoading(true);

        const { error } = await supabase.from("task_requests").insert([
            {
                event_id: event.id,
                requester_id: requesterId,
                requester_name: requesterName,
                target_user_name: targetName,
                role_type: roleType,
                status: "Pending"
            },
        ]);

        if (error) {
            toast.error(error.message || "Failed to send request.");
            console.error(error);
        } else {
            toast.success(`Coverage request sent to ${targetName}!`);
            onOpenChange(false);
            setTargetName("");
        }

        setLoading(false);
    };

    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-neutral-950 text-white border-neutral-800">
                <DialogHeader>
                    <DialogTitle>Request Member Coverage</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Ask a specific team member to cover {event.event_name}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label className="text-neutral-300">Select Member</Label>
                        <Select value={targetName} onValueChange={setTargetName} required>
                            <SelectTrigger className="border-neutral-800 bg-neutral-900 text-white focus:ring-red-500">
                                <SelectValue placeholder="Select a team member..." />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white max-h-60 overflow-y-auto">
                                {isLoadingMembers ? (
                                    <SelectItem value="loading" disabled>Loading members...</SelectItem>
                                ) : members.length === 0 ? (
                                    <SelectItem value="empty" disabled>No members found</SelectItem>
                                ) : (
                                    members.map((member) => (
                                        <SelectItem key={member.id} value={member.full_name} className="hover:bg-neutral-800 cursor-pointer focus:bg-neutral-800 focus:text-white">
                                            {member.full_name} <span className="text-neutral-500 text-xs ml-2">({member.role})</span>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-neutral-300">Role Needed</Label>
                        <select
                            value={roleType}
                            onChange={(e) => setRoleType(e.target.value as any)}
                            required
                            className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="photographer">Photographer</option>
                            <option value="uploader">Uploader (Editor)</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
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
                            disabled={loading || !targetName.trim()}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            {loading ? "Sending..." : "Send Request"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
