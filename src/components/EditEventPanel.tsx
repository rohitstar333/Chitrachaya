import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface EditEventPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: any | null;
    onSuccess: () => void;
}

const statusOptions = [
    "Requested",
    "Assigned",
    "In Progress",
    "Uploaded",
    "Delivered"
];

export function EditEventPanel({ open, onOpenChange, event, onSuccess }: EditEventPanelProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        status: "",
        photographer: "",
        uploader: "",
        drive_link: "",
        mail_sent: false,
    });

    useEffect(() => {
        if (event) {
            setFormData({
                status: event.status || "Requested",
                photographer: event.photographer || "",
                uploader: event.uploader || "",
                drive_link: event.drive_link || "",
                mail_sent: event.mail_sent || false,
            });
        }
    }, [event]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!event) return;

        setLoading(true);

        const { error } = await supabase
            .from("events")
            .update({
                status: formData.status,
                photographer: formData.photographer,
                uploader: formData.uploader,
                drive_link: formData.drive_link,
                mail_sent: formData.mail_sent,
            })
            .eq("id", event.id);

        if (error) {
            toast.error(error.message);
            setLoading(false);
            return;
        }

        toast.success("Event updated successfully!");
        setLoading(false);
        onSuccess();
        onOpenChange(false);
    };

    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-neutral-800 bg-neutral-950 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Event: {event.event_name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="status" className="text-neutral-300">Status</Label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            {statusOptions.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="photographer" className="text-neutral-300">Photographer Assigned</Label>
                        <Input
                            id="photographer"
                            name="photographer"
                            value={formData.photographer}
                            onChange={handleChange}
                            placeholder="e.g. John Doe"
                            className="border-neutral-800 bg-neutral-900 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="uploader" className="text-neutral-300">Uploader (Editor)</Label>
                        <Input
                            id="uploader"
                            name="uploader"
                            value={formData.uploader}
                            onChange={handleChange}
                            placeholder="e.g. Jane Doe"
                            className="border-neutral-800 bg-neutral-900 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="drive_link" className="text-neutral-300">Drive Link</Label>
                        <Input
                            id="drive_link"
                            name="drive_link"
                            value={formData.drive_link}
                            onChange={handleChange}
                            placeholder="https://drive.google.com/..."
                            className="border-neutral-800 bg-neutral-900 text-white"
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Switch
                            id="mail_sent"
                            checked={formData.mail_sent}
                            onCheckedChange={(checked) => setFormData(p => ({ ...p, mail_sent: checked }))}
                        />
                        <Label htmlFor="mail_sent" className="text-neutral-300">Mail Sent to Requester</Label>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
