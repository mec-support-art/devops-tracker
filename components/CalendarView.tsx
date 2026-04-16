"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  TASK_STATUS_STYLES,
  formatDateLabel,
  getTaskStatus,
  type DevOpsTask,
} from "@/lib/tasks";

type CalendarViewProps = {
  busyTaskIds?: number[];
  onEditTask: (task: DevOpsTask) => void;
  onMoveTask: (task: DevOpsTask, nextAssignee: string, nextStartDate: string) => Promise<void>;
  onResizeTask: (
    task: DevOpsTask,
    edge: "start" | "end",
    nextDate: string,
  ) => Promise<void>;
  tasks: DevOpsTask[];
};

type CalendarDay = {
  iso: string;
  weekday: string;
  dayOfMonth: string;
  monthLabel: string;
};

type InteractionState = {
  currentAssignee: string;
  edge?: "start" | "end";
  mode: "move" | "resize";
  moved: boolean;
  originAssignee: string;
  originClientX: number;
  originEndDate: string;
  originStartDate: string;
  task: DevOpsTask;
};

const DAY_WIDTH = 120;
const TRACK_HEIGHT = 58;
const ROW_PADDING = 16;
const CLICK_THRESHOLD = 6;

export function CalendarView({
  busyTaskIds = [],
  onEditTask,
  onMoveTask,
  onResizeTask,
  tasks,
}: CalendarViewProps) {
  const assignees = Array.from(new Set(tasks.map((task) => task.assignee))).sort((a, b) =>
    a.localeCompare(b),
  );

  const calendarDays = useMemo(() => getCalendarDays(tasks), [tasks]);
  const rowModels = useMemo(
    () =>
      assignees.map((assignee) => {
        const assigneeTasks = tasks.filter((task) => task.assignee === assignee);
        const tracks = buildTracks(assigneeTasks, calendarDays);

        return {
          assignee,
          tasks: assigneeTasks,
          tracks,
          rowHeight: Math.max(1, tracks.length) * TRACK_HEIGHT + ROW_PADDING * 2,
        };
      }),
    [assignees, calendarDays, tasks],
  );

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const activeDayIndex = useMemo(() => {
    if (!interaction) {
      return null;
    }

    if (interaction.mode === "move") {
      return calendarDays.findIndex((day) => day.iso === interaction.task.startDate);
    }

    return calendarDays.findIndex((day) =>
      day.iso === (interaction.edge === "start" ? interaction.task.startDate : interaction.task.endDate),
    );
  }, [calendarDays, interaction]);

  useEffect(() => {
    if (!interaction) {
      return;
    }

    const handlePointerMove = (event: MouseEvent) => {
      setInteraction((current) => {
        if (!current) {
          return null;
        }

        const deltaDays = Math.round((event.clientX - current.originClientX) / DAY_WIDTH);
        const hoveredAssignee = getHoveredAssignee(event.clientY, rowRefs.current);
        const nextAssignee = hoveredAssignee ?? current.currentAssignee;

        if (current.mode === "move") {
          return {
            ...current,
            currentAssignee: nextAssignee,
            moved:
              current.moved ||
              Math.abs(event.clientX - current.originClientX) > CLICK_THRESHOLD ||
              nextAssignee !== current.originAssignee,
            task: {
              ...current.task,
              assignee: nextAssignee,
              startDate: addDaysToIsoDate(current.originStartDate, deltaDays),
              endDate: addDaysToIsoDate(current.originEndDate, deltaDays),
            },
          };
        }

        const nextTask =
          current.edge === "start"
            ? {
                ...current.task,
                startDate: clampStartDate(
                  addDaysToIsoDate(current.originStartDate, deltaDays),
                  current.task.endDate,
                ),
              }
            : {
                ...current.task,
                endDate: clampEndDate(
                  addDaysToIsoDate(current.originEndDate, deltaDays),
                  current.task.startDate,
                ),
              };

        return {
          ...current,
          moved: current.moved || Math.abs(event.clientX - current.originClientX) > CLICK_THRESHOLD,
          task: nextTask,
        };
      });
    };

    const handlePointerUp = () => {
      setInteraction((current) => {
        if (!current) {
          return null;
        }

        if (!current.moved) {
          if (current.mode === "move") {
            onEditTask(current.task);
          }
          return null;
        }

        if (
          current.mode === "move" &&
          (current.task.startDate !== current.originStartDate ||
            current.task.assignee !== current.originAssignee)
        ) {
          void onMoveTask(current.task, current.task.assignee, current.task.startDate);
        }

        if (current.mode === "resize" && current.edge === "start") {
          if (current.task.startDate !== current.originStartDate) {
            void onResizeTask(current.task, "start", current.task.startDate);
          }
        }

        if (current.mode === "resize" && current.edge === "end") {
          if (current.task.endDate !== current.originEndDate) {
            void onResizeTask(current.task, "end", current.task.endDate);
          }
        }

        return null;
      });
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [interaction, onEditTask, onMoveTask, onResizeTask]);

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="flex flex-col gap-2 border-b border-slate-200/80 pb-4">
        <h2 className="text-xl font-semibold text-slate-900">Scrollable resource calendar</h2>
        <p className="text-sm text-slate-500">
          Drag the bar to shift the full task, drag the left or right handle to resize the
          timeline, and click a task to open the editor.
        </p>
      </div>

      <div className="mt-5 flex gap-4">
        <div className="w-[250px] shrink-0 space-y-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              DevOps resource
            </p>
            <p className="mt-2 text-sm text-slate-500">Click bars to edit. Drag edges to resize.</p>
          </div>

          {rowModels.length > 0 ? (
            rowModels.map((row) => (
              <div
                key={row.assignee}
                className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-4 shadow-sm"
                style={{ height: row.rowHeight }}
              >
                <p className="text-lg font-semibold text-slate-900">{row.assignee}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {row.tasks.length} {row.tasks.length === 1 ? "task" : "tasks"} scheduled
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              No tasks match the current filters.
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="min-w-max" style={{ width: calendarDays.length * DAY_WIDTH }}>
            <div
              className="grid overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100"
              style={{ gridTemplateColumns: `repeat(${calendarDays.length}, ${DAY_WIDTH}px)` }}
            >
              {calendarDays.map((day) => (
                <div
                  key={day.iso}
                  className={`border-r border-white/70 px-3 py-4 text-center last:border-r-0 ${
                    activeDayIndex !== null && calendarDays[activeDayIndex]?.iso === day.iso
                      ? "bg-sky-100"
                      : ""
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-700">{day.weekday}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {day.dayOfMonth}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">{day.monthLabel}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-3">
              {rowModels.map((row) => (
                <TimelineRow
                  key={row.assignee}
                  assignee={row.assignee}
                  busyTaskIds={busyTaskIds}
                  calendarDays={calendarDays}
                  interaction={interaction}
                  isActiveRow={interaction?.currentAssignee === row.assignee}
                  onBarPointerDown={(task, clientX) =>
                    setInteraction({
                      currentAssignee: task.assignee,
                      mode: "move",
                      moved: false,
                      originAssignee: task.assignee,
                      originClientX: clientX,
                      originEndDate: task.endDate,
                      originStartDate: task.startDate,
                      task,
                    })
                  }
                  onHandlePointerDown={(task, edge, clientX) =>
                    setInteraction({
                      currentAssignee: task.assignee,
                      edge,
                      mode: "resize",
                      moved: false,
                      originAssignee: task.assignee,
                      originClientX: clientX,
                      originEndDate: task.endDate,
                      originStartDate: task.startDate,
                      task,
                    })
                  }
                  registerRowRef={(node) => {
                    rowRefs.current[row.assignee] = node;
                  }}
                  rowHeight={row.rowHeight}
                  tasks={row.tasks}
                  tracks={row.tracks}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {interaction && activeDayIndex !== null ? (
        <div className="mt-4 flex items-center justify-end">
          <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
            {interaction.mode === "move"
              ? `Move to ${interaction.currentAssignee} • ${formatDateLabel(interaction.task.startDate)}`
              : `${
                  interaction.edge === "start" ? "Start" : "End"
                } snaps to ${formatDateLabel(
                  interaction.edge === "start"
                    ? interaction.task.startDate
                    : interaction.task.endDate,
                )}`}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TimelineRow({
  assignee,
  busyTaskIds,
  calendarDays,
  interaction,
  isActiveRow,
  onBarPointerDown,
  onHandlePointerDown,
  registerRowRef,
  rowHeight,
  tasks,
  tracks,
}: {
  assignee: string;
  busyTaskIds: number[];
  calendarDays: CalendarDay[];
  interaction: InteractionState | null;
  isActiveRow: boolean;
  onBarPointerDown: (task: DevOpsTask, clientX: number) => void;
  onHandlePointerDown: (task: DevOpsTask, edge: "start" | "end", clientX: number) => void;
  registerRowRef: (node: HTMLDivElement | null) => void;
  rowHeight: number;
  tasks: DevOpsTask[];
  tracks: DevOpsTask[][];
}) {
  return (
    <div
      ref={registerRowRef}
      className={`relative overflow-hidden rounded-[24px] border bg-white ${
        isActiveRow ? "border-sky-300 shadow-[0_0_0_1px_rgba(14,165,233,0.18)]" : "border-slate-200/80"
      }`}
      style={{ height: rowHeight }}
    >
      <div
        className="absolute inset-0 grid"
        style={{ gridTemplateColumns: `repeat(${calendarDays.length}, ${DAY_WIDTH}px)` }}
      >
        {calendarDays.map((day, index) => (
          <div
            key={`${assignee}-${day.iso}`}
            className={`border-r border-slate-100 last:border-r-0 ${
              interaction &&
              calendarDays[index] &&
              ((interaction.mode === "move" && interaction.task.startDate === day.iso) ||
                (interaction.mode === "resize" &&
                  interaction.edge === "start" &&
                  interaction.task.startDate === day.iso) ||
                (interaction.mode === "resize" &&
                  interaction.edge === "end" &&
                  interaction.task.endDate === day.iso))
                ? "bg-sky-50"
                : ""
            }`}
          />
        ))}
      </div>

      <div className="relative h-full">
        {interaction && isActiveRow ? (
          <SnapGuide
            calendarDays={calendarDays}
            interaction={interaction}
            rowHeight={rowHeight}
          />
        ) : null}

        {tracks.flatMap((track, trackIndex) =>
          track.map((task) => {
            const activeTask =
              interaction?.task.id === task.id && interaction.task.assignee === assignee
                ? interaction.task
                : task;

            const startIndex = calendarDays.findIndex((day) => day.iso === activeTask.startDate);
            const endIndex = calendarDays.findIndex((day) => day.iso === activeTask.endDate);

            if (startIndex === -1 || endIndex === -1) {
              return [];
            }

            const isInteracting = interaction?.task.id === task.id;
            const isGhostOnOtherRow =
              isInteracting && interaction?.task.assignee !== assignee && interaction?.mode === "move";

            if (isGhostOnOtherRow) {
              return [];
            }

            return (
              <TaskBar
                key={task.id}
                busy={busyTaskIds.includes(task.id)}
                dimmed={isInteracting && interaction?.moved}
                onBarPointerDown={onBarPointerDown}
                onHandlePointerDown={onHandlePointerDown}
                task={activeTask}
                trackIndex={trackIndex}
                width={(endIndex - startIndex + 1) * DAY_WIDTH}
                x={startIndex * DAY_WIDTH}
              />
            );
          }),
        )}

        {interaction?.mode === "move" && interaction.task.assignee === assignee ? (
          <PreviewBar calendarDays={calendarDays} task={interaction.task} />
        ) : null}
      </div>
    </div>
  );
}

function SnapGuide({
  calendarDays,
  interaction,
  rowHeight,
}: {
  calendarDays: CalendarDay[];
  interaction: InteractionState;
  rowHeight: number;
}) {
  const anchorDate =
    interaction.mode === "move"
      ? interaction.task.startDate
      : interaction.edge === "start"
        ? interaction.task.startDate
        : interaction.task.endDate;

  const index = calendarDays.findIndex((day) => day.iso === anchorDate);
  if (index === -1) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute top-0 z-0"
      style={{
        left: index * DAY_WIDTH,
        width: DAY_WIDTH,
        height: rowHeight,
      }}
    >
      <div className="mx-auto h-full w-px bg-sky-400/80" />
    </div>
  );
}

function TaskBar({
  busy,
  dimmed,
  onBarPointerDown,
  onHandlePointerDown,
  task,
  trackIndex,
  width,
  x,
}: {
  busy: boolean;
  dimmed: boolean;
  onBarPointerDown: (task: DevOpsTask, clientX: number) => void;
  onHandlePointerDown: (task: DevOpsTask, edge: "start" | "end", clientX: number) => void;
  task: DevOpsTask;
  trackIndex: number;
  width: number;
  x: number;
}) {
  const status = getTaskStatus(task);
  const statusStyle = TASK_STATUS_STYLES[status];

  return (
    <div
      className={`absolute flex items-center rounded-2xl border border-white/60 px-4 py-3 text-left shadow-sm transition ${
        statusStyle.badge
      } ${busy ? "cursor-not-allowed opacity-60" : "cursor-grab hover:-translate-y-0.5 active:cursor-grabbing"} ${
        dimmed ? "opacity-35" : ""
      }`}
      style={{
        left: x,
        top: ROW_PADDING + trackIndex * TRACK_HEIGHT,
        width,
        height: TRACK_HEIGHT - 10,
      }}
    >
      <ResizeHandle
        busy={busy}
        edge="start"
        onPointerDown={onHandlePointerDown}
        task={task}
      />

      <button
        type="button"
        disabled={busy}
        onMouseDown={(event) => {
          event.preventDefault();
          onBarPointerDown(task, event.clientX);
        }}
        className="min-w-0 flex-1 px-2 text-left"
        title={`${task.title}: ${formatDateLabel(task.startDate)} - ${formatDateLabel(task.endDate)}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{task.title}</p>
            <p className="mt-1 truncate text-[11px] opacity-80">{task.project}</p>
          </div>
          <span className="shrink-0 rounded-full bg-white/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
            {statusStyle.label}
          </span>
        </div>
      </button>

      <ResizeHandle
        busy={busy}
        edge="end"
        onPointerDown={onHandlePointerDown}
        task={task}
      />
    </div>
  );
}

function ResizeHandle({
  busy,
  edge,
  onPointerDown,
  task,
}: {
  busy: boolean;
  edge: "start" | "end";
  onPointerDown: (task: DevOpsTask, edge: "start" | "end", clientX: number) => void;
  task: DevOpsTask;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onPointerDown(task, edge, event.clientX);
      }}
      className={`flex h-full w-3 shrink-0 items-center justify-center rounded-full ${
        busy ? "cursor-not-allowed opacity-50" : "cursor-ew-resize hover:bg-white/60"
      }`}
      title={edge === "start" ? "Drag to change start date" : "Drag to change end date"}
    >
      <span className="h-7 w-1 rounded-full bg-slate-500/60" />
    </button>
  );
}

function PreviewBar({
  calendarDays,
  task,
}: {
  calendarDays: CalendarDay[];
  task: DevOpsTask;
}) {
  const startIndex = calendarDays.findIndex((day) => day.iso === task.startDate);
  const endIndex = calendarDays.findIndex((day) => day.iso === task.endDate);

  if (startIndex === -1 || endIndex === -1) {
    return null;
  }

  const status = getTaskStatus(task);
  const statusStyle = TASK_STATUS_STYLES[status];

  return (
    <div
      className={`pointer-events-none absolute rounded-2xl border border-dashed border-slate-400/50 px-4 py-3 opacity-25 ${statusStyle.badge}`}
      style={{
        left: startIndex * DAY_WIDTH,
        top: ROW_PADDING,
        width: (endIndex - startIndex + 1) * DAY_WIDTH,
        height: TRACK_HEIGHT - 10,
      }}
    />
  );
}

function getHoveredAssignee(
  clientY: number,
  rowRefs: Record<string, HTMLDivElement | null>,
) {
  return Object.entries(rowRefs).find(([, node]) => {
    if (!node) {
      return false;
    }

    const rect = node.getBoundingClientRect();
    return clientY >= rect.top && clientY <= rect.bottom;
  })?.[0];
}

function clampStartDate(nextStartDate: string, endDate: string) {
  return nextStartDate > endDate ? endDate : nextStartDate;
}

function clampEndDate(nextEndDate: string, startDate: string) {
  return nextEndDate < startDate ? startDate : nextEndDate;
}

function getCalendarDays(tasks: DevOpsTask[]): CalendarDay[] {
  if (tasks.length === 0) {
    const start = startOfWeek(new Date());
    return buildCalendarDays(start, addDays(start, 13));
  }

  const timestamps = tasks.flatMap((task) => [
    toDate(task.startDate).getTime(),
    toDate(task.endDate).getTime(),
  ]);

  const start = startOfWeek(addDays(new Date(Math.min(...timestamps)), -2));
  const end = addDays(new Date(Math.max(...timestamps)), 10);
  const totalDays = Math.max(14, differenceInDays(end, start) + 1);

  return buildCalendarDays(start, addDays(start, totalDays - 1));
}

function buildCalendarDays(start: Date, end: Date) {
  const days: CalendarDay[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    days.push({
      iso: toIsoDate(cursor),
      weekday: cursor.toLocaleDateString("en-US", { weekday: "short" }),
      dayOfMonth: cursor.toLocaleDateString("en-US", { day: "numeric" }),
      monthLabel: cursor.toLocaleDateString("en-US", { month: "short" }),
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function buildTracks(tasks: DevOpsTask[], calendarDays: CalendarDay[]) {
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.startDate === b.startDate) {
      return a.endDate.localeCompare(b.endDate);
    }

    return a.startDate.localeCompare(b.startDate);
  });

  const tracks: DevOpsTask[][] = [];

  sortedTasks.forEach((task) => {
    const startIndex = calendarDays.findIndex((day) => day.iso === task.startDate);

    const targetTrackIndex = tracks.findIndex((track) => {
      const lastTask = track[track.length - 1];
      const lastEndIndex = calendarDays.findIndex((day) => day.iso === lastTask.endDate);
      return startIndex > lastEndIndex;
    });

    if (targetTrackIndex === -1) {
      tracks.push([task]);
    } else {
      tracks[targetTrackIndex].push(task);
    }
  });

  return tracks;
}

function startOfWeek(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const day = normalized.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(normalized, offset);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDaysToIsoDate(isoDate: string, days: number) {
  return toIsoDate(addDays(toDate(isoDate), days));
}

function differenceInDays(later: Date, earlier: Date) {
  return Math.round(
    (toDate(toIsoDate(later)).getTime() - toDate(toIsoDate(earlier)).getTime()) /
      (24 * 60 * 60 * 1000),
  );
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
