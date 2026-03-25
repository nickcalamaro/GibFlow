/**
 * GibFlow — Bunny Edge Script (Standalone)
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes:
 *   POST /            → contact form handler
 *   POST /subscribe   → newsletter signup handler
 *   POST /partner     → business listing / partnership enquiry handler
 *   OPTIONS *         → CORS preflight
 *
 * Environment variables (set in Bunny dashboard → Env Configuration):
 *   smtp2go-apikey               (secret)
 *
 * Optional — only needed if you enable the database subscriber store:
 *   BUNNY_DATABASE_URL           (variable — auto-injected if DB is linked)
 *   BUNNY_DATABASE_AUTH_TOKEN    (variable — auto-injected if DB is linked)
 *
 * CORS origins allowed:
 *   https://gibflow.gi
 *   https://www.gibflow.gi
 *   http://localhost:1313  (Hugo dev server)
 */

import * as BunnySDK from "@bunny.net/edgescript-sdk";
import process from "node:process";

const ALLOWED_ORIGINS = [
  "https://gibflow.gi",
  "https://www.gibflow.gi",
  "http://localhost:1313",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function corsHeaders(origin: string): Record<string, string> {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function jsonResp(status: number, body: Record<string, unknown>, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

function escHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Database (optional) ──────────────────────────────────────────────────────

let db: ReturnType<typeof import("https://esm.sh/@libsql/client@0.6.0/web").createClient> | null = null;

async function getDb() {
  if (db) return db;
  const url = process.env.BUNNY_DATABASE_URL;
  const authToken = process.env.BUNNY_DATABASE_AUTH_TOKEN;
  if (!url || !authToken) return null;

  const { createClient } = await import("https://esm.sh/@libsql/client@0.6.0/web");
  db = createClient({ url, authToken });

  // Ensure tables exist (idempotent)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS subscribers (
      email      TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      consent    INTEGER NOT NULL DEFAULT 1,
      consent_ts TEXT NOT NULL,
      source     TEXT NOT NULL DEFAULT 'website-early-access',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contact_log (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      subject    TEXT,
      message    TEXT NOT NULL,
      ts         TEXT NOT NULL,
      email_sent INTEGER NOT NULL DEFAULT 0,
      type       TEXT NOT NULL DEFAULT 'contact'
    )
  `);

  return db;
}

// ── Entry point ──────────────────────────────────────────────────────────────

BunnySDK.net.http.serve(async (request: Request): Promise<Response> => {
  const origin = request.headers.get("Origin") || "";

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (request.method !== "POST") {
    return jsonResp(405, { ok: false, error: "Method not allowed." }, origin);
  }

  const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

  if (path === "/subscribe") return handleSubscribe(request, origin);
  if (path === "/partner") return handlePartner(request, origin);
  return handleContact(request, origin);
});

// ── Contact form handler ────────────────────────────────────────────────────

async function handleContact(request: Request, origin: string): Promise<Response> {
  let data: Record<string, string>;
  try {
    data = await request.json();
  } catch {
    return jsonResp(400, { ok: false, error: "Invalid request body." }, origin);
  }

  const { name, email, subject, message, bot } = data;

  // Honeypot
  if (bot) return jsonResp(200, { ok: true }, origin);

  // Validation
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return jsonResp(400, { ok: false, error: "Name, email and message are required." }, origin);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResp(400, { ok: false, error: "Please enter a valid email address." }, origin);
  }
  if (message.trim().length < 10) {
    return jsonResp(400, { ok: false, error: "Message is too short." }, origin);
  }

  const smtp2goKey = process.env["smtp2go-apikey"];
  if (!smtp2goKey) {
    console.error("[GibFlow] smtp2go-apikey secret not found in environment");
    return jsonResp(500, { ok: false, error: "Server configuration error." }, origin);
  }

  const ts = new Date().toISOString();
  const subjectLine = `[GibFlow] ${(subject || "General Enquiry").trim()} — ${name.trim()}`;

  const htmlBody = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#c00f1b;padding:24px 28px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">New Contact Enquiry</h1>
    <p style="color:rgba(255,255,255,0.80);margin:4px 0 0;font-size:13px">GibFlow Website</p>
  </div>
  <div style="background:#fafafa;padding:28px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 12px 8px 0;color:#666;font-weight:600;width:80px;vertical-align:top">Name</td><td style="padding:8px 0">${escHtml(name)}</td></tr>
      <tr><td style="padding:8px 12px 8px 0;color:#666;font-weight:600;vertical-align:top">Email</td><td style="padding:8px 0"><a href="mailto:${escHtml(email)}" style="color:#c00f1b;text-decoration:none">${escHtml(email)}</a></td></tr>
      <tr><td style="padding:8px 12px 8px 0;color:#666;font-weight:600;vertical-align:top">Subject</td><td style="padding:8px 0">${escHtml(subject || "General Enquiry")}</td></tr>
      <tr><td style="padding:8px 12px 8px 0;color:#666;font-weight:600;vertical-align:top">Sent</td><td style="padding:8px 0;color:#999;font-size:12px">${ts}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0">
    <h3 style="color:#333;font-size:15px;margin:0 0 10px;font-weight:600">Message</h3>
    <div style="background:#fff;padding:16px;border-radius:6px;border:1px solid #e5e5e5;font-size:14px;line-height:1.7;white-space:pre-wrap;color:#333">${escHtml(message)}</div>
    <p style="margin:20px 0 0;font-size:12px;color:#aaa">Reply directly to this email to respond to ${escHtml(name)}.</p>
  </div>
</div>`.trim();

  const textBody = [
    "New Contact Enquiry",
    "",
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Subject: ${subject || "General Enquiry"}`,
    `Sent:    ${ts}`,
    "",
    "Message:",
    message,
    "",
    "---",
    "Sent from gibflow.gi/contact/",
  ].join("\n");

  let emailSent = false;
  try {
    const smtpResp = await fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: smtp2goKey,
        to: ["GibFlow Team <info@gibflow.gi>"],
        sender: "GibFlow Website <noreply@gibflow.gi>",
        reply_to: [`${name} <${email}>`],
        subject: subjectLine,
        html_body: htmlBody,
        text_body: textBody,
      }),
    });
    const smtpResult = await smtpResp.json();
    emailSent = smtpResult?.data?.succeeded === 1;
    if (!emailSent) {
      console.error("[GibFlow] SMTP2GO non-success:", JSON.stringify(smtpResult));
    }
  } catch (err) {
    console.error("[GibFlow] SMTP2GO fetch threw:", err);
    return jsonResp(500, { ok: false, error: "Failed to send message. Please try again or email us directly." }, origin);
  }

  // Log to database (best-effort, never blocks the response)
  try {
    const database = await getDb();
    if (database) {
      const id = `${ts.replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 7)}`;
      database.execute({
        sql: "INSERT INTO contact_log (id, name, email, subject, message, ts, email_sent, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: [id, name, email, subject || "General Enquiry", message, ts, emailSent ? 1 : 0, "contact"],
      }).catch((err) => console.warn("[GibFlow] DB log failed (non-fatal):", err));
    }
  } catch (err) {
    console.warn("[GibFlow] DB init failed (non-fatal):", err);
  }

  if (!emailSent) {
    return jsonResp(500, { ok: false, error: "Message could not be delivered. Please email info@gibflow.gi directly." }, origin);
  }

  return jsonResp(200, { ok: true }, origin);
}

// ── Business / partner enquiry handler ──────────────────────────────────────

async function handlePartner(request: Request, origin: string): Promise<Response> {
  let data: Record<string, string>;
  try {
    data = await request.json();
  } catch {
    return jsonResp(400, { ok: false, error: "Invalid request body." }, origin);
  }

  const { name, email, business, message, bot } = data;

  if (bot) return jsonResp(200, { ok: true }, origin);

  if (!name?.trim() || !email?.trim() || !business?.trim() || !message?.trim()) {
    return jsonResp(400, { ok: false, error: "Name, email, business name and message are required." }, origin);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResp(400, { ok: false, error: "Please enter a valid email address." }, origin);
  }
  if (message.trim().length < 10) {
    return jsonResp(400, { ok: false, error: "Message is too short." }, origin);
  }

  const smtp2goKey = process.env["smtp2go-apikey"];
  if (!smtp2goKey) {
    console.error("[GibFlow] smtp2go-apikey secret not found in environment");
    return jsonResp(500, { ok: false, error: "Server configuration error." }, origin);
  }

  const ts = new Date().toISOString();
  const subjectLine = `[GibFlow] Business Enquiry — ${business.trim()} (${name.trim()})`;

  const htmlBody = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#c00f1b;padding:24px 28px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">New Business Enquiry</h1>
    <p style="color:rgba(255,255,255,0.80);margin:4px 0 0;font-size:13px">GibFlow — Work With Us</p>
  </div>
  <div style="background:#fafafa;padding:28px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 12px 8px 0;color:#666;font-weight:600;width:100px;vertical-align:top">Name</td><td style="padding:8px 0">${escHtml(name)}</td></tr>
      <tr><td style="padding:8px 12px 8px 0;color:#666;font-weight:600;vertical-align:top">Email</td><td style="padding:8px 0"><a href="mailto:${escHtml(email)}" style="color:#c00f1b;text-decoration:none">${escHtml(email)}</a></td></tr>
      <tr><td style="padding:8px 12px 8px 0;color:#666;font-weight:600;vertical-align:top">Business</td><td style="padding:8px 0;font-weight:600">${escHtml(business)}</td></tr>
      <tr><td style="padding:8px 12px 8px 0;color:#666;font-weight:600;vertical-align:top">Sent</td><td style="padding:8px 0;color:#999;font-size:12px">${ts}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0">
    <h3 style="color:#333;font-size:15px;margin:0 0 10px;font-weight:600">Message</h3>
    <div style="background:#fff;padding:16px;border-radius:6px;border:1px solid #e5e5e5;font-size:14px;line-height:1.7;white-space:pre-wrap;color:#333">${escHtml(message)}</div>
    <p style="margin:20px 0 0;font-size:12px;color:#aaa">Reply directly to this email to respond to ${escHtml(name)} at ${escHtml(business)}.</p>
  </div>
</div>`.trim();

  const textBody = [
    "New Business Enquiry",
    "",
    `Name:     ${name}`,
    `Email:    ${email}`,
    `Business: ${business}`,
    `Sent:     ${ts}`,
    "",
    "Message:",
    message,
    "",
    "---",
    "Sent from gibflow.gi/work-with-us/",
  ].join("\n");

  let emailSent = false;
  try {
    const smtpResp = await fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: smtp2goKey,
        to: ["GibFlow Team <info@gibflow.gi>"],
        sender: "GibFlow Website <noreply@gibflow.gi>",
        reply_to: [`${name} <${email}>`],
        subject: subjectLine,
        html_body: htmlBody,
        text_body: textBody,
      }),
    });
    const smtpResult = await smtpResp.json();
    emailSent = smtpResult?.data?.succeeded === 1;
    if (!emailSent) {
      console.error("[GibFlow] SMTP2GO non-success (partner):", JSON.stringify(smtpResult));
    }
  } catch (err) {
    console.error("[GibFlow] SMTP2GO fetch threw (partner):", err);
    return jsonResp(500, { ok: false, error: "Failed to send message. Please try again or email us directly." }, origin);
  }

  // Log to database (best-effort)
  try {
    const database = await getDb();
    if (database) {
      const id = `${ts.replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 7)}`;
      database.execute({
        sql: "INSERT INTO contact_log (id, name, email, subject, message, ts, email_sent, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: [id, name, email, `Business: ${business}`, message, ts, emailSent ? 1 : 0, "partner"],
      }).catch((err) => console.warn("[GibFlow] DB log failed (partner, non-fatal):", err));
    }
  } catch (err) {
    console.warn("[GibFlow] DB init failed (non-fatal):", err);
  }

  if (!emailSent) {
    return jsonResp(500, { ok: false, error: "Message could not be delivered. Please email info@gibflow.gi directly." }, origin);
  }

  return jsonResp(200, { ok: true }, origin);
}

