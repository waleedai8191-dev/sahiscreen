import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createSupabaseAdminClient();
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
