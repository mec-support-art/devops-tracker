"use client";

import { useEffect, useState } from "react";

import {
  createEmptyTaskInput,
  isLeaveTask,
  type UpdateTaskInput,
} from "@/lib/tasks";

type TaskEditModalProps = {
  assigneeOptions: string[];
  mode?: "create" | "edit";
  initialTask?: Partial<UpdateTaskInput>;
  onClose: () => void;
  onDelete?: () => Promise<void>;
  onSubmit: (task: UpdateTaskInput) => Promise<void>;
  requesterOptions: string[];
};

export function TaskEditModal({
  assigneeOptions,
  initialTask,
  mode = "edit",
  onClose,
  onDelete,
  onSubmit,
  requesterOptions,
}: TaskEditModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [formData, setFormData] = useState<UpdateTaskInput>({
    ...createEmptyTaskInput(),
    completed: false,
    ...initialTask,
  });
  const isLeave = isLeaveTask(formData);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const updateField = (field: keyof UpdateTaskInput, value: string | string[] | boolean) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const addLabel = () => {
    const nextLabel = labelInput.trim();
    if (!nextLabel || formData.labels.includes(nextLabel)) {
      return;
    }

    updateField("labels", [...formData.labels, nextLabel]);
    setLabelInput("");
  };

  const removeLabel = (labelToRemove: string) => {
    updateField(
      "labels",
      formData.labels.filter((label) => label !== labelToRemove),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.assignee) {
      return;
    }

    if (formData.endDate < formData.startDate) {
      setSubmitError("End date must be the same as or later than the start date.");
      return;
    }

    try {
      setIsSaving(true);
      setSubmitError(null);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to update the task right now.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      setSubmitError(null);
      await onDelete();
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to delete this entry right now.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {mode === "create" ? "Create entry" : "Edit entry"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {mode === "create" ? "Schedule work or leave" : "Update assignment details"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <Field label="Entry Type">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => updateField("taskType", "task")}
                className={`rounded-md border px-4 py-3 text-left text-sm transition ${
                  !isLeave
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Task assignment
              </button>
              <button
                type="button"
                onClick={() => updateField("taskType", "leave")}
                className={`rounded-md border px-4 py-3 text-left text-sm transition ${
                  isLeave
                    ? "border-slate-900 bg-slate-100 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Mark resource absent
              </button>
            </div>
          </Field>

          {!isLeave ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Project Name">
                <input
                  required
                  value={formData.project}
                  onChange={(event) => updateField("project", event.target.value)}
                  className={inputStyles}
                />
              </Field>
              <Field label="Requester">
                <select
                  required
                  value={formData.requester}
                  onChange={(event) => updateField("requester", event.target.value)}
                  className={inputStyles}
                >
                  <option value="">Select requester</option>
                  {requesterOptions.map((requester) => (
                    <option key={requester} value={requester}>
                      {requester}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : null}

          <Field label={isLeave ? "Leave Title" : "Task Title"}>
            <input
              required={!isLeave}
              value={formData.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder={isLeave ? "On leave" : undefined}
              className={inputStyles}
            />
          </Field>

          <div className={`grid gap-4 ${isLeave ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
            <Field label="Assignee">
              <select
                required
                value={formData.assignee}
                onChange={(event) => updateField("assignee", event.target.value)}
                className={inputStyles}
              >
                <option value="">Select assignee</option>
                {assigneeOptions.map((assignee) => (
                  <option key={assignee} value={assignee}>
                    {assignee}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start Date">
              <input
                required
                type="date"
                value={formData.startDate}
                onChange={(event) => updateField("startDate", event.target.value)}
                className={inputStyles}
              />
            </Field>
            <Field label="End Date">
              <input
                required
                type="date"
                value={formData.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
                className={inputStyles}
              />
            </Field>
            {!isLeave ? (
              <Field label="Progress">
                <label className="flex h-[46px] items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3">
                  <input
                    type="checkbox"
                    checked={formData.completed}
                    onChange={(event) => updateField("completed", event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  />
                  <span className="text-sm text-slate-700">Completed</span>
                </label>
              </Field>
            ) : null}
          </div>

          {isLeave ? (
            <Field label="Reason">
              <textarea
                value={formData.leaveReason ?? ""}
                onChange={(event) => updateField("leaveReason", event.target.value)}
                rows={3}
                placeholder="Vacation, planned leave, sick day, or other note"
                className={`${inputStyles} resize-none`}
              />
            </Field>
          ) : (
            <Field label="Labels">
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={labelInput}
                    onChange={(event) => setLabelInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addLabel();
                      }
                    }}
                    placeholder="Add tag and press Enter"
                    className={`${inputStyles} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={addLabel}
                    className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Add label
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
        {formData.labels.length > 0 ? (
                    formData.labels.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => removeLabel(label)}
                        className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        {label} ×
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No labels added yet.</p>
                  )}
                </div>
              </div>
            </Field>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            {submitError ? (
              <p className="text-sm text-rose-600 sm:mr-auto">{submitError}</p>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            {mode === "edit" ? (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isSaving || isDeleting}
                className="rounded-md border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                {isDeleting ? "Deleting..." : isLeave ? "Delete leave" : "Delete task"}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              {isSaving ? "Saving..." : mode === "create" ? "Save entry" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputStyles =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400";