// ── Newsletter subscribe handler ────────────────────────────────────────────

async function handleSubscribe(request: Request, origin: string): Promise<Response> {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return jsonResp(400, { ok: false, error: "Invalid request body." }, origin);
  }

  const name = data.name as string;
  const email = data.email as string;
  const consent = data.consent as boolean;
  const bot = data.bot as string;

  if (bot) return jsonResp(200, { ok: true }, origin);

  if (!name?.trim() || !email?.trim()) {
    return jsonResp(400, { ok: false, error: "Name and email are required." }, origin);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResp(400, { ok: false, error: "Please enter a valid email address." }, origin);
  }
  if (!consent) {
    return jsonResp(400, { ok: false, error: "You must agree to the Privacy Policy to sign up." }, origin);
  }

  const smtp2goKey = process.env["smtp2go-apikey"];
  const ts = new Date().toISOString();

  if (!smtp2goKey) {
    console.error("[GibFlow] smtp2go-apikey secret not found");
    return jsonResp(500, { ok: false, error: "Server configuration error." }, origin);
  }

  // Store in database (fire-and-forget)
  try {
    const database = await getDb();
    if (database) {
      database.execute({
        sql: "INSERT OR IGNORE INTO subscribers (email, name, consent, consent_ts, source) VALUES (?, ?, 1, ?, ?)",
        args: [email.toLowerCase().trim(), name.trim(), ts, "website-early-access"],
      }).catch((err) => console.warn("[GibFlow] Subscriber DB write failed (non-fatal):", err));
    }
  } catch (err) {
    console.warn("[GibFlow] DB init failed (non-fatal):", err);
  }

  // Internal notification
  const notifyHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#c00f1b;padding:24px 28px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">New Subscriber</h1>
    <p style="color:rgba(255,255,255,0.80);margin:4px 0 0;font-size:13px">GibFlow Updates List</p>
  </div>
  <div style="background:#fafafa;padding:28px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;font-size:14px">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 12px 8px 0;color:#666;font-weight:600;width:80px">Name</td><td>${escHtml(name)}</td></tr>
      <tr><td style="padding:8px 12px 8px 0;color:#666;font-weight:600">Email</td><td><a href="mailto:${escHtml(email)}" style="color:#c00f1b">${escHtml(email)}</a></td></tr>
      <tr><td style="padding:8px 12px 8px 0;color:#666;font-weight:600">Signed up</td><td style="color:#999;font-size:12px">${ts}</td></tr>
      <tr><td style="padding:8px 12px 8px 0;color:#666;font-weight:600">Consent</td><td style="color:#2e7d32">Privacy Policy accepted</td></tr>
    </table>
  </div>
