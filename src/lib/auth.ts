import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string; // UserProfile.id
  authUid: string; // Supabase Auth uid
  email: string;
  role: Role;
  staffId: string | null;
  active: boolean;
};

/**
 * Get the current user's session + profile. Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await prisma.userProfile.findUnique({
    where: { authUid: user.id },
    select: {
      id: true,
      authUid: true,
      email: true,
      role: true,
      staffId: true,
      active: true,
    },
  });

  if (!profile || !profile.active) return null;

  return profile;
}

/**
 * Require an authenticated user. Redirects to /sign-in if not logged in.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/**
 * Require one of the specified roles. Redirects to /dashboard if unauthorized.
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

/**
 * Check if a user has one of the specified roles.
 */
export function hasRole(user: SessionUser, ...roles: Role[]): boolean {
  return roles.includes(user.role);
}
