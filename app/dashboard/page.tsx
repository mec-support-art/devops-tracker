"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AssigneeColumn } from "@/components/AssigneeColumn";
import { CalendarView } from "@/components/CalendarView";
import { TaskEditModal } from "@/components/TaskEditModal";
import { TaskForm } from "@/components/TaskForm";
import { initialDevOpsResources, initialRequesters, type Person } from "@/lib/people";
import {
  TASK_STATUS_STYLES,
  getTaskStatus,
  isLeaveTask,
  type TaskStatus,
  type DevOpsTask,
  type UpdateTaskInput,
} from "@/lib/tasks";

type EditorState = {
  mode: "create" | "edit";
  initialTask: Partial<UpdateTaskInput>;
  taskId?: number;
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<DevOpsTask[]>([]);
  const [devopsResources, setDevopsResources] = useState<Person[]>(initialDevOpsResources);
  const [requesters, setRequesters] = useState<Person[]>(initialRequesters);
  const [dataSource, setDataSource] = useState<"supabase" | "local-fallback">("local-fallback");
  const [activeView, setActiveView] = useState<"board" | "timeline">("board");
  const [selectedProject, setSelectedProject] = useState("All projects");
  const [selectedAssignee, setSelectedAssignee] = useState("All assignees");
  const [selectedStatus, setSelectedStatus] = useState<"All statuses" | TaskStatus>(
    "All statuses",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [busyTaskIds, setBusyTaskIds] = useState<number[]>([]);

  const assigneeOptions = useMemo(() => {
    return Array.from(
      new Set([...devopsResources.map((resource) => resource.name), ...tasks.map((task) => task.assignee)]),
    ).sort((a, b) => a.localeCompare(b));
  }, [devopsResources, tasks]);
  const requesterOptions = useMemo(() => {
    return Array.from(
      new Set([...requesters.map((requester) => requester.name), ...tasks.map((task) => task.requester)]),
    ).sort((a, b) => a.localeCompare(b));
  }, [requesters, tasks]);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [tasksResponse, resourcesResponse, requestersResponse] = await Promise.all([
          fetch("/api/tasks", { cache: "no-store" }),
          fetch("/api/devops-resources", { cache: "no-store" }),
          fetch("/api/requesters", { cache: "no-store" }),
        ]);

        const tasksPayload = (await tasksResponse.json()) as {
          tasks?: DevOpsTask[];
          error?: string;
          source?: "supabase" | "local-fallback";
        };
        const resourcesPayload = (await resourcesResponse.json()) as {
          people?: Person[];
          error?: string;
        };
        const requestersPayload = (await requestersResponse.json()) as {
          people?: Person[];
          error?: string;
        };

        if (!tasksResponse.ok) {
          throw new Error(tasksPayload.error ?? "Unable to load tasks.");
        }

        if (!resourcesResponse.ok) {
          throw new Error(resourcesPayload.error ?? "Unable to load DevOps resources.");
        }

        if (!requestersResponse.ok) {
          throw new Error(requestersPayload.error ?? "Unable to load requesters.");
        }

        if (!ignore) {
          setTasks(tasksPayload.tasks ?? []);
          setDevopsResources(resourcesPayload.people ?? []);
          setRequesters(requestersPayload.people ?? []);
          setDataSource(tasksPayload.source ?? "local-fallback");
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load dashboard.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboardData();

    return () => {
      ignore = true;
    };
  }, []);

  const projectOptions = useMemo(() => {
    return ["All projects", ...Array.from(new Set(tasks.map((task) => task.project)))];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesProject =
        selectedProject === "All projects" || task.project === selectedProject;
      const matchesAssignee =
        selectedAssignee === "All assignees" || task.assignee === selectedAssignee;
      const matchesStatus =
        selectedStatus === "All statuses" || getTaskStatus(task) === selectedStatus;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        [
          task.title,
          task.project,
          task.requester,
          task.assignee,
          task.leaveReason ?? "",
          ...task.labels,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesProject && matchesAssignee && matchesStatus && matchesSearch;
    });
  }, [tasks, selectedAssignee, selectedProject, selectedStatus, searchQuery]);

  const groupedTasks = useMemo(() => {
    return assigneeOptions.map((assignee) => ({
      assignee,
      tasks: filteredTasks
        .filter((task) => task.assignee === assignee)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    }));
  }, [assigneeOptions, filteredTasks]);

  const stats = useMemo(() => {
    return filteredTasks.filter((task) => !isLeaveTask(task)).reduce(
      (acc, task) => {
        const status = getTaskStatus(task);
        acc.total += 1;
        acc[status] += 1;
        return acc;
      },
      { total: 0, onTrack: 0, inProgress: 0, overdue: 0 },
    );
  }, [filteredTasks]);

  const handleCreateTask = async (newTask: UpdateTaskInput) => {
    setErrorMessage(null);

    const { completed: _completed, ...payloadToCreate } = newTask;
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadToCreate),
    });

    const payload = (await response.json()) as {
      task?: DevOpsTask;
      error?: string;
      source?: "supabase" | "local-fallback";
    };

    if (!response.ok || !payload.task) {
      throw new Error(payload.error ?? "Unable to create task.");
    }

    setTasks((currentTasks) => [payload.task!, ...currentTasks]);
    setDataSource(payload.source ?? dataSource);
  };

  const updateBusyState = (taskId: number, active: boolean) => {
    setBusyTaskIds((current) =>
      active ? [...new Set([...current, taskId])] : current.filter((id) => id !== taskId),
    );
  };

  const handleUpdateTask = async (taskId: number, updatedTask: UpdateTaskInput) => {
    setErrorMessage(null);
    updateBusyState(taskId, true);

    try {
      if (dataSource === "local-fallback") {
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === taskId ? { ...task, ...updatedTask } : task,
          ),
        );
        return;
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTask),
      });

      const payload = (await response.json()) as {
        task?: DevOpsTask;
        error?: string;
      };

      if (!response.ok || !payload.task) {
        throw new Error(payload.error ?? "Unable to update task.");
      }

      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === taskId ? payload.task! : task)),
      );
    } finally {
      updateBusyState(taskId, false);
    }
  };

  const handleToggleCompleted = async (task: DevOpsTask) => {
    await handleUpdateTask(task.id, {
      project: task.project,
      requester: task.requester,
      title: task.title,
      assignee: task.assignee,
      startDate: task.startDate,
      endDate: task.endDate,
      labels: task.labels,
      completed: !(task.completed ?? false),
      taskType: task.taskType ?? "task",
      leaveReason: task.leaveReason ?? "",
    });
  };

  const handleDeleteTask = async (task: DevOpsTask) => {
    const confirmed = window.confirm(`Delete "${task.title}" from ${task.project}?`);
    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    updateBusyState(task.id, true);

    try {
      if (dataSource === "local-fallback") {
        setTasks((currentTasks) => currentTasks.filter((item) => item.id !== task.id));
        if (editorState?.taskId === task.id) {
          setEditorState(null);
        }
        return;
      }

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Unable to delete task.");
      }

      setTasks((currentTasks) => currentTasks.filter((item) => item.id !== task.id));
      if (editorState?.taskId === task.id) {
        setEditorState(null);
      }
    } finally {
      updateBusyState(task.id, false);
    }
  };

  const handleMoveTask = async (
    task: DevOpsTask,
    nextAssignee: string,
    nextStartDate: string,
  ) => {
    const duration = getInclusiveDuration(task.startDate, task.endDate);
    const nextEndDate = addDaysToIsoDate(nextStartDate, duration - 1);

    await handleUpdateTask(task.id, {
      project: task.project,
      requester: task.requester,
      title: task.title,
      assignee: nextAssignee,
      startDate: nextStartDate,
      endDate: nextEndDate,
      labels: task.labels,
      completed: task.completed ?? false,
      taskType: task.taskType ?? "task",
      leaveReason: task.leaveReason ?? "",
    });
  };

  const handleResizeTask = async (
    task: DevOpsTask,
    edge: "start" | "end",
    nextDate: string,
  ) => {
    if (edge === "start" && nextDate > task.endDate) {
      return;
    }

    if (edge === "end" && nextDate < task.startDate) {
      return;
    }

    await handleUpdateTask(task.id, {
      project: task.project,
      requester: task.requester,
      title: task.title,
      assignee: task.assignee,
      startDate: edge === "start" ? nextDate : task.startDate,
      endDate: edge === "end" ? nextDate : task.endDate,
      labels: task.labels,
      completed: task.completed ?? false,
      taskType: task.taskType ?? "task",
      leaveReason: task.leaveReason ?? "",
    });
  };

  const openCreateEditor = (
    assignee: string,
    isoDate: string,
    taskType: "task" | "leave" = "task",
  ) => {
    setEditorState({
      mode: "create",
      initialTask: {
        assignee,
        startDate: isoDate,
        endDate: isoDate,
        completed: false,
        taskType,
        title: taskType === "leave" ? "On leave" : "",
        project: taskType === "leave" ? "Team Availability" : "",
        requester: taskType === "leave" ? "Resource Planner" : "",
        leaveReason: "",
        labels: [],
      },
    });
  };

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm xl:p-7">
          <div className="bg-grid bg-[size:20px_20px]">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.95fr)]">
              <div className="max-w-2xl space-y-4">
                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  DevOps Resource Planner
                </span>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Track every DevOps task across projects in one calm, visual workspace.
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                    See who owns what, who requested it, and which timelines need
                    attention this week.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <DashboardStat label="Total tasks" value={stats.total} tone="slate" />
                  <DashboardStat
                    label="On track"
                    value={stats.onTrack}
                    tone={TASK_STATUS_STYLES.onTrack.badge}
                  />
                  <DashboardStat
                    label="In progress"
                    value={stats.inProgress}
                    tone={TASK_STATUS_STYLES.inProgress.badge}
                  />
                  <DashboardStat
                    label="Overdue"
                    value={stats.overdue}
                    tone={TASK_STATUS_STYLES.overdue.badge}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <TaskForm
                  assigneeOptions={assigneeOptions}
                  onSubmit={handleCreateTask}
                  requesterOptions={requesterOptions}
                />
                <Link
                  href="/dashboard/people"
                  className="group rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        People settings
                      </p>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-semibold text-slate-900">
                          Manage resources and requesters
                        </h2>
                        <p className="max-w-md text-sm leading-6 text-slate-600">
                          Open the dedicated settings page to add, rename, or remove the people
                          used across swimlanes and task forms.
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition group-hover:border-slate-300">
                      Open
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <PeopleSummaryCard
                      count={devopsResources.length}
                      label="DevOps resources"
                      tone="bg-emerald-50 text-emerald-700"
                    />
                    <PeopleSummaryCard
                      count={requesters.length}
                      label="Requesters"
                      tone="bg-sky-50 text-sky-700"
                    />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {errorMessage}
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-fit rounded-lg border border-slate-200 bg-slate-50 p-1">
              <ViewButton
                active={activeView === "board"}
                label="Swimlane view"
                onClick={() => setActiveView("board")}
              />
              <ViewButton
                active={activeView === "timeline"}
                label="Weekly timeline"
                onClick={() => setActiveView("timeline")}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search task, project, requester, assignee, or label"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 sm:min-w-80"
              />
              <select
                value={selectedProject}
                onChange={(event) => setSelectedProject(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                {projectOptions.map((project) => (
                  <option key={project}>{project}</option>
                ))}
              </select>

              <select
                value={selectedAssignee}
                onChange={(event) => setSelectedAssignee(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option>All assignees</option>
                {assigneeOptions.map((assignee) => (
                  <option key={assignee}>{assignee}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value as "All statuses" | TaskStatus)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option>All statuses</option>
                <option value="onTrack">On track</option>
                <option value="inProgress">In progress</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </section>

        {isLoading ? (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading tasks...
          </section>
        ) : activeView === "board" ? (
          <section className="grid gap-4 xl:grid-cols-4">
            {groupedTasks.map(({ assignee, tasks: assigneeTasks }) => (
              <AssigneeColumn
                key={assignee}
                assignee={assignee}
                busyTaskIds={busyTaskIds}
                onCreateLeave={() =>
                  openCreateEditor(assignee, new Date().toISOString().slice(0, 10), "leave")
                }
                onCreateTask={() =>
                  openCreateEditor(assignee, new Date().toISOString().slice(0, 10), "task")
                }
                onDelete={handleDeleteTask}
                onEdit={(task) =>
                  setEditorState({
                    mode: "edit",
                    taskId: task.id,
                    initialTask: {
                      ...task,
                      completed: task.completed ?? false,
                    },
                  })
                }
                onToggleCompleted={handleToggleCompleted}
                tasks={assigneeTasks}
              />
            ))}
          </section>
        ) : (
          <CalendarView
            assignees={assigneeOptions}
            busyTaskIds={busyTaskIds}
            onCreateLeave={(assignee, isoDate) => openCreateEditor(assignee, isoDate, "leave")}
            onCreateTask={(assignee, isoDate) => openCreateEditor(assignee, isoDate, "task")}
            onEditTask={(task) =>
              setEditorState({
                mode: "edit",
                taskId: task.id,
                initialTask: {
                  ...task,
                  completed: task.completed ?? false,
                },
              })
            }
            onMoveTask={handleMoveTask}
            onResizeTask={handleResizeTask}
            tasks={filteredTasks}
          />
        )}
      </div>
      {editorState ? (
        <TaskEditModal
          assigneeOptions={assigneeOptions}
          initialTask={editorState.initialTask}
          mode={editorState.mode}
          onClose={() => setEditorState(null)}
          onDelete={
            editorState.mode === "edit" && editorState.taskId
              ? async () => {
                  const existingTask = tasks.find((task) => task.id === editorState.taskId);
                  if (!existingTask) {
                    throw new Error("Entry not found.");
                  }

                  await handleDeleteTask(existingTask);
                }
              : undefined
          }
          onSubmit={async (taskDraft) => {
            if (editorState.mode === "create") {
              await handleCreateTask(taskDraft);
              setEditorState(null);
              return;
            }

            if (!editorState.taskId) {
              throw new Error("Missing task id for update.");
            }

            await handleUpdateTask(editorState.taskId, taskDraft);
            setEditorState(null);
          }}
          requesterOptions={requesterOptions}
        />
      ) : null}
    </main>
  );
}

function getInclusiveDuration(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / (24 * 60 * 60 * 1000)) + 1;
}

function addDaysToIsoDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function DashboardStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  const isBadgeTone = tone.startsWith("bg-");

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-3xl font-semibold text-slate-900">{value}</span>
        <span
          className={
            isBadgeTone
              ? `rounded-md px-2 py-1 text-[11px] font-semibold ${tone}`
              : "rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600"
          }
        >
          Live
        </span>
      </div>
    </div>
  );
}

function PeopleSummaryCard({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-3xl font-semibold text-slate-900">{count}</span>
        <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${tone}`}>Active</span>
      </div>
    </div>
  );
}

function ViewButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-white hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}
