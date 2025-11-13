// app/api/alerts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function GET(req: NextRequest) {
  // Заменить на реальную авторизацию
  const user_id = "user_id_from_auth";
  const { data, error } = await supabase.from("alerts").select("*").eq("user_id", user_id);
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const user_id = "user_id_from_auth";
  const alert = { ...body, user_id };
  const { data, error } = await supabase.from("alerts").insert([alert]).select();
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}
