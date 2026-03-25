/**
 * GibFlow — Contact Form & Newsletter Bunny Edge Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes:
 *   POST /            → contact form handler
 *   POST /subscribe   → newsletter signup handler
 *   POST /partner     → business listing / partnership enquiry handler
 *
 * Bunny Edge Script variables and secrets are exposed as JavaScript globals.
 * Variable names that contain hyphens cannot be used as JS identifiers directly,
 * so getVar() tries both the exact name (via globalThis bracket notation) and
 * a normalised underscore version — whichever Bunny's runtime exposes.
 *
 * Script variables configured in the Bunny dashboard (script ID 69384):
 *   smtp2go-apikey                     (secret)
 *   gib-flow-database-url              (variable)
 *   gibflow-database-full-access-token (variable)
 *
 * CORS origins allowed:
 *   https://gibflow.gi
 *   https://www.gibflow.gi
 *   http://localhost:1313  (Hugo dev server)
 */

const ALLOWED_ORIGINS = [
  'https://gibflow.gi',
  'https://www.gibflow.gi',
  'http://localhost:1313',
];

/**
 * Read a Bunny Edge Script variable/secret.
 * Tries the exact name via globalThis bracket notation first (handles hyphens),
 * then a normalised form with hyphens replaced by underscores.
 */
function getVar(name) {
  const direct = globalThis[name];
  if (direct) return String(direct);
  const underscored = globalThis[name.replace(/-/g, '_')];
  if (underscored) return String(underscored);
  return '';
}

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function jsonResp(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Entry point ───────────────────────────────────────────────────────────────
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const origin = request.headers.get('Origin') || '';

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (request.method !== 'POST') {
    return jsonResp(405, { ok: false, error: 'Method not allowed.' }, origin);
  }

  const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';

  if (path === '/subscribe') {
    return handleSubscribe(request, origin);
  }
  if (path === '/partner') {
    return handlePartner(request, origin);
  }
  return handleContact(request, origin);
}

// ── Contact form handler ──────────────────────────────────────────────────────
async function handleContact(request, origin) {
  // ── Parse body ─────────────────────────────────────────────────────────────
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonResp(400, { ok: false, error: 'Invalid request body.' }, origin);
  }

  const { name, email, subject, message, bot } = data;

  // Honeypot — silently accept bots so they think it worked
  if (bot) return jsonResp(200, { ok: true }, origin);

  // ── Validation ─────────────────────────────────────────────────────────────
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return jsonResp(400, { ok: false, error: 'Name, email and message are required.' }, origin);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResp(400, { ok: false, error: 'Please enter a valid email address.' }, origin);
  }
  if (message.trim().length < 10) {
    return jsonResp(400, { ok: false, error: 'Message is too short.' }, origin);
  }

  // ── Retrieve secrets ───────────────────────────────────────────────────────
  const smtp2goKey = getVar('smtp2go-apikey');
  if (!smtp2goKey) {
    console.error('[GibFlow] smtp2go-apikey variable not found on this script');
    return jsonResp(500, { ok: false, error: 'Server configuration error.' }, origin);
  }

  const ts          = new Date().toISOString();
  const subjectLine = `[GibFlow] ${(subject || 'General Enquiry').trim()} — ${name.trim()}`;

  // ── Build email bodies ─────────────────────────────────────────────────────
  const htmlBody = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#c00f1b;padding:24px 28px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">New Contact Enquiry</h1>
    <p style="color:rgba(255,255,255,0.80);margin:4px 0 0;font-size:13px">GibFlow Website — gibflow.gi</p>
  </div>
  <div style="background:#fafafa;padding:28px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr>
        <td style="padding:8px 12px 8px 0;color:#666;font-weight:600;width:80px;vertical-align:top">Name</td>
        <td style="padding:8px 0">${escHtml(name)}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px 8px 0;color:#666;font-weight:600;vertical-align:top">Email</td>
        <td style="padding:8px 0"><a href="mailto:${escHtml(email)}" style="color:#c00f1b;text-decoration:none">${escHtml(email)}</a></td>
      </tr>
      <tr>
        <td style="padding:8px 12px 8px 0;color:#666;font-weight:600;vertical-align:top">Subject</td>
        <td style="padding:8px 0">${escHtml(subject || 'General Enquiry')}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px 8px 0;color:#666;font-weight:600;vertical-align:top">Sent</td>
        <td style="padding:8px 0;color:#999;font-size:12px">${ts}</td>
      </tr>
    </table>
    <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0">
    <h3 style="color:#333;font-size:15px;margin:0 0 10px;font-weight:600">Message</h3>
    <div style="background:#fff;padding:16px;border-radius:6px;border:1px solid #e5e5e5;font-size:14px;line-height:1.7;white-space:pre-wrap;color:#333">${escHtml(message)}</div>
    <p style="margin:20px 0 0;font-size:12px;color:#aaa">
      Reply directly to this email to respond to ${escHtml(name)}.
    </p>
  </div>
