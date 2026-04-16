export type DevOpsTask = {
  id: number;
  project: string;
  projectManager: string;
  title: string;
  assignee: string;
  startDate: string;
  endDate: string;
  labels: string[];
  completed?: boolean;
};

export type NewTaskInput = Omit<DevOpsTask, "id" | "completed">;

export const assigneeOptions = ["Maya Chen", "Rohan Patel", "Elena Brooks", "James Kim"];

export const TASK_STATUS_STYLES = {
  onTrack: {
    label: "On track",
    badge: "bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-300",
  },
  inProgress: {
    label: "In progress",
    badge: "bg-amber-50 text-amber-700",
    bar: "bg-amber-300",
  },
  overdue: {
    label: "Overdue",
    badge: "bg-rose-50 text-rose-700",
    bar: "bg-rose-300",
  },
} as const;

export function getTaskStatus(task: DevOpsTask) {
  if (task.completed) {
    return "onTrack";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = toDate(task.startDate);
  const end = toDate(task.endDate);

  if (end < today) {
    return "overdue";
  }

  if (start <= today && end >= today) {
    return "inProgress";
  }

  return "onTrack";
}

export function formatDateLabel(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(toDate(dateString));
}

export function getWeekDays(baseDate = new Date()) {
  const normalized = new Date(baseDate);
  normalized.setHours(0, 0, 0, 0);

  const dayOfWeek = normalized.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(normalized);
  monday.setDate(normalized.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);

    return {
      iso: toIsoDate(current),
      label: current.toLocaleDateString("en-US", { weekday: "short" }),
      shortDate: current.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });
}

export function isTaskOnDate(task: DevOpsTask, date: string) {
  const day = toDate(date);
  const start = toDate(task.startDate);
  const end = toDate(task.endDate);

  return day >= start && day <= end;
}

function toDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
