"use client";

import { useState } from "react";

import { type Person } from "@/lib/people";

type PeopleManagerProps = {
  devopsResources: Person[];
  isBusy?: boolean;
  onCreateDevOpsResource: (name: string) => Promise<void>;
  onCreateRequester: (name: string) => Promise<void>;
  onDeleteDevOpsResource: (person: Person) => Promise<void>;
  onDeleteRequester: (person: Person) => Promise<void>;
  onUpdateDevOpsResource: (person: Person, nextName: string) => Promise<void>;
  onUpdateRequester: (person: Person, nextName: string) => Promise<void>;
  requesters: Person[];
};

export function PeopleManager({
  devopsResources,
  isBusy = false,
  onCreateDevOpsResource,
  onCreateRequester,
  onDeleteDevOpsResource,
  onDeleteRequester,
  onUpdateDevOpsResource,
  onUpdateRequester,
  requesters,
}: PeopleManagerProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-2 border-b border-slate-200/80 pb-4">
        <h2 className="text-xl font-semibold text-slate-900">People settings</h2>
        <p className="text-sm text-slate-500">
          Add, rename, or remove DevOps resources and requesters without leaving the planner.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <PeopleList
          description="These names define the swimlanes and assignee dropdowns."
          emptyState="No DevOps resources yet."
          isBusy={isBusy}
          items={devopsResources}
          onCreate={onCreateDevOpsResource}
          onDelete={onDeleteDevOpsResource}
          onUpdate={onUpdateDevOpsResource}
          title="DevOps resources"
        />
        <PeopleList
          description="These names appear in requester fields across task forms."
          emptyState="No requesters yet."
          isBusy={isBusy}
          items={requesters}
          onCreate={onCreateRequester}
          onDelete={onDeleteRequester}
          onUpdate={onUpdateRequester}
          title="Requesters"
        />
      </div>
    </section>
  );
}

type PeopleListProps = {
  description: string;
  emptyState: string;
  isBusy: boolean;
  items: Person[];
  onCreate: (name: string) => Promise<void>;
  onDelete: (person: Person) => Promise<void>;
  onUpdate: (person: Person, nextName: string) => Promise<void>;
  title: string;
};

function PeopleList({
  description,
  emptyState,
  isBusy,
  items,
  onCreate,
  onDelete,
  onUpdate,
  title,
}: PeopleListProps) {
  const [draftName, setDraftName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startEdit = (person: Person) => {
    setEditingId(person.id);
    setEditingName(person.name);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setError(null);
  };

  const handleCreate = async () => {
    if (!draftName.trim()) {
      return;
    }

    try {
      setError(null);
      await onCreate(draftName);
      setDraftName("");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create entry.");
    }
  };

  const handleUpdate = async (person: Person) => {
    if (!editingName.trim()) {
      return;
    }

    try {
      setError(null);
      await onUpdate(person, editingName);
      cancelEdit();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update entry.");
    }
  };

  const handleDelete = async (person: Person) => {
    const confirmed = window.confirm(`Delete "${person.name}" from ${title.toLowerCase()}?`);
    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      await onDelete(person);
      if (editingId === person.id) {
        cancelEdit();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete entry.");
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <div className="mt-4 flex gap-3">
        <input
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          placeholder={`Add ${title === "Requesters" ? "requester" : "resource"}`}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
        />
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={isBusy}
          className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((person) => {
            const isEditing = editingId === person.id;

            return (
              <div
                key={person.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center"
              >
                {isEditing ? (
                  <input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                ) : (
                  <p className="flex-1 text-sm font-medium text-slate-800">{person.name}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleUpdate(person)}
                        disabled={isBusy}
                        className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isBusy}
                        className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(person)}
                      disabled={isBusy}
                      className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDelete(person)}
                    disabled={isBusy}
                    className="rounded-md border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
            {emptyState}
          </div>
        )}
      </div>
    </div>
  );
}
