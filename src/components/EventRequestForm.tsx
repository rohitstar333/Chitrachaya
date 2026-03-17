import { useState } from "react";
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
  DialogDescription,
} from "@/components/ui/dialog";

interface EventRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  userName: string;
}

export function EventRequestForm({ open, onOpenChange, onSuccess, userId, userName }: EventRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    event_name: "",
    club_name: "",
    date: "",
    event_time: "",
    venue: "",
    coverage_type: "Photography",
    additional_info: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("events").insert({
      event_name: formData.event_name,
      club_name: formData.club_name,
      date: formData.date,
      event_time: formData.event_time,
      venue: formData.venue,
      coverage_type: formData.coverage_type,
      additional_info: formData.additional_info,
      created_by: userId,
      requester_name: userName,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Event requested successfully!");
    setLoading(false);
    onSuccess();
    onOpenChange(false);
    setFormData({
      event_name: "",
      club_name: "",
      date: "",
      event_time: "",
      venue: "",
      coverage_type: "Photography",
      additional_info: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-neutral-800 bg-neutral-950 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Event Coverage</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Fill out the details below to request photography coverage.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="event_name" className="text-neutral-300">Event Name</Label>
            <Input
              id="event_name"
              name="event_name"
              value={formData.event_name}
              onChange={handleChange}
              required
              className="border-neutral-800 bg-neutral-900 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="club_name" className="text-neutral-300">Club Name</Label>
            <select
              id="club_name"
              name="club_name"
              value={formData.club_name}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Select your club</option>
              <option value="Beta Labs">Beta Labs</option>
              <option value="GDG">GDG</option>
              <option value="Drama Club">Drama Club</option>
              <option value="Music Club">Music Club</option>
              <option value="LITSOC">LITSOC</option>
              <option value="MindQuest">MindQuest</option>
              <option value="Cyber Club">Cyber Club</option>
              <option value="Enigma">Enigma</option>
              <option value="Finance & eCell">Finance & eCell</option>
              <option value="TAD">TAD</option>
              <option value="Wildbeats">Wildbeats</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="additional_info" className="text-neutral-300">Additional Info (Optional)</Label>
            <textarea
              id="additional_info"
              name="additional_info"
              value={formData.additional_info}
              onChange={handleChange}
              rows={3}
              placeholder="Any specific instructions or details..."
              className="flex w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-neutral-300">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="border-neutral-800 bg-neutral-900 text-white [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_time" className="text-neutral-300">Time</Label>
              <Input
                id="event_time"
                name="event_time"
                type="time"
                value={formData.event_time}
                onChange={handleChange}
                required
                className="border-neutral-800 bg-neutral-900 text-white [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coverage_type" className="text-neutral-300">Coverage Type</Label>
              <select
                id="coverage_type"
                name="coverage_type"
                value={formData.coverage_type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Photography">Photography</option>
                <option value="Videography">Videography</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue" className="text-neutral-300">Venue</Label>
            <Input
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              required
              className="border-neutral-800 bg-neutral-900 text-white"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
