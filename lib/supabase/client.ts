import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient(temporary = false) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

    {
      auth: {
        // persistSession: false means session lives only in memory
        // tab closes → session gone
        persistSession: !temporary,
        storage: temporary ? undefined : globalThis.localStorage,
      },
    },
  );
}
