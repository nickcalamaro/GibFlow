/**
 * GibFlow Contact Form Worker
 * ─────────────────────────────────────────────────────────────────────────────
 * Accepts a JSON POST from the GibFlow contact form, validates it, then sends
 * the message via SMTP2GO's REST API to info@gibflow.gi.
 *
 * Secrets (never stored in this file — injected at deploy time):
 *   SMTP2GO_SECRET  — SMTP2GO API key (set via GitHub Actions or wrangler CLI)
 *
 * CORS origins allowed:
 *   https://gibflow.gi, https://www.gibflow.gi, http://localhost:1313
 */

const ALLOWED_ORIGINS = [
  'https://gibflow.gi',
  'https://www.gibflow.gi',
  'http://localhost:1313', // Hugo dev server
];

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

/** Escape user input before embedding in HTML email body. */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // ── CORS preflight ───────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return jsonResp(405, { ok: false, error: 'Method not allowed.' }, origin);
    }

    // ── Parse body ───────────────────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResp(400, { ok: false, error: 'Invalid request body.' }, origin);
    }

    // ── Honeypot — bots fill the hidden `website` field ──────────────────────
    if (body.website) {
      return jsonResp(200, { ok: true }, origin); // silently accept
    }

    // ── Validate ─────────────────────────────────────────────────────────────
    const name    = (body.name    || '').trim().slice(0, 100);
    const email   = (body.email   || '').trim().slice(0, 200);
    const message = (body.message || '').trim().slice(0, 5000);

    if (!name || !email || !message) {
      return jsonResp(400, { ok: false, error: 'All fields are required.' }, origin);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResp(400, { ok: false, error: 'Please enter a valid email address.' }, origin);
    }

    // ── Build HTML email ─────────────────────────────────────────────────────
    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4">
  <div style="max-width:600px;margin:2rem auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0">

    <div style="background:#c00f1b;padding:1.5rem 2rem">
      <h1 style="margin:0;color:#ffffff;font-size:1.125rem;font-weight:700;letter-spacing:-0.01em">
        GibFlow &mdash; New Website Enquiry
      </h1>
    </div>

    <div style="padding:2rem">
      <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
        <tr>
          <td style="padding:0.5rem 1rem 0.5rem 0;color:#666;width:80px;vertical-align:top;font-weight:600">Name</td>
          <td style="padding:0.5rem 0;color:#111">${escHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding:0.5rem 1rem 0.5rem 0;color:#666;vertical-align:top;font-weight:600">Email</td>
          <td style="padding:0.5rem 0">
            <a href="mailto:${escHtml(email)}" style="color:#c00f1b;text-decoration:none">${escHtml(email)}</a>
          </td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid #eeeeee;margin:1.5rem 0">

      <p style="margin:0 0 0.75rem;color:#666;font-size:0.875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.04em">Message</p>
      <div style="background:#fafafa;border-left:3px solid #c00f1b;padding:1rem 1.25rem;border-radius:0 4px 4px 0;white-space:pre-wrap;color:#333;font-size:0.9rem;line-height:1.7">${escHtml(message)}</div>
    </div>

    <div style="padding:1rem 2rem;background:#f9f9f9;border-top:1px solid #eeeeee;font-size:0.75rem;color:#999">
      Sent via the contact form at gibflow.gi &bull; Reply directly to respond to ${escHtml(name)}.
    </div>

  </div>
</body>
</html>`;

    // ── Call SMTP2GO ──────────────────────────────────────────────────────────
    const smtp2goResp = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key:   env.SMTP2GO_SECRET,
        sender:    'GibFlow Contact <noreply@gibflow.gi>',
        to:        ['GibFlow <info@gibflow.gi>'],
        subject:   `Website enquiry from ${name}`,
        html_body: htmlBody,
        reply_to:  `${name} <${email}>`,
      }),
    });

    const result = await smtp2goResp.json();

    if (result?.data?.succeeded === 1) {
      return jsonResp(200, { ok: true }, origin);
    }

    console.error('SMTP2GO error:', JSON.stringify(result));
    return jsonResp(502, {
      ok: false,
      error: 'Could not send your message. Please email us directly at info@gibflow.gi.',
    }, origin);
  },
};
