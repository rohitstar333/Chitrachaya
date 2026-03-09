import { format } from "date-fns";
import { Event as EventType } from "@/components/EventCard";
import { CheckCircle2, Navigation, Anchor } from "lucide-react";

interface PastEventsLogProps {
    events: EventType[];
}

export function PastEventsLog({ events }: PastEventsLogProps) {
    if (events.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-neutral-800 bg-[#0a0a0a] p-12 text-center text-neutral-500">
                No past events logged yet.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-neutral-400 uppercase bg-[#111111] border-b border-neutral-800">
                        <tr>
                            <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Event Name</th>
                            <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Club</th>
                            <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Photographer</th>
                            <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Uploader</th>
                            <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-right">Drive</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                        {events.map((event) => (
                            <tr key={event.id} className="hover:bg-neutral-900/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-neutral-300 whitespace-nowrap">
                                    {format(new Date(event.date), "dd MMM yyyy")}
                                </td>
                                <td className="px-6 py-4 font-medium text-white max-w-[200px] truncate" title={event.event_name}>
                                    {event.event_name}
                                </td>
                                <td className="px-6 py-4 text-neutral-400 whitespace-nowrap">
                                    {event.club_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {event.photographer ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium">
                                            {event.photographer}
                                        </span>
                                    ) : (
                                        <span className="text-neutral-600 text-xs italic">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {event.uploader ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium">
                                            {event.uploader}
                                        </span>
                                    ) : (
                                        <span className="text-neutral-600 text-xs italic">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    {event.drive_link ? (
                                        <a
                                            href={event.drive_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
                                        >
                                            <Anchor className="h-3 w-3" /> Link
                                        </a>
                                    ) : (
                                        <span className="text-neutral-600 text-xs italic">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
