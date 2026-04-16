import { type Person } from "@/lib/people";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase";

export type PeopleSource = "supabase" | "local-fallback";
export type PeopleCollection = "devops_resources" | "requesters";

const TASK_FIELD_BY_COLLECTION = {
  devops_resources: "assignee",
  requesters: "requester",
} as const;

export function normalizePersonName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function getTaskFieldForCollection(collection: PeopleCollection) {
  return TASK_FIELD_BY_COLLECTION[collection];
}

export async function renamePersonReferences(
  collection: PeopleCollection,
  currentName: string,
  nextName: string,
) {
  if (!hasSupabaseEnv() || currentName === nextName) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const taskField = getTaskFieldForCollection(collection);
  const { error } = await supabase
    .from("tasks")
    .update({ [taskField]: nextName })
    .eq(taskField, currentName);

  if (error) {
    throw error;
  }
}

export async function ensurePersonIsUnused(collection: PeopleCollection, name: string) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const taskField = getTaskFieldForCollection(collection);
  const { count, error } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq(taskField, name);

  if (error) {
    throw error;
  }

  if ((count ?? 0) > 0) {
    const label = collection === "devops_resources" ? "DevOps resource" : "requester";
    throw new Error(`${label} is still assigned to active tasks.`);
  }
}

export function buildFallbackPerson(id: number, name: string): Person {
  return { id, name };
}
