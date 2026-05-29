"use client";

import { createContext, useContext } from "react";
import type { UserProfile, SubscriptionStatus } from "@/lib/supabase/types";

interface UserContextType {
  profile: UserProfile | null;
  company: { id: string; name: string } | null;
  subscription: SubscriptionStatus | null;
}

const UserContext = createContext<UserContextType>({
  profile: null,
  company: null,
  subscription: null,
});

export function UserProvider({
  children,
  profile,
  company,
  subscription,
}: UserContextType & { children: React.ReactNode }) {
  return (
    <UserContext.Provider value={{ profile, company, subscription }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
