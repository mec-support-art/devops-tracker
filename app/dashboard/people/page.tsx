"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PeopleManager } from "@/components/PeopleManager";
import { initialDevOpsResources, initialRequesters, type Person } from "@/lib/people";

export default function PeopleSettingsPage() {
  const [devopsResources, setDevopsResources] = useState<Person[]>(initialDevOpsResources);
  const [requesters, setRequesters] = useState<Person[]>(initialRequesters);
  const [isLoading, setIsLoading] = useState(true);
  const [isManagingPeople, setIsManagingPeople] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadPeople() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [resourcesResponse, requestersResponse] = await Promise.all([
          fetch("/api/devops-resources", { cache: "no-store" }),
          fetch("/api/requesters", { cache: "no-store" }),
        ]);

        const resourcesPayload = (await resourcesResponse.json()) as {
          people?: Person[];
          error?: string;
        };
        const requestersPayload = (await requestersResponse.json()) as {
          people?: Person[];
          error?: string;
        };

        if (!resourcesResponse.ok) {
          throw new Error(resourcesPayload.error ?? "Unable to load DevOps resources.");
        }

        if (!requestersResponse.ok) {
          throw new Error(requestersPayload.error ?? "Unable to load requesters.");
        }

        if (!ignore) {
          setDevopsResources(resourcesPayload.people ?? []);
          setRequesters(requestersPayload.people ?? []);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load people.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadPeople();

    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(
    () => [
      { label: "DevOps resources", value: devopsResources.length, tone: "bg-emerald-50 text-emerald-700" },
      { label: "Requesters", value: requesters.length, tone: "bg-sky-50 text-sky-700" },
    ],
    [devopsResources.length, requesters.length],
  );

  const handleCreatePerson = async (
    endpoint: "/api/devops-resources" | "/api/requesters",
    name: string,
    onSuccess: (person: Person) => void,
  ) => {
    setErrorMessage(null);
    setIsManagingPeople(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const payload = (await response.json()) as { person?: Person; error?: string };
      if (!response.ok || !payload.person) {
        throw new Error(payload.error ?? "Unable to create entry.");
      }

      onSuccess(payload.person);
    } finally {
      setIsManagingPeople(false);
    }
  };

  const handleUpdatePerson = async (
    endpoint: "/api/devops-resources" | "/api/requesters",
    person: Person,
    nextName: string,
    onSuccess: (updatedPerson: Person) => void,
  ) => {
    setErrorMessage(null);
    setIsManagingPeople(true);

    try {
      const response = await fetch(`${endpoint}/${person.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentName: person.name,
          name: nextName,
        }),
      });

      const payload = (await response.json()) as { person?: Person; error?: string };
      if (!response.ok || !payload.person) {
        throw new Error(payload.error ?? "Unable to update entry.");
      }

      onSuccess(payload.person);
    } finally {
      setIsManagingPeople(false);
    }
  };

  const handleDeletePerson = async (
    endpoint: "/api/devops-resources" | "/api/requesters",
    person: Person,
    onSuccess: () => void,
  ) => {
    setErrorMessage(null);
    setIsManagingPeople(true);

    try {
      const response = await fetch(`${endpoint}/${person.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Unable to delete entry.");
      }

      onSuccess();
    } finally {
      setIsManagingPeople(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm xl:p-7">
          <div className="bg-grid bg-[size:20px_20px]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  People Settings
                </span>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Manage the people behind every task lane and requester list.
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                    Keep DevOps resources and requesters clean, current, and ready for task
                    planning across the dashboard.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 shadow-sm"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-3xl font-semibold text-slate-900">{stat.value}</span>
                        <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${stat.tone}`}>
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {errorMessage}
          </section>
        ) : null}

        {isLoading ? (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading people settings...
          </section>
        ) : (
          <PeopleManager
            devopsResources={devopsResources}
            isBusy={isManagingPeople}
            onCreateDevOpsResource={(name) =>
              handleCreatePerson("/api/devops-resources", name, (person) => {
                setDevopsResources((current) => sortPeople([...current, person]));
              })
            }
            onCreateRequester={(name) =>
              handleCreatePerson("/api/requesters", name, (person) => {
                setRequesters((current) => sortPeople([...current, person]));
              })
            }
            onDeleteDevOpsResource={(person) =>
              handleDeletePerson("/api/devops-resources", person, () => {
                setDevopsResources((current) => current.filter((item) => item.id !== person.id));
              })
            }
            onDeleteRequester={(person) =>
              handleDeletePerson("/api/requesters", person, () => {
                setRequesters((current) => current.filter((item) => item.id !== person.id));
              })
            }
            onUpdateDevOpsResource={(person, nextName) =>
              handleUpdatePerson("/api/devops-resources", person, nextName, (updatedPerson) => {
                setDevopsResources((current) =>
                  sortPeople(
                    current.map((item) => (item.id === updatedPerson.id ? updatedPerson : item)),
                  ),
                );
              })
            }
            onUpdateRequester={(person, nextName) =>
              handleUpdatePerson("/api/requesters", person, nextName, (updatedPerson) => {
                setRequesters((current) =>
                  sortPeople(
                    current.map((item) => (item.id === updatedPerson.id ? updatedPerson : item)),
                  ),
                );
              })
            }
            requesters={requesters}
          />
        )}
      </div>
    </main>
  );
}

function sortPeople(people: Person[]) {
  return [...people].sort((a, b) => a.name.localeCompare(b.name));
}
