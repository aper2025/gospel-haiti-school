-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DIRECTOR', 'ADMIN', 'HOMEROOM_TEACHER', 'SUBJECT_TEACHER', 'ASSISTANT', 'SUPPORT');

-- CreateEnum
CREATE TYPE "ClassCode" AS ENUM ('KG2', 'KG3', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10');

-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('LECTURE', 'MATHEMATIQUES', 'DICTEE_ORTHOGRAPHE', 'CONJUGAISON_GRAMMAIRE', 'SCIENCES', 'BIOLOGIE', 'PHYSIQUE', 'HISTOIRE', 'GEOGRAPHIE', 'SCIENCES_SOCIALES', 'ANGLAIS', 'ESPAGNOL', 'CREOLE', 'MUSIQUE');

-- CreateEnum
CREATE TYPE "AttendanceCode" AS ENUM ('P', 'L_E', 'L_U', 'A_E', 'A_U');

-- CreateEnum
CREATE TYPE "BehaviorLevel" AS ENUM ('L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6');

-- CreateEnum
CREATE TYPE "GroupLevel" AS ENUM ('G1', 'G2', 'G3', 'G4');

-- CreateEnum
CREATE TYPE "LetterGrade" AS ENUM ('A', 'B', 'C', 'D', 'F');

-- CreateEnum
CREATE TYPE "EvaluationType" AS ENUM ('PETITE_EVALUATION', 'GRANDE_EVALUATION', 'DICTEE', 'EXAMEN', 'AUTRE');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'GRADUATED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "YesNo" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CHECK', 'TRANSFER', 'MONEY_ORDER', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID_IN_FULL', 'PARTIAL', 'UNPAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PerformanceStatus" AS ENUM ('STANDARD', 'NEEDS_SUPPORT', 'PROBATION');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('SICK', 'PERSONAL', 'FAMILY_EMERGENCY', 'PROFESSIONAL_DEVELOPMENT');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('PHONE', 'MEETING', 'WRITTEN_NOTE', 'OTHER');

-- CreateEnum
CREATE TYPE "TimeClockStatus" AS ENUM ('P', 'L_E', 'L_U', 'U', 'MISSING_SIGNOUT');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('STUDENT_ABSENT_3_DAYS', 'STUDENT_ATTENDANCE_BELOW_85', 'STUDENT_RETENTION_WATCH', 'STUDENT_BEHAVIOR_L4_PLUS', 'PAYMENT_OVERDUE_30_DAYS', 'TEACHER_PROBATION_NO_FOLLOWUP', 'STAFF_MISSING_SIGNOUT', 'STAFF_CHRONIC_LATENESS', 'TIMETABLE_CONFLICT');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "TrimestreNumber" AS ENUM ('T1', 'T2', 'T3');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('TRIMESTRE_START', 'TRIMESTRE_END', 'HOLIDAY', 'EXAM_WEEK', 'NO_SCHOOL', 'STAFF_MEETING', 'SPECIAL_EVENT');

-- CreateTable
CREATE TABLE "SchoolYear" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "code" "ClassCode" NOT NULL,
    "label" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "orderIdx" INTEGER NOT NULL,
    "excluded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "authUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "staffId" TEXT,
    "lastSignedIn" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT,
    "photoUrl" TEXT,
    "gender" "Gender",
    "dateOfBirth" DATE,
    "phone" TEXT,
    "addressVillage" TEXT,
    "addressNeighborhood" TEXT,
    "addressCommune" TEXT,
    "addressDepartment" TEXT,
    "email" TEXT,
    "role" "Role" NOT NULL,
    "contractType" "ContractType",
    "startDate" DATE,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "staffPin" TEXT,
    "performanceStatus" "PerformanceStatus" NOT NULL DEFAULT 'STANDARD',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAssignment" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subject" "Subject",
    "isHomeroom" BOOLEAN NOT NULL DEFAULT false,
    "yearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "schoolEmail" TEXT,
    "gender" "Gender",
    "dateOfBirth" DATE,
    "addressVillage" TEXT,
    "addressNeighborhood" TEXT,
    "addressCommune" TEXT,
    "addressDepartment" TEXT,
    "currentClassId" TEXT,
    "enrollmentDate" DATE,
    "enrollmentStatus" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "motherFirstName" TEXT,
    "motherLastName" TEXT,
    "motherAlive" "YesNo",
    "motherPhone" TEXT,
    "fatherFirstName" TEXT,
    "fatherLastName" TEXT,
    "fatherAlive" "YesNo",
    "fatherPhone" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "medicalNotes" TEXT,
    "birthCertOnFile" BOOLEAN NOT NULL DEFAULT false,
    "hasSiblingsAtSchool" BOOLEAN NOT NULL DEFAULT false,
    "generalNotes" TEXT,
    "currentBehaviorLevel" "BehaviorLevel" NOT NULL DEFAULT 'L0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiblingLink" (
    "id" TEXT NOT NULL,
    "studentAId" TEXT NOT NULL,
    "studentBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiblingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentEnrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "retained" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeRetention" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "yearLabel" TEXT NOT NULL,
    "classCode" "ClassCode" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeRetention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "childFirstName" TEXT NOT NULL,
    "childLastName" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "requestedClassId" TEXT,
    "academicYear" TEXT NOT NULL,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistVisit" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "visitDate" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "code" "AttendanceCode" NOT NULL,
    "notes" TEXT,
    "markedById" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientUuid" TEXT,
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "type" "EvaluationType" NOT NULL,
    "scorePct" DOUBLE PRECISION NOT NULL,
    "letter" "LetterGrade" NOT NULL,
    "group" "GroupLevel" NOT NULL,
    "date" DATE NOT NULL,
    "weekStart" DATE NOT NULL,
    "notes" TEXT,
    "enteredById" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientUuid" TEXT,
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyGroupPlacement" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "weekStart" DATE NOT NULL,
    "avgScore" DOUBLE PRECISION NOT NULL,
    "group" "GroupLevel" NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyGroupPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionWatch" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "startWeek" DATE NOT NULL,
    "consecutiveWks" INTEGER NOT NULL,
    "rootCause" TEXT,
    "actionPlan" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetentionWatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringAssignment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "teacherId" TEXT,
    "dayMonday" BOOLEAN NOT NULL DEFAULT false,
    "dayTuesday" BOOLEAN NOT NULL DEFAULT false,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutoringAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviorIncident" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "level" "BehaviorLevel" NOT NULL,
    "teacherId" TEXT NOT NULL,
    "resolution" TEXT,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BehaviorIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviorLevelChange" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromLevel" "BehaviorLevel" NOT NULL,
    "toLevel" "BehaviorLevel" NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehaviorLevelChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentContact" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "studentId" TEXT,
    "date" DATE NOT NULL,
    "method" "ContactMethod" NOT NULL,
    "contactedById" TEXT NOT NULL,
    "outcome" TEXT,
    "nextSteps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeSchedule" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "amountHtg" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeAccount" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "totalOwed" DECIMAL(12,2) NOT NULL,
    "totalPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "lastPayment" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amountHtg" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "receivedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "observerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "score" INTEGER,
    "strengths" TEXT,
    "improvements" TEXT,
    "actionPlan" TEXT,
    "followUpDate" DATE,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeClockEntry" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "signInAt" TIMESTAMP(3),
    "signOutAt" TIMESTAMP(3),
    "hoursWorked" DECIMAL(5,2),
    "recordedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeClockEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAttendance" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "TimeClockStatus" NOT NULL,
    "adminReview" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trimestre" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "number" "TrimestreNumber" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trimestre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCard" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "trimestreId" TEXT NOT NULL,
    "attendanceSummary" JSONB,
    "behaviorSummary" JSONB,
    "homeroomComment" TEXT,
    "cumulativeAvg" DOUBLE PRECISION,
    "pdfUrl" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCardEntry" (
    "id" TEXT NOT NULL,
    "reportCardId" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "trimestreAvg" DOUBLE PRECISION NOT NULL,
    "letter" "LetterGrade" NOT NULL,
    "group" "GroupLevel" NOT NULL,
    "teacherComment" TEXT,
    "conductMark" TEXT,
    "effortMark" TEXT,

    CONSTRAINT "ReportCardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT,
    "academicHistory" JSONB NOT NULL,
    "retentionNotes" TEXT,
    "pdfUrl" TEXT,
    "generatedById" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,
    "orderIdx" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableEntry" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "teacherId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolCalendarEvent" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "type" "CalendarEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyDataSubmission" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classCode" "ClassCode" NOT NULL,
    "yearId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "totalStudents" INTEGER NOT NULL,
    "group1Count" INTEGER NOT NULL,
    "group2Count" INTEGER NOT NULL,
    "group3Count" INTEGER NOT NULL,
    "group4Count" INTEGER NOT NULL,
    "group3And4Names" TEXT,
    "problematicSubjects" TEXT,
    "tutoringAssigned" TEXT,
    "rootCauseAnalysis" TEXT,
    "actionPlan" TEXT,
    "behaviorIssues" TEXT,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyDataSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "payload" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolYear_label_key" ON "SchoolYear"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Class_code_key" ON "Class"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_authUid_key" ON "UserProfile"("authUid");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_staffId_key" ON "UserProfile"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_legacyId_key" ON "Staff"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_staffPin_key" ON "Staff"("staffPin");

-- CreateIndex
CREATE INDEX "StaffAssignment_classId_yearId_idx" ON "StaffAssignment"("classId", "yearId");

-- CreateIndex
CREATE INDEX "StaffAssignment_staffId_yearId_idx" ON "StaffAssignment"("staffId", "yearId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAssignment_staffId_classId_subject_yearId_key" ON "StaffAssignment"("staffId", "classId", "subject", "yearId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_legacyId_key" ON "Student"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_schoolEmail_key" ON "Student"("schoolEmail");

-- CreateIndex
CREATE UNIQUE INDEX "SiblingLink_studentAId_studentBId_key" ON "SiblingLink"("studentAId", "studentBId");

-- CreateIndex
CREATE INDEX "StudentEnrollment_yearId_classId_idx" ON "StudentEnrollment"("yearId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentEnrollment_studentId_yearId_key" ON "StudentEnrollment"("studentId", "yearId");

-- CreateIndex
CREATE INDEX "WaitlistVisit_entryId_visitDate_idx" ON "WaitlistVisit"("entryId", "visitDate");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_clientUuid_key" ON "Attendance"("clientUuid");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_date_key" ON "Attendance"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_clientUuid_key" ON "Evaluation"("clientUuid");

-- CreateIndex
CREATE INDEX "Evaluation_studentId_subject_weekStart_idx" ON "Evaluation"("studentId", "subject", "weekStart");

-- CreateIndex
CREATE INDEX "Evaluation_date_idx" ON "Evaluation"("date");

-- CreateIndex
CREATE INDEX "WeeklyGroupPlacement_weekStart_group_idx" ON "WeeklyGroupPlacement"("weekStart", "group");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyGroupPlacement_studentId_subject_weekStart_key" ON "WeeklyGroupPlacement"("studentId", "subject", "weekStart");

-- CreateIndex
CREATE INDEX "RetentionWatch_studentId_resolvedAt_idx" ON "RetentionWatch"("studentId", "resolvedAt");

-- CreateIndex
CREATE INDEX "TutoringAssignment_studentId_startDate_idx" ON "TutoringAssignment"("studentId", "startDate");

-- CreateIndex
CREATE INDEX "BehaviorIncident_studentId_date_idx" ON "BehaviorIncident"("studentId", "date");

-- CreateIndex
CREATE INDEX "BehaviorIncident_level_date_idx" ON "BehaviorIncident"("level", "date");

-- CreateIndex
CREATE INDEX "BehaviorLevelChange_studentId_changedAt_idx" ON "BehaviorLevelChange"("studentId", "changedAt");

-- CreateIndex
CREATE INDEX "ParentContact_incidentId_idx" ON "ParentContact"("incidentId");

-- CreateIndex
CREATE INDEX "ParentContact_studentId_date_idx" ON "ParentContact"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "FeeSchedule_yearId_classId_key" ON "FeeSchedule"("yearId", "classId");

-- CreateIndex
CREATE INDEX "FeeAccount_status_idx" ON "FeeAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FeeAccount_studentId_yearId_key" ON "FeeAccount"("studentId", "yearId");

-- CreateIndex
CREATE INDEX "Payment_accountId_date_idx" ON "Payment"("accountId", "date");

-- CreateIndex
CREATE INDEX "Observation_staffId_date_idx" ON "Observation"("staffId", "date");

-- CreateIndex
CREATE INDEX "Observation_followUpDate_idx" ON "Observation"("followUpDate");

-- CreateIndex
CREATE INDEX "LeaveRequest_staffId_startDate_idx" ON "LeaveRequest"("staffId", "startDate");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- CreateIndex
CREATE INDEX "TimeClockEntry_date_idx" ON "TimeClockEntry"("date");

-- CreateIndex
CREATE UNIQUE INDEX "TimeClockEntry_staffId_date_key" ON "TimeClockEntry"("staffId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAttendance_staffId_date_key" ON "StaffAttendance"("staffId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Trimestre_yearId_number_key" ON "Trimestre"("yearId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCard_studentId_trimestreId_key" ON "ReportCard"("studentId", "trimestreId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCardEntry_reportCardId_subject_key" ON "ReportCardEntry"("reportCardId", "subject");

-- CreateIndex
CREATE INDEX "Transcript_studentId_idx" ON "Transcript"("studentId");

-- CreateIndex
CREATE INDEX "TimeSlot_dayOfWeek_idx" ON "TimeSlot"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_dayOfWeek_orderIdx_key" ON "TimeSlot"("dayOfWeek", "orderIdx");

-- CreateIndex
CREATE INDEX "TimetableEntry_teacherId_yearId_idx" ON "TimetableEntry"("teacherId", "yearId");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableEntry_classId_timeSlotId_yearId_key" ON "TimetableEntry"("classId", "timeSlotId", "yearId");

-- CreateIndex
CREATE INDEX "SchoolCalendarEvent_yearId_startDate_idx" ON "SchoolCalendarEvent"("yearId", "startDate");

-- CreateIndex
CREATE INDEX "WeeklyDataSubmission_weekStart_classCode_idx" ON "WeeklyDataSubmission"("weekStart", "classCode");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyDataSubmission_teacherId_classCode_weekStart_key" ON "WeeklyDataSubmission"("teacherId", "classCode", "weekStart");

-- CreateIndex
CREATE INDEX "Notification_recipientId_readAt_idx" ON "Notification"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_kind_createdAt_idx" ON "Notification"("kind", "createdAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_currentClassId_fkey" FOREIGN KEY ("currentClassId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiblingLink" ADD CONSTRAINT "SiblingLink_studentAId_fkey" FOREIGN KEY ("studentAId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiblingLink" ADD CONSTRAINT "SiblingLink_studentBId_fkey" FOREIGN KEY ("studentBId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeRetention" ADD CONSTRAINT "GradeRetention_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_requestedClassId_fkey" FOREIGN KEY ("requestedClassId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistVisit" ADD CONSTRAINT "WaitlistVisit_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "WaitlistEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyGroupPlacement" ADD CONSTRAINT "WeeklyGroupPlacement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionWatch" ADD CONSTRAINT "RetentionWatch_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringAssignment" ADD CONSTRAINT "TutoringAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorIncident" ADD CONSTRAINT "BehaviorIncident_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorIncident" ADD CONSTRAINT "BehaviorIncident_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorLevelChange" ADD CONSTRAINT "BehaviorLevelChange_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentContact" ADD CONSTRAINT "ParentContact_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "BehaviorIncident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentContact" ADD CONSTRAINT "ParentContact_contactedById_fkey" FOREIGN KEY ("contactedById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeSchedule" ADD CONSTRAINT "FeeSchedule_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeSchedule" ADD CONSTRAINT "FeeSchedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAccount" ADD CONSTRAINT "FeeAccount_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAccount" ADD CONSTRAINT "FeeAccount_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FeeAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_observerId_fkey" FOREIGN KEY ("observerId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeClockEntry" ADD CONSTRAINT "TimeClockEntry_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trimestre" ADD CONSTRAINT "Trimestre_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_trimestreId_fkey" FOREIGN KEY ("trimestreId") REFERENCES "Trimestre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardEntry" ADD CONSTRAINT "ReportCardEntry_reportCardId_fkey" FOREIGN KEY ("reportCardId") REFERENCES "ReportCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolCalendarEvent" ADD CONSTRAINT "SchoolCalendarEvent_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyDataSubmission" ADD CONSTRAINT "WeeklyDataSubmission_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyDataSubmission" ADD CONSTRAINT "WeeklyDataSubmission_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
