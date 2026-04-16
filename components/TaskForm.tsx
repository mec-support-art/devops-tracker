"use client";

import { useState } from "react";

import { type NewTaskInput, type UpdateTaskInput } from "@/lib/tasks";

type TaskFormProps = {
  assigneeOptions: string[];
  requesterOptions: string[];
  onSubmit: (task: UpdateTaskInput) => Promise<void>;
};

const today = new Date().toISOString().slice(0, 10);

const initialFormState: NewTaskInput = {
  project: "",
  requester: "",
  title: "",
  assignee: "",
  startDate: today,
  endDate: today,
  labels: [],
};

export function TaskForm({ assigneeOptions, requesterOptions, onSubmit }: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [formData, setFormData] = useState<NewTaskInput>(initialFormState);

  const updateField = (field: keyof NewTaskInput, value: string | string[]) => {
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

  const resetForm = () => {
    setFormData(initialFormState);
    setLabelInput("");
    setIsOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.project || !formData.requester || !formData.title || !formData.assignee) {
      return;
    }

    if (formData.endDate < formData.startDate) {
      setSubmitError("End date must be the same as or later than the start date.");
      return;
    }

    try {
      setIsSaving(true);
      setSubmitError(null);
      await onSubmit({ ...formData, completed: false });
      resetForm();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save the task right now.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Create task</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Add a new DevOps assignment</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            {isOpen ? "Hide form" : "New task"}
          </button>
        </div>

        {isOpen ? (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Project Name">
                <input
                  required
                  value={formData.project}
                  onChange={(event) => updateField("project", event.target.value)}
                  placeholder="Platform Revamp"
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

            <Field label="Task Title">
              <input
                required
                value={formData.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Upgrade staging Helm chart"
                className={inputStyles}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
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

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
              {submitError ? (
                <p className="text-sm text-rose-600 sm:mr-auto">{submitError}</p>
              ) : null}
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {isSaving ? "Saving..." : "Save task"}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Open the form to add a task instantly. New assignments appear in the board and
            timeline views right away.
          </p>
        )}
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
