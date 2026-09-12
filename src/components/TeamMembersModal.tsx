import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Shield, UserCheck, Award } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    roll_number?: string;
}

interface TeamMembersModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TeamMembersModal({ open, onOpenChange }: TeamMembersModalProps) {
    const { user, role: currentUserRole } = useAuth();
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const isLead = ["Lead", "Admin", "3rd year"].includes(currentUserRole || "");
    const isSubLead = ["SubLead", "2nd year"].includes(currentUserRole || "");
    const isPrimaryLead = user?.email?.toLowerCase().includes("rohit") || user?.email?.toLowerCase().includes("vsnsr") || currentUserRole === "Lead" || currentUserRole === "Admin";

    const fetchMembers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("profiles")
            .select("*");

        if (!error && data) {
            setMembers(data);
        }
        setLoading(false);
    };

    const handleRoleChange = async (targetUserId: string, newRole: string) => {
        setUpdatingId(targetUserId);
        const { error } = await supabase.rpc("change_member_role", {
            target_user_id: targetUserId,
            new_role: newRole,
        });

        if (error) {
            toast.error(error.message || "Failed to update member role.");
        } else {
            toast.success(`Role updated to ${newRole}!`);
            fetchMembers();
        }
        setUpdatingId(null);
    };

    useEffect(() => {
        if (open) {
            fetchMembers();
        }
    }, [open]);

    const filteredMembers = members.filter((m) => {
        const query = searchQuery.toLowerCase();
        return (
            (m.full_name && m.full_name.toLowerCase().includes(query)) ||
            (m.role && m.role.toLowerCase().includes(query)) ||
            (m.email && m.email.toLowerCase().includes(query))
        );
    });

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "Lead":
            case "Admin":
            case "3rd year":
                return (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-semibold bg-red-500/10 text-red-500 border-red-500/30">
                        <Award className="h-3 w-3" /> Lead (3rd Year)
                    </span>
                );
            case "SubLead":
            case "2nd year":
                return (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-semibold bg-blue-500/10 text-blue-400 border-blue-500/30">
                        <Shield className="h-3 w-3" /> SubLead (2nd Year)
                    </span>
                );
            case "Core":
            case "1st year":
                return (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-semibold bg-purple-500/10 text-purple-400 border-purple-500/30">
                        <UserCheck className="h-3 w-3" /> Core (1st Year)
                    </span>
                );
            case "IT":
                return (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-semibold bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                        <Shield className="h-3 w-3" /> IT Server Room
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-medium bg-neutral-800 text-neutral-400 border-neutral-700">
                        {role || "Member"}
                    </span>
                );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] bg-neutral-950 text-white border-neutral-800 max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 border border-red-500/20 text-red-500">
                            <Users className="h-4 w-4" />
                        </div>
                        Club Team Directory
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        All official photography club members and their designated roles.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative pt-2">
                    <Search className="absolute left-3 top-5 h-4 w-4 text-neutral-500" />
                    <Input
                        placeholder="Search by member name, role, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 border-neutral-800 bg-neutral-900 text-white placeholder:text-neutral-500 focus-visible:ring-red-500"
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 pt-3 min-h-[250px] max-h-[400px] hide-scrollbar">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500 text-sm border border-dashed border-neutral-800 rounded-xl">
                            No club members found matching your search.
                        </div>
                    ) : (
                        filteredMembers.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-800/80 bg-neutral-900/50 hover:border-neutral-700 transition-colors"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-white text-sm">
                                            {member.full_name || "Unknown Name"}
                                        </p>
                                    </div>
                                    <p className="text-xs font-mono text-neutral-400">
                                        {member.email} {member.roll_number && `• Roll: ${member.roll_number}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isLead ? (
                                        <select
                                            value={member.role}
                                            disabled={updatingId === member.id}
                                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                            className="h-8 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer font-medium"
                                        >
                                            <option value="Lead">Lead (3rd Year)</option>
                                            <option value="SubLead">SubLead (2nd Year)</option>
                                            <option value="Core">Core (1st Year)</option>
                                            {(isPrimaryLead || member.role === "IT") && (
                                                <option value="IT">IT Server Room Staff</option>
                                            )}
                                            <option value="Event Requester">Event Requester</option>
                                        </select>
                                    ) : isSubLead && member.role === "Event Requester" ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={updatingId === member.id}
                                            onClick={() => handleRoleChange(member.id, "Core")}
                                            className="h-7 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                                        >
                                            Make Core
                                        </Button>
                                    ) : (
                                        getRoleBadge(member.role)
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex justify-end pt-3 border-t border-neutral-900">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-neutral-800 text-neutral-300 hover:bg-neutral-900 hover:text-white"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
