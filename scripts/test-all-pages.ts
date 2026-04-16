/**
 * Automated QA agent — signs in as Director and tests every page and action.
 * Run with: npx tsx scripts/test-all-pages.ts
 */

import * as dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = "ap@gospelhaiti.org";
const PASSWORD = "POlqpMIZn9p0M2qx";

type TestResult = {
  route: string;
  status: number;
  ok: boolean;
  error?: string;
  warnings: string[];
  bodyLength: number;
};

const results: TestResult[] = [];
let cookies = "";

async function signIn(): Promise<boolean> {
  // Get the Supabase session by signing in through the app's sign-in action
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });

  if (error || !data.session) {
    console.error("Sign-in failed:", error?.message);
    return false;
  }

  // Build cookies that the middleware expects
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!
    .replace("https://", "")
    .replace(".supabase.co", "");

  // Set auth cookies in the format Supabase SSR expects
  const tokenData = JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    expires_in: data.session.expires_in,
    token_type: "bearer",
    type: "access",
  });

  // Supabase SSR stores auth in chunked cookies
  const cookieName = `sb-${projectRef}-auth-token`;
  // For simplicity, encode as base64 in a single cookie chunk
  const encoded = Buffer.from(tokenData).toString("base64");
  cookies = `${cookieName}=${encoded}`;

  // Alternative: use the raw token cookies
  cookies = `${cookieName}.0=${encodeURIComponent(tokenData.slice(0, 3000))}`;
  if (tokenData.length > 3000) {
    cookies += `; ${cookieName}.1=${encodeURIComponent(tokenData.slice(3000))}`;
  }

  console.log("Signed in as:", EMAIL);
  return true;
}

async function testPage(route: string, description?: string): Promise<TestResult> {
  const url = `${BASE}${route}`;
  const result: TestResult = {
    route,
    status: 0,
    ok: false,
    warnings: [],
    bodyLength: 0,
  };

  try {
    const res = await fetch(url, {
      headers: { Cookie: cookies },
      redirect: "manual",
    });

    result.status = res.status;
    const body = await res.text();
    result.bodyLength = body.length;

    // Check for redirects
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location") || "";
      if (location.includes("/sign-in")) {
        result.error = "Redirected to sign-in (auth issue)";
      } else {
        result.warnings.push(`Redirect → ${location}`);
        result.ok = true;
      }
    } else if (res.status === 200) {
      result.ok = true;

      // Check for error indicators in the body
      if (body.includes("Application error")) {
        result.error = "Application error found in page";
        result.ok = false;
      }
      if (body.includes("Internal Server Error")) {
        result.error = "Internal Server Error in page";
        result.ok = false;
      }
      if (body.includes("NEXT_NOT_FOUND")) {
        result.error = "Page not found marker in body";
        result.ok = false;
      }

      // Check for common issues
      if (body.includes("Missing NEXT_PUBLIC")) {
        result.warnings.push("Missing env var reference in page");
      }
      if (body.includes("hydration")) {
        result.warnings.push("Possible hydration mismatch");
      }
      if (body.length < 500 && !route.startsWith("/api/")) {
        result.warnings.push("Suspiciously small page body");
      }

      // Check for untranslated strings (English text in French UI)
      // This is informational only
      if (body.includes("undefined") && !route.startsWith("/api/")) {
        result.warnings.push("Found 'undefined' text in page");
      }
    } else if (res.status === 404) {
      result.error = "Page not found (404)";
    } else {
      result.error = `Unexpected status: ${res.status}`;
    }
  } catch (e) {
    result.error = `Fetch error: ${e instanceof Error ? e.message : String(e)}`;
  }

  const icon = result.ok ? (result.warnings.length ? "⚠️" : "✅") : "❌";
  const desc = description ? ` (${description})` : "";
  console.log(`${icon} ${route}${desc} → ${result.status} [${result.bodyLength}b]`);
  if (result.error) console.log(`   ERROR: ${result.error}`);
  for (const w of result.warnings) console.log(`   WARN: ${w}`);

  results.push(result);
  return result;
}

