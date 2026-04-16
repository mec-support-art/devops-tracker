"use client";

import { useEffect, useMemo, useState } from "react";

import { AssigneeColumn } from "@/components/AssigneeColumn";
import { CalendarView } from "@/components/CalendarView";
import { TaskForm } from "@/components/TaskForm";
import {
  TASK_STATUS_STYLES,
  assigneeOptions,
  getTaskStatus,
  type DevOpsTask,
  type NewTaskInput,
} from "@/lib/tasks";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<DevOpsTask[]>([]);
  const [activeView, setActiveView] = useState<"board" | "timeline">("board");
  const [selectedProject, setSelectedProject] = useState("All projects");
  const [selectedAssignee, setSelectedAssignee] = useState("All assignees");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadTasks() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await fetch("/api/tasks", { cache: "no-store" });
        const payload = (await response.json()) as {
          tasks?: DevOpsTask[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load tasks.");
        }

        if (!ignore) {
          setTasks(payload.tasks ?? []);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load tasks.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadTasks();

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

      return matchesProject && matchesAssignee;
    });
  }, [tasks, selectedProject, selectedAssignee]);

  const groupedTasks = useMemo(() => {
    return assigneeOptions.map((assignee) => ({
      assignee,
      tasks: filteredTasks
        .filter((task) => task.assignee === assignee)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    }));
  }, [filteredTasks]);

  const stats = useMemo(() => {
    return filteredTasks.reduce(
      (acc, task) => {
        const status = getTaskStatus(task);
        acc.total += 1;
        acc[status] += 1;
        return acc;
      },
      { total: 0, onTrack: 0, inProgress: 0, overdue: 0 },
    );
  }, [filteredTasks]);

  const handleCreateTask = async (newTask: NewTaskInput) => {
    setErrorMessage(null);

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newTask),
    });

    const payload = (await response.json()) as {
      task?: DevOpsTask;
      error?: string;
    };

    if (!response.ok || !payload.task) {
      throw new Error(payload.error ?? "Unable to create task.");
    }

    setTasks((currentTasks) => [payload.task as DevOpsTask, ...currentTasks]);
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-panel backdrop-blur xl:p-8">
          <div className="bg-grid bg-[size:20px_20px]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  DevOps Resource Planner
                </span>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Track every DevOps task across projects in one calm, visual workspace.
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                    See who owns what, where delivery is healthy, and which timelines
                    need attention this week.
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

              <TaskForm onSubmit={handleCreateTask} assigneeOptions={assigneeOptions} />
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {errorMessage}
          </section>
        ) : null}

        <section className="rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-panel backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-fit rounded-2xl bg-slate-100 p-1">
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
              <select
                value={selectedProject}
                onChange={(event) => setSelectedProject(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                {projectOptions.map((project) => (
                  <option key={project}>{project}</option>
                ))}
              </select>

              <select
                value={selectedAssignee}
                onChange={(event) => setSelectedAssignee(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option>All assignees</option>
                {assigneeOptions.map((assignee) => (
                  <option key={assignee}>{assignee}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {isLoading ? (
          <section className="rounded-[28px] border border-white/70 bg-white/80 p-8 text-sm text-slate-500 shadow-panel backdrop-blur">
            Loading tasks...
          </section>
        ) : activeView === "board" ? (
          <section className="grid gap-4 xl:grid-cols-4">
            {groupedTasks.map(({ assignee, tasks: assigneeTasks }) => (
              <AssigneeColumn key={assignee} assignee={assignee} tasks={assigneeTasks} />
            ))}
          </section>
        ) : (
          <CalendarView tasks={filteredTasks} />
        )}
      </div>
    </main>
  );
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
    <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-3xl font-semibold text-slate-900">{value}</span>
        <span
          className={
            isBadgeTone
              ? `rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`
              : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
          }
        >
          Live
        </span>
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
      className={`rounded-[14px] px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-white hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}