</div>`.trim();

  const textBody = [
    'New Contact Enquiry — GibFlow',
    '',
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Subject: ${subject || 'General Enquiry'}`,
    `Sent:    ${ts}`,
    '',
    'Message:',
    message,
    '',
    '---',
    'Sent from gibflow.gi/contact/',
  ].join('\n');

  // ── Send via SMTP2GO ───────────────────────────────────────────────────────
  let emailSent = false;
  try {
    const smtpResp = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key:   smtp2goKey,
        to:        ['GibFlow Team <info@gibflow.gi>'],
        sender:    'GibFlow Website <noreply@gibflow.gi>',
        reply_to:  [`${name} <${email}>`],
        subject:   subjectLine,
        html_body: htmlBody,
        text_body: textBody,
      }),
    });
    const smtpResult = await smtpResp.json();
    emailSent = smtpResult?.data?.succeeded === 1;
    if (!emailSent) {
      console.error('[GibFlow] SMTP2GO non-success:', JSON.stringify(smtpResult));
    }
  } catch (err) {
    console.error('[GibFlow] SMTP2GO fetch threw:', err);
    return jsonResp(500, { ok: false, error: 'Failed to send message. Please try again or email us directly.' }, origin);
  }

  // ── Log to Bunny Database (best-effort — never blocks the response) ────────
  const dbUrl   = getVar('gib-flow-database-url');
  const dbToken = getVar('gibflow-database-full-access-token');

  if (dbUrl && dbToken) {
    const id      = `${ts.replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 7)}`;
    const payload = JSON.stringify({ name, email, subject, message, ts, emailSent });

    fetch(`${dbUrl.replace(/\/$/, '')}/contact/${id}.json`, {
      method:  'PUT',
      headers: { AccessKey: dbToken, 'Content-Type': 'application/json' },
      body:    payload,
    }).catch((err) => console.warn('[GibFlow] DB log failed (non-fatal):', err));
  }

  if (!emailSent) {
    return jsonResp(500, { ok: false, error: 'Message could not be delivered. Please email info@gibflow.gi directly.' }, origin);
  }

  return jsonResp(200, { ok: true }, origin);
}

// ── Business / partner enquiry handler ──────────────────────────────────────────
async function handlePartner(request, origin) {
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonResp(400, { ok: false, error: 'Invalid request body.' }, origin);
  }

  const { name, email, business, message, bot } = data;

  // Honeypot
  if (bot) return jsonResp(200, { ok: true }, origin);

  // Validation
  if (!name?.trim() || !email?.trim() || !business?.trim() || !message?.trim()) {
    return jsonResp(400, { ok: false, error: 'Name, email, business name and message are required.' }, origin);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResp(400, { ok: false, error: 'Please enter a valid email address.' }, origin);
  }
  if (message.trim().length < 10) {
    return jsonResp(400, { ok: false, error: 'Message is too short.' }, origin);
  }

  const smtp2goKey = getVar('smtp2go-apikey');
  if (!smtp2goKey) {
    console.error('[GibFlow] smtp2go-apikey variable not found on this script');
    return jsonResp(500, { ok: false, error: 'Server configuration error.' }, origin);
  }

  const ts          = new Date().toISOString();
  const subjectLine = `[GibFlow] Business Enquiry — ${business.trim()} (${name.trim()})`;

  const htmlBody = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#c00f1b;padding:24px 28px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">New Business Enquiry</h1>
    <p style="color:rgba(255,255,255,0.80);margin:4px 0 0;font-size:13px">GibFlow — Work With Us</p>
  </div>
  <div style="background:#fafafa;padding:28px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr>
        <td style="padding:8px 12px 8px 0;color:#666;font-weight:600;width:100px;vertical-align:top">Name</td>
        <td style="padding:8px 0">${escHtml(name)}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px 8px 0;color:#666;font-weight:600;vertical-align:top">Email</td>
        <td style="padding:8px 0"><a href="mailto:${escHtml(email)}" style="color:#c00f1b;text-decoration:none">${escHtml(email)}</a></td>
      </tr>
      <tr>
        <td style="padding:8px 12px 8px 0;color:#666;font-weight:600;vertical-align:top">Business</td>
        <td style="padding:8px 0;font-weight:600">${escHtml(business)}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px 8px 0;color:#666;font-weight:600;vertical-align:top">Sent</td>
        <td style="padding:8px 0;color:#999;font-size:12px">${ts}</td>
      </tr>
    </table>
    <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0">
    <h3 style="color:#333;font-size:15px;margin:0 0 10px;font-weight:600">Message</h3>
    <div style="background:#fff;padding:16px;border-radius:6px;border:1px solid #e5e5e5;font-size:14px;line-height:1.7;white-space:pre-wrap;color:#333">${escHtml(message)}</div>
    <p style="margin:20px 0 0;font-size:12px;color:#aaa">
      Reply directly to this email to respond to ${escHtml(name)} at ${escHtml(business)}.
    </p>
  </div>
