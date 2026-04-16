import { NextResponse } from "next/server";

import {
  initialDevOpsResources,
  type PersonRecord,
  toPerson,
} from "@/lib/people";
import {
  buildFallbackPerson,
  normalizePersonName,
  type PeopleSource,
} from "@/lib/people-server";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      people: initialDevOpsResources,
      source: "local-fallback" satisfies PeopleSource,
    });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("devops_resources")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      people: (data ?? []).map((person) => toPerson(person as PersonRecord)),
      source: "supabase" satisfies PeopleSource,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load DevOps resources from Supabase.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string };
  const name = normalizePersonName(body.name ?? "");

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      person: buildFallbackPerson(Date.now(), name),
      source: "local-fallback" satisfies PeopleSource,
    });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("devops_resources")
      .insert({ name })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      person: toPerson(data as PersonRecord),
      source: "supabase" satisfies PeopleSource,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create DevOps resource.",
      },
      { status: 500 },
    );
  }
}
