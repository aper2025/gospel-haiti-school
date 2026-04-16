/**
 * Second-pass migration: update student records with full field data from legacy
 * dump, and import staff time-clock entries.
 * Run with: npx tsx scripts/migrate-remaining.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

const DUMP_PATH =
  process.env.DUMP_PATH ||
  `${process.env.HOME}/Downloads/Gospel Haiti/school-management-system/school_data_backup.sql`;

function extractInsert(sql: string, table: string): string | null {
  const re = new RegExp(`INSERT INTO \`${table}\` VALUES (.+?);`, "s");
  const m = sql.match(re);
  return m ? m[1] : null;
}

function parseFields(chunk: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < chunk.length) {
    if (chunk[i] === "'") {
      let end = i + 1;
      while (end < chunk.length) {
        if (chunk[end] === "'" && (end + 1 >= chunk.length || chunk[end + 1] !== "'")) {
          break;
        }
        if (chunk[end] === "'" && chunk[end + 1] === "'") {
          end += 2;
          continue;
        }
        end++;
      }
      fields.push(chunk.slice(i + 1, end).replace(/''/g, "'"));
      i = end + 1;
      if (i < chunk.length && chunk[i] === ",") i++;
    } else if (chunk.startsWith("NULL", i)) {
      fields.push("");
      i += 4;
      if (i < chunk.length && chunk[i] === ",") i++;
    } else {
      i++;
    }
  }
  return fields;
}

function splitRows(valuesStr: string): string[][] {
  const chunks = valuesStr.split(/\),\s*\(/);
  return chunks.map((c, i) => {
    let cleaned = c;
    if (i === 0) cleaned = cleaned.replace(/^\(/, "");
    if (i === chunks.length - 1) cleaned = cleaned.replace(/\)$/, "");
    return parseFields(cleaned);
  });
}

async function main() {
  console.log("Reading legacy dump:", DUMP_PATH);
  const sql = fs.readFileSync(DUMP_PATH, "utf-8");

  // ── Update students with full field data ──
  const studentValues = extractInsert(sql, "students");
  if (studentValues) {
    const rows = splitRows(studentValues);
    console.log(`\nUpdating ${rows.length} student records with full data...`);
    // Schema: id, firstName, lastName, gradeLevel, contactPhone, contactEmail,
    //         emergencyContactName, emergencyContactPhone, emergencyContactRelationship,
    //         notes, behaviorLevel, active, createdAt, updatedAt, schoolYear,
    //         birthDate, gender, residence

    let updated = 0;
    for (const f of rows) {
      const legacyId = f[0];
      if (!legacyId) continue;

      const existing = await prisma.student.findUnique({
        where: { legacyId },
      });
      if (!existing) continue;

      const contactPhone = f[4] || null;
      const emergencyContactName = f[6] || null;
      const emergencyContactPhone = f[7] || null;
      const notes = f[9] || null;
      const behaviorLevel = f[10] || "0";
      const birthDate = f[15] || null;
      const gender = f[16] || null;
      const residence = f[17] || null;

      const behaviorMap: Record<string, string> = {
        "0": "L0", "1": "L1", "2": "L2", "3": "L3",
        "4": "L4", "5": "L5", "6": "L6",
      };

      const updateData: Record<string, unknown> = {};

      // Only update fields that are currently empty
      if (!existing.emergencyContactPhone && contactPhone)
        updateData.emergencyContactPhone = contactPhone;
      if (!existing.emergencyContactName && emergencyContactName)
        updateData.emergencyContactName = emergencyContactName;
      if (!existing.generalNotes && notes)
        updateData.generalNotes = notes;
      if (!existing.dateOfBirth && birthDate) {
        try {
          updateData.dateOfBirth = new Date(birthDate);
        } catch {}
      }
      if (!existing.gender && gender) {
        if (gender === "M" || gender === "F") updateData.gender = gender;
      }
      if (!existing.addressVillage && residence)
        updateData.addressVillage = residence;

      // Always update behavior level from legacy
      const bl = behaviorMap[behaviorLevel];
      if (bl) updateData.currentBehaviorLevel = bl;

      // Update mother/father phone from contactPhone if not set
      if (!existing.motherPhone && !existing.fatherPhone && contactPhone) {
        updateData.motherPhone = contactPhone;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.student.update({
          where: { id: existing.id },
          data: updateData as never,
        });
        updated++;
      }
    }
    console.log(`  Updated: ${updated} students`);
  }

  // ── Import staff time-clock entries ──
  const staffAttValues = extractInsert(sql, "staff_attendance");
  if (staffAttValues) {
    const rows = splitRows(staffAttValues);
    console.log(`\nImporting ${rows.length} staff time-clock entries...`);
    // Schema: id, staffId, checkInTime, checkOutTime, checkInPhoto, checkOutPhoto,
    //         isLate, lateReason, date, createdAt

    let imported = 0;
    let skipped = 0;

    for (const f of rows) {
      const legacyStaffId = f[1];
      const checkInStr = f[2];
      const checkOutStr = f[3];
      const isLate = f[6] === "yes";
      const lateReason = f[7] || null;
      const dateStr = f[8]; // "2025-10-20"

      if (!legacyStaffId || !dateStr) { skipped++; continue; }

      // Find the staff by legacyId
      const staff = await prisma.staff.findUnique({
        where: { legacyId: legacyStaffId },
      });
      if (!staff) { skipped++; continue; }

      const date = new Date(dateStr);
      const signInAt = checkInStr ? new Date(checkInStr) : null;
      const signOutAt = checkOutStr ? new Date(checkOutStr) : null;

      let hoursWorked = null;
      if (signInAt && signOutAt) {
        hoursWorked = Math.round(((signOutAt.getTime() - signInAt.getTime()) / 3600000) * 100) / 100;
      }

      // Check if already exists
      const existing = await prisma.timeClockEntry.findUnique({
        where: { staffId_date: { staffId: staff.id, date } },
      });
      if (existing) { skipped++; continue; }

      await prisma.timeClockEntry.create({
        data: {
          staffId: staff.id,
          date,
          signInAt,
          signOutAt,
          hoursWorked,
          notes: lateReason,
        },
      });
      imported++;
    }
    console.log(`  Imported: ${imported}, Skipped: ${skipped}`);
  }

  // ── Summary ──
  const staffCount = await prisma.staff.count();
  const studentCount = await prisma.student.count();
  const clockCount = await prisma.timeClockEntry.count();
  console.log(`\nFinal totals — Staff: ${staffCount}, Students: ${studentCount}, Time clock entries: ${clockCount}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
