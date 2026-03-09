export type EventStage = "requested" | "approved" | "assigned" | "in_progress" | "uploaded" | "delivered";

export interface EventRequest {
  id: string;
  eventName: string;
  clubName: string;
  contactPerson: string;
  contactEmail: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  description: string;
  expectedAttendees: number;
  coverageType: string[];
  specialRequirements: string;
  stage: EventStage;
  assignedPhotographers: string[];
  driveLink: string;
  createdAt: string;
  updatedAt: string;
}

export interface Photographer {
  id: string;
  name: string;
  specialization: string;
  available: boolean;
}

export const STAGE_LABELS: Record<EventStage, string> = {
  requested: "Requested",
  approved: "Approved",
  assigned: "Assigned",
  in_progress: "In Progress",
  uploaded: "Uploaded",
  delivered: "Delivered",
};

export const STAGE_ORDER: EventStage[] = [
  "requested",
  "approved",
  "assigned",
  "in_progress",
  "uploaded",
  "delivered",
];
