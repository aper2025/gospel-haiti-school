import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { GradebookView } from "./gradebook-view";

export default async function GradebookPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; subject?: string; week?: string }>;
}) {
  const user = await requireAuth();
  const t = await getTranslations();
  const params = await searchParams;

  const classes = await prisma.class.findMany({
    where: { excluded: false },
    orderBy: { orderIdx: "asc" },
    select: { id: true, label: true },
  });

  const selectedClassId = params.class || classes[0]?.id || null;
  const selectedSubject = params.subject || "";

  // Get students for selected class
  let students: { id: string; firstName: string; lastName: string }[] = [];
  if (selectedClassId) {
    students = await prisma.student.findMany({
      where: { currentClassId: selectedClassId, enrollmentStatus: "ACTIVE" },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    });
  }

  // Get recent evaluations for this class+subject
  let evaluations: {
    id: string;
    studentId: string;
    subject: string;
    type: string;
    scorePct: number;
    letter: string;
    group: string;
    date: Date;
    notes: string | null;
  }[] = [];

  if (selectedClassId && selectedSubject) {
    evaluations = await prisma.evaluation.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        subject: selectedSubject as never,
      },
      orderBy: { date: "desc" },
      take: 200,
      select: {
        id: true,
        studentId: true,
        subject: true,
        type: true,
        scorePct: true,
        letter: true,
        group: true,
        date: true,
        notes: true,
      },
    });
  }

  // Weekly group placements for current week
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() - diff);
  const weekStart = monday.toISOString().split("T")[0];

  let placements: {
    studentId: string;
    subject: string;
    avgScore: number;
    group: string;
  }[] = [];

  if (selectedClassId && selectedSubject) {
    placements = await prisma.weeklyGroupPlacement.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        subject: selectedSubject as never,
        weekStart: new Date(weekStart),
      },
      select: {
        studentId: true,
        subject: true,
        avgScore: true,
        group: true,
      },
    });
  }

  // Subject list from translations
  const subjects = [
    "LECTURE", "MATHEMATIQUES", "DICTEE_ORTHOGRAPHE", "CONJUGAISON_GRAMMAIRE",
    "SCIENCES", "BIOLOGIE", "PHYSIQUE", "HISTOIRE", "GEOGRAPHIE",
    "SCIENCES_SOCIALES", "ANGLAIS", "ESPAGNOL", "CREOLE", "MUSIQUE",
  ];

  const subjectLabels: Record<string, string> = {};
  for (const s of subjects) {
    subjectLabels[s] = t(`gradebook.subjects.${s}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        {t("nav.gradebook")}
      </h1>

      <GradebookView
        classes={classes}
        subjects={subjects}
        subjectLabels={subjectLabels}
        students={students}
        evaluations={evaluations.map((e) => ({
          ...e,
          date: e.date.toISOString().split("T")[0],
        }))}
        placements={placements}
        selectedClassId={selectedClassId}
        selectedSubject={selectedSubject}
        translations={{
          score: t("gradebook.score"),
          letterGrade: t("gradebook.letterGrade"),
          group: t("gradebook.group"),
          save: t("common.save"),
          loading: t("common.loading"),
          noData: t("common.noData"),
          add: t("common.add"),
          evalTypes: {
            PETITE_EVALUATION: t("gradebook.evaluationTypes.PETITE_EVALUATION"),
            GRANDE_EVALUATION: t("gradebook.evaluationTypes.GRANDE_EVALUATION"),
            DICTEE: t("gradebook.evaluationTypes.DICTEE"),
            EXAMEN: t("gradebook.evaluationTypes.EXAMEN"),
            AUTRE: t("gradebook.evaluationTypes.AUTRE"),
          },
          groups: {
            G1: t("gradebook.groups.G1"),
            G2: t("gradebook.groups.G2"),
            G3: t("gradebook.groups.G3"),
            G4: t("gradebook.groups.G4"),
          },
        }}
      />
    </div>
  );
}
