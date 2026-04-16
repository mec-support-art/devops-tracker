import { NextResponse } from "next/server";

import { initialTasks } from "@/lib/data";
import { type NewTaskInput, type TaskRecord, toTask, toTaskInsert } from "@/lib/tasks";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      tasks: initialTasks,
      source: "local-fallback",
    });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("start_date", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      tasks: (data ?? []).map((task) => toTask(task as TaskRecord)),
      source: "supabase",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load tasks from Supabase.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as NewTaskInput;

  if (!payload.project || !payload.projectManager || !payload.title || !payload.assignee) {
    return NextResponse.json(
      { error: "Project, manager, title, and assignee are required." },
      { status: 400 },
    );
  }

  if (payload.endDate < payload.startDate) {
    return NextResponse.json(
      { error: "End date must be the same as or later than the start date." },
      { status: 400 },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      task: {
        ...payload,
        id: Date.now(),
      },
      source: "local-fallback",
    });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("tasks")
      .insert(toTaskInsert(payload))
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      task: toTask(data as TaskRecord),
      source: "supabase",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create task in Supabase.",
      },
      { status: 500 },
    );
  }
}
