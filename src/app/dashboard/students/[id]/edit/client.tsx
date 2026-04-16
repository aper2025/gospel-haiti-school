"use client";

import { useActionState } from "react";
import { StudentForm } from "../../student-form";
import { updateStudent } from "../../actions";
import type { Student, Class } from "@prisma/client";

type Props = {
  student: Student & { currentClass: Class | null };
  classes: { id: string; label: string }[];
};

export function EditStudentClient({ student, classes }: Props) {
  const [, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return updateStudent(student.id, formData);
    },
    null,
  );

  return (
    <StudentForm
      action={formAction}
      classes={classes}
      student={student}
      isPending={isPending}
    />
  );
}