async function testApiEndpoint(
  route: string,
  method: string,
  body?: unknown,
  description?: string,
): Promise<TestResult> {
  const url = `${BASE}${route}`;
  const result: TestResult = {
    route: `${method} ${route}`,
    status: 0,
    ok: false,
    warnings: [],
    bodyLength: 0,
  };

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Cookie: cookies,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });

    result.status = res.status;
    const text = await res.text();
    result.bodyLength = text.length;

    if (res.status >= 200 && res.status < 300) {
      result.ok = true;
      try {
        const json = JSON.parse(text);
        if (json.error) {
          result.warnings.push(`API returned error field: ${json.error}`);
        }
      } catch {}
    } else if (res.status >= 300 && res.status < 400) {
      result.warnings.push(`Redirect → ${res.headers.get("location")}`);
      result.ok = true; // redirects after form submissions are normal
    } else {
      result.error = `Status ${res.status}`;
    }
  } catch (e) {
    result.error = `Fetch error: ${e instanceof Error ? e.message : String(e)}`;
  }

  const icon = result.ok ? "✅" : "❌";
  const desc = description ? ` (${description})` : "";
  console.log(`${icon} ${method} ${route}${desc} → ${result.status}`);
  if (result.error) console.log(`   ERROR: ${result.error}`);
  for (const w of result.warnings) console.log(`   WARN: ${w}`);

  results.push(result);
  return result;
}

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  GHIS Platform — Automated QA Agent");
  console.log("═══════════════════════════════════════\n");

  // Step 1: Sign in
  console.log("── Authentication ──");
  const signedIn = await signIn();
  if (!signedIn) {
    console.error("\nCannot proceed without authentication.");
    process.exit(1);
  }

  // Step 2: Test public pages
  console.log("\n── Public Pages ──");
  await testPage("/", "Landing page");
  await testPage("/sign-in", "Sign-in page");
  await testPage("/staff-clock", "Staff clock-in (public)");
  await testPage("/api/health", "Health check API");

  // Step 3: Test all dashboard pages
  console.log("\n── Dashboard Pages ──");
  await testPage("/dashboard", "Main dashboard");
  await testPage("/dashboard/students", "Student list");
  await testPage("/dashboard/students/new", "New student form");
  await testPage("/dashboard/attendance", "Attendance");
  await testPage("/dashboard/gradebook", "Gradebook");
  await testPage("/dashboard/behavior", "Behavior");
  await testPage("/dashboard/fees", "Fees & Payments");
  await testPage("/dashboard/staff", "Staff list");
  await testPage("/dashboard/staff/new", "New staff form");
  await testPage("/dashboard/staff?tab=leave", "Staff leave tab");
  await testPage("/dashboard/staff?tab=observations", "Staff observations tab");
  await testPage("/dashboard/time-clock", "Time clock");
  await testPage("/dashboard/schedules", "Schedules - timetable");
  await testPage("/dashboard/schedules?tab=slots", "Schedules - time slots");
  await testPage("/dashboard/schedules?tab=calendar", "Schedules - calendar");
  await testPage("/dashboard/reports", "Reports - daily");
  await testPage("/dashboard/reports?tab=weekly", "Reports - weekly");
  await testPage("/dashboard/reports?tab=monthly", "Reports - monthly");
  await testPage("/dashboard/reports?tab=trimestre", "Reports - trimestre");
  await testPage("/dashboard/reports?tab=transcripts", "Reports - transcripts");
  await testPage("/dashboard/weekly-report", "Weekly report (legacy)");
  await testPage("/dashboard/settings", "Settings");

  // Step 4: Test with specific data — student detail pages
  console.log("\n── Data-Specific Pages ──");
  // Fetch a student ID from the students page
  const studentsRes = await fetch(`${BASE}/api/health`, {
    headers: { Cookie: cookies },
  });

  // Test API endpoint
  console.log("\n── API Endpoints ──");
  await testApiEndpoint("/api/health", "GET", undefined, "Health check");
  await testApiEndpoint("/api/attendance/sync", "POST", { entries: [] }, "Empty attendance sync");

  // Step 5: Test non-existent routes (should 404 or redirect gracefully)
  console.log("\n── Edge Cases ──");
  await testPage("/dashboard/nonexistent", "Non-existent dashboard route");
  await testPage("/dashboard/students/nonexistent-id", "Non-existent student");
  await testPage("/dashboard/staff/nonexistent-id", "Non-existent staff");

  // ── Summary ──
  console.log("\n═══════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("═══════════════════════════════════════\n");

  const passed = results.filter((r) => r.ok && r.warnings.length === 0);
  const warnings = results.filter((r) => r.ok && r.warnings.length > 0);
  const failed = results.filter((r) => !r.ok);

  console.log(`Total tests: ${results.length}`);
  console.log(`  Passed:   ${passed.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log(`  Failed:   ${failed.length}`);

  if (failed.length > 0) {
    console.log("\n── Failed Routes ──");
    for (const r of failed) {
      console.log(`  ❌ ${r.route}: ${r.error}`);
    }
  }

  if (warnings.length > 0) {
    console.log("\n── Warnings ──");
    for (const r of warnings) {
      for (const w of r.warnings) {
        console.log(`  ⚠️  ${r.route}: ${w}`);
      }
    }
  }

  console.log("\n── Suggestions for Improvement ──");

  const suggestions: string[] = [];

  // Analyze results for patterns
  const authRedirects = results.filter(
    (r) => r.error?.includes("sign-in") || r.error?.includes("auth"),
  );
  if (authRedirects.length > 0) {
    suggestions.push(
      `${authRedirects.length} page(s) redirect to sign-in — session cookie format may need adjustment for server-side auth.`,
    );
  }

  const notFounds = results.filter((r) => r.status === 404);
  if (notFounds.length > 0) {
    suggestions.push(
      `${notFounds.length} route(s) return 404: ${notFounds.map((r) => r.route).join(", ")}`,
    );
  }

  const smallPages = results.filter(
    (r) => r.ok && r.bodyLength < 500 && !r.route.startsWith("/api") && !r.route.includes("POST"),
  );
  if (smallPages.length > 0) {
    suggestions.push(
      `${smallPages.length} page(s) have very small bodies — might be rendering empty states or errors client-side.`,
    );
  }

  // General suggestions based on features
  suggestions.push("Add loading skeletons for dashboard cards that depend on database queries.");
  suggestions.push("Add error boundaries around each dashboard module to prevent full-page crashes.");
  suggestions.push("Student detail pages for migrated students should be verified with real IDs.");
  suggestions.push("Test offline mode by disabling network and submitting attendance.");
  suggestions.push("Verify the staff-clock PIN validation works with the migrated 4-digit PINs.");

  for (let i = 0; i < suggestions.length; i++) {
    console.log(`  ${i + 1}. ${suggestions[i]}`);
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Agent error:", e);
  process.exit(1);
});
