"use client";

import { useActionState } from "react";
import { StaffForm } from "../../staff-form";
import { updateStaff } from "../../actions";
import type { Staff } from "@prisma/client";

export function EditStaffClient({ staff }: { staff: Staff }) {
  const [, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => updateStaff(staff.id, formData),
    null,
  );

  return <StaffForm action={formAction} staff={staff} isPending={isPending} />;
}
