"use client";

import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "ghis-offline";
const STORE = "attendance-queue";
const DB_VERSION = 1;

export type QueuedAttendance = {
  clientUuid: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  code: string; // AttendanceCode
  markedById: string;
  notes?: string;
  queuedAt: number;
};

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "clientUuid" });
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueueAttendance(entry: QueuedAttendance) {
  const db = await getDb();
  await db.put(STORE, entry);
}

export async function dequeueAll(): Promise<QueuedAttendance[]> {
  const db = await getDb();
  return db.getAll(STORE);
}

export async function removeFromQueue(clientUuid: string) {
  const db = await getDb();
  await db.delete(STORE, clientUuid);
}

export async function clearQueue() {
  const db = await getDb();
  await db.clear(STORE);
}

export async function queueCount(): Promise<number> {
  const db = await getDb();
  return db.count(STORE);
}
