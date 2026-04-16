import { TaskCard } from "@/components/TaskCard";
import { type DevOpsTask } from "@/lib/tasks";

type AssigneeColumnProps = {
  assignee: string;
  busyTaskIds: number[];
  onCreateLeave: () => void;
  onCreateTask: () => void;
  onDelete: (task: DevOpsTask) => Promise<void>;
  onEdit: (task: DevOpsTask) => void;
  onToggleCompleted: (task: DevOpsTask) => Promise<void>;
  tasks: DevOpsTask[];
};

export function AssigneeColumn({
  assignee,
  busyTaskIds,
  onCreateLeave,
  onCreateTask,
  onDelete,
  onEdit,
  onToggleCompleted,
  tasks,
}: AssigneeColumnProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{assignee}</h2>
          <p className="text-sm text-slate-500">Current DevOps assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-600">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCreateTask}
          className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
        >
          Add task
        </button>
        <button
          type="button"
          onClick={onCreateLeave}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Mark leave
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              isBusy={busyTaskIds.includes(task.id)}
              onDelete={onDelete}
              onEdit={onEdit}
              onToggleCompleted={onToggleCompleted}
              task={task}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
            No tasks match the current filters for this assignee.
          </div>
        )}
      </div>
    </section>
  );
}
