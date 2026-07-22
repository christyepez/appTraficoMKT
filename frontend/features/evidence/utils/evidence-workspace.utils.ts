import type { Activity } from "../models/evidence.models";

export function isFinalActivity(status: string) {
  return ["Approved", "Completed"].includes(status);
}

export function attachableActivities(activities: Activity[]) {
  return activities.filter((activity) => !isFinalActivity(activity.status));
}

export function toggleExpanded(values: string[], id: string) {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
}
