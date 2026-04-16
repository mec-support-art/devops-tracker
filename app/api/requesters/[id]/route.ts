import { NextResponse } from "next/server";

import { type PersonRecord, toPerson } from "@/lib/people";
import {
  ensurePersonIsUnused,
  normalizePersonName,
  renamePersonReferences,
} from "@/lib/people-server";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase";

function getPersonId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = getPersonId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Invalid person id." }, { status: 400 });
  }

  const body = (await request.json()) as { currentName?: string; name?: string };
  const currentName = normalizePersonName(body.currentName ?? "");
  const name = normalizePersonName(body.name ?? "");

  if (!currentName || !name) {
    return NextResponse.json(
      { error: "Current name and next name are required." },
      { status: 400 },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      person: { id, name },
      source: "local-fallback",
    });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("requesters")
      .update({ name })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await renamePersonReferences("requesters", currentName, name);

    return NextResponse.json({
      person: toPerson(data as PersonRecord),
      source: "supabase",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update requester.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = getPersonId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Invalid person id." }, { status: 400 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ success: true, source: "local-fallback" });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from("requesters")
      .select("name")
      .eq("id", id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    await ensurePersonIsUnused("requesters", existing.name);

    const { error } = await supabase.from("requesters").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, source: "supabase" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete requester.";

    return NextResponse.json(
      { error: message },
      { status: message.includes("active tasks") ? 409 : 500 },
    );
  }
}
