import { TASK_STATUS_STYLES, formatDateLabel, getTaskStatus, type DevOpsTask } from "@/lib/tasks";

type TaskCardProps = {
  task: DevOpsTask;
};

export function TaskCard({ task }: TaskCardProps) {
  const status = getTaskStatus(task);
  const statusStyle = TASK_STATUS_STYLES[status];

  return (
    <article className="group rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {task.project}
          </p>
          <h3 className="text-base font-semibold leading-6 text-slate-900">
            {task.title}
          </h3>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle.badge}`}>
          {statusStyle.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
        <InfoBlock label="Manager" value={task.projectManager} />
        <InfoBlock label="Assignee" value={task.assignee} />
        <InfoBlock label="Start" value={formatDateLabel(task.startDate)} />
        <InfoBlock label="End" value={formatDateLabel(task.endDate)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {task.labels.map((label) => (
          <span
            key={label}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
          >
            {label}
          </span>
        ))}
      </div>
    </article>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}