</div>`.trim();

  // Welcome email
  const welcomeHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#c00f1b;padding:24px 28px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">You're on the list, ${escHtml(name.split(" ")[0])}.</h1>
    <p style="color:rgba(255,255,255,0.80);margin:4px 0 0;font-size:13px">GibFlow</p>
  </div>
  <div style="background:#fafafa;padding:28px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;font-size:14px;line-height:1.7;color:#333">
    <p>Thanks for signing up. We'll keep you updated on GibFlow's progress, including the launch on iOS and Android, new features as they roll out, and anything else worth knowing about getting around Gibraltar.</p>
    <p style="margin-top:16px">We'll only email you when there's something worth telling you. You can unsubscribe at any time by replying to any of our emails.</p>
    <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
    <p style="font-size:12px;color:#999">
      You signed up at <a href="https://gibflow.gi" style="color:#c00f1b;text-decoration:none">gibflow.gi</a> and agreed to our
      <a href="https://gibflow.gi/privacy/" style="color:#c00f1b;text-decoration:none">Privacy Policy</a>.
      To stop receiving emails, reply with "Unsubscribe" in the subject line.
    </p>
  </div>
</div>`.trim();

  try {
    const [notifyResp, welcomeResp] = await Promise.all([
      fetch("https://api.smtp2go.com/v3/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: smtp2goKey,
          to: ["GibFlow Team <info@gibflow.gi>"],
          sender: "GibFlow Website <noreply@gibflow.gi>",
          subject: `[GibFlow] New subscriber: ${name.trim()} <${email}>`,
          html_body: notifyHtml,
          text_body: `New subscriber\nName: ${name}\nEmail: ${email}\nSigned up: ${ts}\nConsent: Privacy Policy accepted`,
        }),
      }),
      fetch("https://api.smtp2go.com/v3/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: smtp2goKey,
          to: [`${name.trim()} <${email}>`],
          sender: "GibFlow <noreply@gibflow.gi>",
          subject: "You're on the GibFlow list",
          html_body: welcomeHtml,
          text_body: `Hi ${name.split(" ")[0]},\n\nThanks for signing up. We'll keep you updated on GibFlow's progress, including the launch on iOS and Android, new features as they roll out, and anything else worth knowing about getting around Gibraltar.\n\nWe'll only email you when there's something worth telling you.\n\nTo unsubscribe, reply with "Unsubscribe" in the subject line.\n\nGibFlow Team\nhttps://gibflow.gi`,
        }),
      }),
    ]);

    const [notifyResult, welcomeResult] = await Promise.all([
      notifyResp.json().catch(() => ({})),
      welcomeResp.json().catch(() => ({})),
    ]);

    if ((notifyResult as Record<string, unknown>)?.data?.succeeded !== 1) {
      console.warn("[GibFlow] Subscriber notify email failed:", JSON.stringify(notifyResult));
    }
    if ((welcomeResult as Record<string, unknown>)?.data?.succeeded !== 1) {
      console.warn("[GibFlow] Welcome email failed:", JSON.stringify(welcomeResult));
    }
  } catch (err) {
    console.error("[GibFlow] Subscribe email error:", err);
  }

  return jsonResp(200, { ok: true }, origin);
}
