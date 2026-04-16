import { NextResponse } from "next/server";

import {
  normalizeTaskInput,
  type TaskRecord,
  toTask,
  toTaskUpdate,
  type UpdateTaskInput,
} from "@/lib/tasks";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase";

function getTaskId(value: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = getTaskId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
  }

  const body = (await request.json()) as Partial<UpdateTaskInput>;

  if (typeof body.completed !== "boolean") {
    return NextResponse.json(
      { error: "Completed state is required for task updates." },
      { status: 400 },
    );
  }

  const payload: UpdateTaskInput = normalizeTaskInput({
    project: body.project ?? "",
    projectManager: body.projectManager ?? "",
    title: body.title ?? "",
    assignee: body.assignee ?? "",
    startDate: body.startDate ?? "",
    endDate: body.endDate ?? "",
    labels: Array.isArray(body.labels) ? body.labels : [],
    completed: body.completed,
  });

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
    return NextResponse.json(
      { error: "Task updates require Supabase configuration." },
      { status: 501 },
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("tasks")
      .update(toTaskUpdate(payload))
      .eq("id", id)
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
          error instanceof Error ? error.message : "Unable to update task in Supabase.",
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
  const id = getTaskId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Task deletion requires Supabase configuration." },
      { status: 501 },
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      source: "supabase",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete task from Supabase.",
      },
      { status: 500 },
    );
  }
}
