"use client";

import { useActionState } from "react";
import { StaffForm } from "../staff-form";
import { createStaff } from "../actions";

export function NewStaffClient() {
  const [, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => createStaff(formData),
    null,
  );

  return <StaffForm action={formAction} isPending={isPending} />;
}
