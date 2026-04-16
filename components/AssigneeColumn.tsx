import { TaskCard } from "@/components/TaskCard";
import { type DevOpsTask } from "@/lib/tasks";

type AssigneeColumnProps = {
  assignee: string;
  busyTaskIds: number[];
  onDelete: (task: DevOpsTask) => Promise<void>;
  onEdit: (task: DevOpsTask) => void;
  onToggleCompleted: (task: DevOpsTask) => Promise<void>;
  tasks: DevOpsTask[];
};

export function AssigneeColumn({
  assignee,
  busyTaskIds,
  onDelete,
  onEdit,
  onToggleCompleted,
  tasks,
}: AssigneeColumnProps) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-panel backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{assignee}</h2>
          <p className="text-sm text-slate-500">Current DevOps assignments</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {tasks.length}
        </span>
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
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 p-5 text-sm leading-6 text-slate-500">
            No tasks match the current filters for this assignee.
          </div>
        )}
      </div>
    </section>
  );
}
