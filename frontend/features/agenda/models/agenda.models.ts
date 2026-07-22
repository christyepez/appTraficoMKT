import type { Activity, Requirement, Technician } from "../../../shared/models/api.models";

export type { Activity, Requirement, Technician } from "../../../shared/models/api.models";

export type AgendaItem = { id: string; activityId: string; requirementId: string; productId: string; productType: string; technicianName: string; technicianEmail: string; startAt: string; endAt: string; title: string; notes: string };
export type WorkdayRange = { startHour: number; startMinute: number; endHour: number; endMinute: number };
export type AgendaWorkspaceData = { activities: Activity[]; requirements: Requirement[]; technicians: Technician[]; items: AgendaItem[]; workdayStartTime: string; workdayEndTime: string; replanningWindowDays: number };
export type SaveAgendaPayload = { activityId: string; technicianName: string; technicianEmail: string; startAt: string; endAt: string; title: string; notes: string; createdBy: string };
