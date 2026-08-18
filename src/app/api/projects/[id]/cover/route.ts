/**
 * POST /api/projects/[id]/cover
 * Uploads a cover image to Supabase Storage and saves the URL on the project.
 * Expects multipart/form-data with a "file" field.
 */
import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";

const BUCKET = "covers";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file") as File | null;
  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_SIZE) return Response.json({ error: "File too large (max 5 MB)" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type))
    return Response.json({ error: "Only JPEG, PNG, or WebP allowed" }, { status: 400 });

  const ext  = file.type.split("/")[1];
  const path = `${user.id}/${id}.${ext}`;

  const service = createServiceClient();
  const { error: uploadError } = await service.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("[cover] Upload failed:", uploadError);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: { publicUrl } } = service.storage.from(BUCKET).getPublicUrl(path);

  await supabase
    .from("projects")
    .update({ cover_image_url: publicUrl })
    .eq("id", id)
    .eq("user_id", user.id);

  return Response.json({ ok: true, url: publicUrl });
}