</div>`.trim();

  const textBody = [
    'New Business Enquiry — GibFlow',
    '',
    `Name:     ${name}`,
    `Email:    ${email}`,
    `Business: ${business}`,
    `Sent:     ${ts}`,
    '',
    'Message:',
    message,
    '',
    '---',
    'Sent from gibflow.gi/work-with-us/',
  ].join('\n');

  let emailSent = false;
  try {
    const smtpResp = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key:   smtp2goKey,
        to:        ['GibFlow Team <info@gibflow.gi>'],
        sender:    'GibFlow Website <noreply@gibflow.gi>',
        reply_to:  [`${name} <${email}>`],
        subject:   subjectLine,
        html_body: htmlBody,
        text_body: textBody,
      }),
    });
    const smtpResult = await smtpResp.json();
    emailSent = smtpResult?.data?.succeeded === 1;
    if (!emailSent) {
      console.error('[GibFlow] SMTP2GO non-success (partner):', JSON.stringify(smtpResult));
    }
  } catch (err) {
    console.error('[GibFlow] SMTP2GO fetch threw (partner):', err);
    return jsonResp(500, { ok: false, error: 'Failed to send message. Please try again or email us directly.' }, origin);
  }

  // Log to Bunny Database (best-effort)
  const dbUrl   = getVar('gib-flow-database-url');
  const dbToken = getVar('gibflow-database-full-access-token');

  if (dbUrl && dbToken) {
    const id      = `${ts.replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 7)}`;
    const payload = JSON.stringify({ name, email, business, message, ts, emailSent });

    fetch(`${dbUrl.replace(/\/$/, '')}/partner/${id}.json`, {
      method:  'PUT',
      headers: { AccessKey: dbToken, 'Content-Type': 'application/json' },
      body:    payload,
    }).catch((err) => console.warn('[GibFlow] DB log failed (partner, non-fatal):', err));
  }

  if (!emailSent) {
    return jsonResp(500, { ok: false, error: 'Message could not be delivered. Please email info@gibflow.gi directly.' }, origin);
  }

  return jsonResp(200, { ok: true }, origin);
}

// ── Newsletter subscribe handler ──────────────────────────────────────────────
async function handleSubscribe(request, origin) {
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonResp(400, { ok: false, error: 'Invalid request body.' }, origin);
  }

  const { name, email, consent, bot } = data;

  // Honeypot
  if (bot) return jsonResp(200, { ok: true }, origin);

  // Validation
  if (!name?.trim() || !email?.trim()) {
    return jsonResp(400, { ok: false, error: 'Name and email are required.' }, origin);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResp(400, { ok: false, error: 'Please enter a valid email address.' }, origin);
  }
  if (!consent) {
    return jsonResp(400, { ok: false, error: 'You must agree to the Privacy Policy to sign up.' }, origin);
  }

  const smtp2goKey = getVar('smtp2go-apikey');
  const dbUrl      = getVar('gib-flow-database-url');
  const dbToken    = getVar('gibflow-database-full-access-token');
  const ts         = new Date().toISOString();

  if (!smtp2goKey) {
    console.error('[GibFlow] smtp2go-apikey not found');
    return jsonResp(500, { ok: false, error: 'Server configuration error.' }, origin);
  }

  // ── Store in Bunny Database (fire-and-forget, never blocks the response) ──
  // Note: do NOT await any fetch here — subrequests back to Bunny infrastructure
  // cause a 508 Loop Detected if the DB URL routes through the same pull zone.
  if (dbUrl && dbToken) {
    const key     = btoa(email.toLowerCase().trim());
    const payload = JSON.stringify({
      name:      name.trim(),
      email:     email.toLowerCase().trim(),
      consent:   true,
      consentTs: ts,
      source:    'website-early-access',
    });
    const dbKey = `${dbUrl.replace(/\/$/, '')}/subscribers/${key}.json`;

    fetch(dbKey, {
      method:  'PUT',
      headers: { AccessKey: dbToken, 'Content-Type': 'application/json' },
      body:    payload,
    }).catch((err) => console.warn('[GibFlow] Subscriber DB write failed (non-fatal):', err));
  }

  // ── Internal notification to info@gibflow.gi ──────────────────────────────
  const notifyHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#c00f1b;padding:24px 28px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">New Subscriber</h1>
    <p style="color:rgba(255,255,255,0.80);margin:4px 0 0;font-size:13px">GibFlow Updates List</p>
  </div>
  <div style="background:#fafafa;padding:28px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;font-size:14px">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:8px 12px 8px 0;color:#666;font-weight:600;width:80px">Name</td>
        <td>${escHtml(name)}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px 8px 0;color:#666;font-weight:600">Email</td>
        <td><a href="mailto:${escHtml(email)}" style="color:#c00f1b">${escHtml(email)}</a></td>
      </tr>
      <tr>
        <td style="padding:8px 12px 8px 0;color:#666;font-weight:600">Signed up</td>
        <td style="color:#999;font-size:12px">${ts}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px 8px 0;color:#666;font-weight:600">Consent</td>
        <td style="color:#2e7d32">Privacy Policy accepted</td>
      </tr>
    </table>
  </div>
</div>`.trim();

  // ── Welcome email to subscriber ───────────────────────────────────────────
  const welcomeHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#c00f1b;padding:24px 28px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">You're on the list, ${escHtml(name.split(' ')[0])}.</h1>
    <p style="color:rgba(255,255,255,0.80);margin:4px 0 0;font-size:13px">GibFlow — Gibraltar's Smart Mobility App</p>
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
    // Send both emails in parallel
    const [notifyResp, welcomeResp] = await Promise.all([
      fetch('https://api.smtp2go.com/v3/email/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key:   smtp2goKey,
          to:        ['GibFlow Team <info@gibflow.gi>'],
          sender:    'GibFlow Website <noreply@gibflow.gi>',
          subject:   `[GibFlow] New subscriber: ${name.trim()} <${email}>`,
          html_body: notifyHtml,
          text_body: `New subscriber\nName: ${name}\nEmail: ${email}\nSigned up: ${ts}\nConsent: Privacy Policy accepted`,
        }),
      }),
      fetch('https://api.smtp2go.com/v3/email/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key:   smtp2goKey,
          to:        [`${name.trim()} <${email}>`],
          sender:    'GibFlow <noreply@gibflow.gi>',
          subject:   "You're on the GibFlow list",
          html_body: welcomeHtml,
          text_body: `Hi ${name.split(' ')[0]},\n\nThanks for signing up. We'll keep you updated on GibFlow's progress, including the launch on iOS and Android, new features as they roll out, and anything else worth knowing about getting around Gibraltar.\n\nWe'll only email you when there's something worth telling you.\n\nTo unsubscribe, reply with "Unsubscribe" in the subject line.\n\nGibFlow Team\nhttps://gibflow.gi`,
        }),
      }),
    ]);

    const [notifyResult, welcomeResult] = await Promise.all([
      notifyResp.json().catch(() => ({})),
      welcomeResp.json().catch(() => ({})),
    ]);

    if (notifyResult?.data?.succeeded !== 1) {
      console.warn('[GibFlow] Subscriber notify email failed:', JSON.stringify(notifyResult));
    }
    if (welcomeResult?.data?.succeeded !== 1) {
      console.warn('[GibFlow] Welcome email failed:', JSON.stringify(welcomeResult));
    }
  } catch (err) {
    console.error('[GibFlow] Subscribe email error:', err);
    // Still return success — DB record was written
  }

  return jsonResp(200, { ok: true }, origin);
}
