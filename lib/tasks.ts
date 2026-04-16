export type DevOpsTask = {
  id: number;
  project: string;
  requester: string;
  title: string;
  assignee: string;
  startDate: string;
  endDate: string;
  labels: string[];
  completed?: boolean;
  taskType?: TaskType;
  leaveReason?: string;
};

export type NewTaskInput = Omit<DevOpsTask, "id" | "completed">;
export type UpdateTaskInput = NewTaskInput & { completed: boolean };
export type TaskStatus = keyof typeof TASK_STATUS_STYLES;
export type TaskType = "task" | "leave";

export type TaskRecord = {
  id: number;
  project: string;
  requester: string;
  title: string;
  assignee: string;
  start_date: string;
  end_date: string;
  labels: string[] | null;
  completed: boolean | null;
  task_type: TaskType | null;
  leave_reason: string | null;
  created_at?: string;
};

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

export const LEAVE_TASK_STYLE = {
  label: "On leave",
  badge: "bg-cyan-50 text-cyan-700",
  bar: "bg-cyan-300",
} as const;

export function createEmptyTaskInput(): NewTaskInput {
  const today = new Date().toISOString().slice(0, 10);

  return {
    project: "",
    requester: "",
    title: "",
    assignee: "",
    startDate: today,
    endDate: today,
    labels: [],
    taskType: "task",
    leaveReason: "",
  };
}

export function getTaskStatus(task: DevOpsTask) {
  if (isLeaveTask(task)) {
    return "onTrack";
  }

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

export function normalizeTaskInput<T extends NewTaskInput | UpdateTaskInput>(task: T): T {
  const normalizedTaskType = task.taskType === "leave" ? "leave" : "task";
  const project = task.project.trim();
  const requester = task.requester.trim();
  const title = task.title.trim();
  const leaveReason = (task.leaveReason ?? "").trim();

  return {
    ...task,
    project:
      normalizedTaskType === "leave" ? project || "Team Availability" : project,
    requester: normalizedTaskType === "leave" ? requester || "Resource Planner" : requester,
    title: normalizedTaskType === "leave" ? title || "On leave" : title,
    assignee: task.assignee.trim(),
    labels: task.labels
      .map((label) => label.trim())
      .filter(Boolean)
      .filter((label, index, labels) => labels.indexOf(label) === index),
    taskType: normalizedTaskType,
    leaveReason,
  } as T;
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

export function isLeaveTask(task: Pick<DevOpsTask, "taskType">) {
  return (task.taskType ?? "task") === "leave";
}

export function getTaskPresentation(task: DevOpsTask) {
  if (isLeaveTask(task)) {
    return LEAVE_TASK_STYLE;
  }

  return TASK_STATUS_STYLES[getTaskStatus(task)];
}

export function toTask(record: TaskRecord): DevOpsTask {
  return {
    id: record.id,
    project: record.project,
    requester: record.requester,
    title: record.title,
    assignee: record.assignee,
    startDate: record.start_date,
    endDate: record.end_date,
    labels: record.labels ?? [],
    completed: record.completed ?? false,
    taskType: record.task_type ?? "task",
    leaveReason: record.leave_reason ?? "",
  };
}

export function toTaskInsert(task: NewTaskInput) {
  const normalized = normalizeTaskInput(task);

  return {
    project: normalized.project,
    requester: normalized.requester,
    title: normalized.title,
    assignee: normalized.assignee,
    start_date: normalized.startDate,
    end_date: normalized.endDate,
    labels: normalized.labels,
    completed: false,
    task_type: normalized.taskType,
    leave_reason: normalized.leaveReason || null,
  };
}

export function toTaskUpdate(task: UpdateTaskInput) {
  const normalized = normalizeTaskInput(task);

  return {
    project: normalized.project,
    requester: normalized.requester,
    title: normalized.title,
    assignee: normalized.assignee,
    start_date: normalized.startDate,
    end_date: normalized.endDate,
    labels: normalized.labels,
    completed: normalized.completed,
    task_type: normalized.taskType,
    leave_reason: normalized.leaveReason || null,
  };
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
