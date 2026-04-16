"use client";

import { useEffect, useState } from "react";

import {
  assigneeOptions,
  createEmptyTaskInput,
  type DevOpsTask,
  type NewTaskInput,
  type UpdateTaskInput,
} from "@/lib/tasks";

type TaskEditModalProps = {
  onClose: () => void;
  onSubmit: (task: UpdateTaskInput) => Promise<void>;
  task: DevOpsTask;
};

export function TaskEditModal({ onClose, onSubmit, task }: TaskEditModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [formData, setFormData] = useState<UpdateTaskInput>({
    ...createEmptyTaskInput(),
    ...task,
    completed: task.completed ?? false,
  });

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

    if (!formData.project || !formData.projectManager || !formData.title || !formData.assignee) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/70 bg-white p-6 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Edit task
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Update assignment details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Project Name">
              <input
                required
                value={formData.project}
                onChange={(event) => updateField("project", event.target.value)}
                className={inputStyles}
              />
            </Field>
            <Field label="Project Manager">
              <input
                required
                value={formData.projectManager}
                onChange={(event) => updateField("projectManager", event.target.value)}
                className={inputStyles}
              />
            </Field>
          </div>

          <Field label="Task Title">
            <input
              required
              value={formData.title}
              onChange={(event) => updateField("title", event.target.value)}
              className={inputStyles}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-4">
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
            <Field label="Progress">
              <label className="flex h-[52px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <input
                  type="checkbox"
                  checked={formData.completed}
                  onChange={(event) => updateField("completed", event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
                <span className="text-sm text-slate-700">Completed</span>
              </label>
            </Field>
          </div>

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
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
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
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
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

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            {submitError ? (
              <p className="text-sm text-rose-600 sm:mr-auto">{submitError}</p>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              {isSaving ? "Saving..." : "Save changes"}
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
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400";
