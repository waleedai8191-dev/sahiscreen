import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → send to login
  if (!user) redirect("/login");

  // Extract what was stored at signup — these are the REAL values
  const initialData = {
    fullName: user.user_metadata?.full_name ?? "",
    companyName: user.user_metadata?.company_name ?? "",
    email: user.email ?? "",
  };

  return <SettingsClient initialData={initialData} />;
}
