"use client";

import { useActionState } from "react";
import { StudentForm } from "../student-form";
import { createStudent } from "../actions";

type Props = {
  classes: { id: string; label: string }[];
};

export function NewStudentClient({ classes }: Props) {
  const [, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return createStudent(formData);
    },
    null,
  );

  return (
    <StudentForm action={formAction} classes={classes} isPending={isPending} />
  );
}
