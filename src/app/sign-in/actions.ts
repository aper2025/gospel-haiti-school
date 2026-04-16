"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type AuthResult = {
  error?: string;
};

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "missing_fields" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "invalid_credentials" };
  }

  // Ensure a UserProfile exists for this auth user
  const existing = await prisma.userProfile.findUnique({
    where: { authUid: data.user.id },
  });

  if (!existing) {
    // First sign-in: create a profile. Role defaults to SUPPORT (lowest access)
    // until a Director/Admin assigns the correct role.
    await prisma.userProfile.create({
      data: {
        authUid: data.user.id,
        email: data.user.email!,
        role: "SUPPORT",
        lastSignedIn: new Date(),
      },
    });
  } else {
    await prisma.userProfile.update({
      where: { authUid: data.user.id },
      data: { lastSignedIn: new Date() },
    });
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
