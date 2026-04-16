/**
 * Migrate data from legacy MySQL dump (school_data_backup.sql) into the new
 * Prisma/Supabase database. Run with: npx tsx scripts/migrate-legacy.ts
 */

import { PrismaClient, type Role } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

const DUMP_PATH =
  process.env.DUMP_PATH ||
  `${process.env.HOME}/Downloads/Gospel Haiti/school-management-system/school_data_backup.sql`;

// Map legacy grade labels → ClassCode
const GRADE_MAP: Record<string, string> = {
  "Maternelle 2": "KG2",
  "Maternelle 3": "KG3",
  "1ère": "F1",
  "2ème": "F2",
  "3ème": "F3",
  "4ème": "F4",
  "5ème": "F5",
  "6ème": "F6",
  "7ème": "F7",
  "8ème": "F8",
  "9ème": "F9",
  "10ème": "F10",
};

// Map legacy role → our Role enum
const ROLE_MAP: Record<string, Role> = {
  teacher: "HOMEROOM_TEACHER",
  administrator: "ADMIN",
  other: "SUPPORT",
};

function extractInsert(sql: string, table: string): string | null {
  const re = new RegExp(`INSERT INTO \`${table}\` VALUES (.+?);`, "s");
  const m = sql.match(re);
  return m ? m[1] : null;
}

function parseStaffRows(valuesStr: string) {
  const re =
    /\('([^']*)','([^']*)','([^']*)','([^']*)','([^']*)','([^']*)','([^']*)','([^']*)'\)/g;
  const rows: {
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    active: string;
    createdAt: string;
    pin: string;
  }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(valuesStr))) {
    rows.push({
      id: m[1],
      name: m[2],
      role: m[3],
      email: m[4],
      phone: m[5],
      active: m[6],
      createdAt: m[7],
      pin: m[8],
    });
  }
  return rows;
}

function parseStudentRows(valuesStr: string) {
  // Students table has many nullable fields; parse with a more flexible approach
  const rows: {
    id: string;
    firstName: string;
    lastName: string;
    gradeLevel: string;
    schoolYear: string;
    gender: string;
    birthDate: string;
    residence: string;
    contactPhone: string;
  }[] = [];

  // Split on ),( pattern
  const chunks = valuesStr.split(/\),\s*\(/);
  for (let chunk of chunks) {
    chunk = chunk.replace(/^\(/, "").replace(/\)$/, "");
    // Extract fields — values are quoted with ' or NULL
    const fields: string[] = [];
    let i = 0;
    while (i < chunk.length) {
      if (chunk[i] === "'") {
        // Quoted string
        let end = i + 1;
        while (end < chunk.length) {
          if (chunk[end] === "'" && chunk[end - 1] !== "\\") {
            // Check for escaped quotes
            if (end + 1 < chunk.length && chunk[end + 1] === "'") {
              end += 2;
              continue;
            }
            break;
          }
          end++;
        }
        fields.push(chunk.slice(i + 1, end).replace(/''/g, "'"));
        i = end + 1;
        // Skip comma
        if (i < chunk.length && chunk[i] === ",") i++;
      } else if (chunk.startsWith("NULL", i)) {
        fields.push("");
        i += 4;
        if (i < chunk.length && chunk[i] === ",") i++;
      } else {
        // Skip whitespace/comma
        i++;
      }
    }

    if (fields.length >= 5) {
      rows.push({
        id: fields[0] || "",
        firstName: fields[1] || "",
        lastName: fields[2] || "",
        gradeLevel: fields[3] || "",
        schoolYear: fields[4] || "",
        gender: fields[5] || "",
        birthDate: fields[6] || "",
        residence: fields[7] || "",
        contactPhone: fields[8] || "",
      });
    }
  }
  return rows;
}

async function main() {
  console.log("Reading legacy dump:", DUMP_PATH);
  const sql = fs.readFileSync(DUMP_PATH, "utf-8");

  // Ensure school year and classes exist
  const activeYear = await prisma.schoolYear.findFirst({
    where: { isActive: true },
  });
  if (!activeYear) {
    console.error("No active school year. Run seed first.");
    process.exit(1);
  }

  const classMap = new Map<string, string>();
  const allClasses = await prisma.class.findMany();
  for (const c of allClasses) {
    classMap.set(c.code, c.id);
  }

  // ── Migrate staff ──
  const staffValues = extractInsert(sql, "staff_members");
  if (staffValues) {
    const staffRows = parseStaffRows(staffValues);
    console.log(`\nMigrating ${staffRows.length} staff members...`);

    for (const row of staffRows) {
      const nameParts = row.name.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");
      const role = ROLE_MAP[row.role] || "SUPPORT";

      const existing = await prisma.staff.findUnique({
        where: { legacyId: row.id },
      });
      if (existing) {
        console.log(`  Skip (exists): ${row.name}`);
        continue;
      }

      await prisma.staff.create({
        data: {
          legacyId: row.id,
          firstName,
          lastName,
          displayName: row.name,
          email: row.email || null,
          phone: row.phone || null,
          role,
          staffPin: row.pin || null,
          active: row.active === "yes",
        },
      });
      console.log(`  + ${row.name} (${role})`);
    }
  }

  // ── Migrate students ──
  const studentValues = extractInsert(sql, "students");
  if (studentValues) {
    const studentRows = parseStudentRows(studentValues);
    console.log(`\nMigrating ${studentRows.length} students...`);

    let imported = 0;
    let skipped = 0;

    for (const row of studentRows) {
      if (!row.firstName && !row.lastName) {
        skipped++;
        continue;
      }

      const existing = await prisma.student.findUnique({
        where: { legacyId: row.id },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const classCode = GRADE_MAP[row.gradeLevel];
      const classId = classCode ? classMap.get(classCode) : null;

      // Generate school email
      const first = (row.firstName || "x").charAt(0).toLowerCase();
      const last = (row.lastName || "unknown").toLowerCase().replace(/\s+/g, "");
      let email = `${first}${last}@gospelhaiti.org`;

      // Check duplicate
      const emailExists = await prisma.student.findUnique({
        where: { schoolEmail: email },
      });
      if (emailExists) {
        email = `${first}${last}${Date.now().toString(36).slice(-4)}@gospelhaiti.org`;
      }

      const student = await prisma.student.create({
        data: {
          legacyId: row.id,
          firstName: row.firstName,
          lastName: row.lastName,
          schoolEmail: email,
          gender: row.gender === "Male" ? "M" : row.gender === "Female" ? "F" : null,
          dateOfBirth: row.birthDate ? new Date(row.birthDate) : null,
          addressVillage: row.residence || null,
          currentClassId: classId || null,
          enrollmentStatus: "ACTIVE",
          emergencyContactPhone: row.contactPhone || null,
        },
      });

      // Create enrollment
      if (classId) {
        await prisma.studentEnrollment.create({
          data: {
            studentId: student.id,
            yearId: activeYear.id,
            classId,
          },
        });
      }

      imported++;
    }

    console.log(`  Imported: ${imported}, Skipped: ${skipped}`);
  }

  // ── Summary ──
  const staffCount = await prisma.staff.count();
  const studentCount = await prisma.student.count();
  console.log(`\nDone. Staff: ${staffCount}, Students: ${studentCount}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
