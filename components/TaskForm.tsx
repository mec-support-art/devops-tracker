"use client";

import { useState } from "react";

import { type NewTaskInput } from "@/lib/tasks";

type TaskFormProps = {
  assigneeOptions: string[];
  onSubmit: (task: NewTaskInput) => Promise<void>;
};

const today = new Date().toISOString().slice(0, 10);

const initialFormState: NewTaskInput = {
  project: "",
  projectManager: "",
  title: "",
  assignee: "",
  startDate: today,
  endDate: today,
  labels: [],
};

export function TaskForm({ assigneeOptions, onSubmit }: TaskFormProps) {
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
    <div className="w-full max-w-xl rounded-[28px] border border-slate-200/80 bg-slate-950 p-1 shadow-card">
      <div className="rounded-[24px] bg-slate-900 p-5 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Create task</p>
            <h2 className="mt-2 text-xl font-semibold">Add a new DevOps assignment</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
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
              <Field label="Project Manager">
                <input
                  required
                  value={formData.projectManager}
                  onChange={(event) => updateField("projectManager", event.target.value)}
                  placeholder="Avery Stone"
                  className={inputStyles}
                />
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
                    className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
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
                        className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                      >
                        {label} ×
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No labels added yet.</p>
                  )}
                </div>
              </div>
            </Field>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
              {submitError ? (
                <p className="text-sm text-rose-300 sm:mr-auto">{submitError}</p>
              ) : null}
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                {isSaving ? "Saving..." : "Save task"}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-5 text-sm leading-6 text-slate-300">
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
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {children}
    </label>
  );
}

const inputStyles =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-white/30 focus:bg-white/10";
