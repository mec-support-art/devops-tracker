import {
  TASK_STATUS_STYLES,
  formatDateLabel,
  getTaskStatus,
  getWeekDays,
  isTaskOnDate,
  type DevOpsTask,
} from "@/lib/tasks";

type CalendarViewProps = {
  tasks: DevOpsTask[];
};

export function CalendarView({ tasks }: CalendarViewProps) {
  const weekDays = getWeekDays();
  const sortedTasks = [...tasks].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-panel backdrop-blur sm:p-5">
      <div className="flex flex-col gap-2 border-b border-slate-200/80 pb-4">
        <h2 className="text-xl font-semibold text-slate-900">Weekly timeline</h2>
        <p className="text-sm text-slate-500">
          Workloads are mapped across the current week so you can spot overlap, carryover,
          and delayed items at a glance.
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[260px_repeat(7,minmax(92px,1fr))] gap-3">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Task
            </div>
            {weekDays.map((day) => (
              <div
                key={day.iso}
                className="rounded-2xl bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-700"
              >
                <p>{day.label}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{day.shortDate}</p>
              </div>
            ))}

            {sortedTasks.length > 0 ? (
              sortedTasks.map((task) => {
                const status = getTaskStatus(task);
                const statusStyle = TASK_STATUS_STYLES[status];

                return (
                  <TimelineRow
                    key={task.id}
                    task={task}
                    weekDays={weekDays.map((day) => day.iso)}
                    statusStyle={statusStyle}
                  />
                );
              })
            ) : (
              <div className="col-span-8 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No tasks match the current filters for this week.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineRow({
  task,
  weekDays,
  statusStyle,
}: {
  task: DevOpsTask;
  weekDays: string[];
  statusStyle: { bar: string; badge: string; label: string };
}) {
  return (
    <>
      <div className="rounded-[24px] border border-slate-200/80 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{task.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              {task.project} • {task.assignee}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle.badge}`}>
            {statusStyle.label}
          </span>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {formatDateLabel(task.startDate)} - {formatDateLabel(task.endDate)}
        </p>
      </div>

      {weekDays.map((date) => {
        const active = isTaskOnDate(task, date);

        return (
          <div
            key={`${task.id}-${date}`}
            className="flex items-center rounded-[24px] border border-slate-200/80 bg-white px-2 py-3"
          >
            <div
              className={`h-10 w-full rounded-2xl transition ${
                active ? statusStyle.bar : "bg-slate-100"
              }`}
              title={
                active
                  ? `${task.title} scheduled on ${formatDateLabel(date)}`
                  : `${task.title} not scheduled on ${formatDateLabel(date)}`
              }
            />
          </div>
        );
      })}
    </>
  );
}
