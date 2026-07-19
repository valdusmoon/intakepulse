import { NextResponse } from "next/server";
import { getBusinessById } from "@/lib/db/queries/businesses";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "popup"; // "popup" | "inline"

  if (!UUID_RE.test(businessId)) {
    return new NextResponse("// Callverted: invalid business ID", {
      status: 400,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const business = await getBusinessById(businessId);
  if (!business) {
    return new NextResponse("// Callverted: business not found", {
      status: 404,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.callverted.com";
  const intakeUrl = `${appUrl}/intake/${businessId}?source=website_widget`;
  const label = (business.businessName ?? "Get a Free Assessment").replace(/'/g, "\\'");

  const popupScript = `
(function () {
  if (document.getElementById('ip-widget-root')) return;
  var root = document.createElement('div');
  root.id = 'ip-widget-root';
  document.body.appendChild(root);

  var INTAKE_URL = '${intakeUrl}';
  var LABEL = '${label}';

  var style = document.createElement('style');
  style.textContent = [
    '#ip-btn{position:fixed;bottom:24px;right:24px;z-index:99998;background:#2454d8;color:#fff;border:none;',
    'border-radius:50px;padding:14px 22px;font-size:15px;font-weight:700;font-family:system-ui,sans-serif;',
    'cursor:pointer;box-shadow:0 4px 20px rgba(36,84,216,0.4);transition:transform .15s,box-shadow .15s;}',
    '#ip-btn:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(36,84,216,0.5);}',
    '#ip-overlay{display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.55);}',
    '#ip-overlay.open{display:flex;align-items:center;justify-content:center;}',
    '#ip-modal{background:#fff;border-radius:16px;overflow:hidden;width:min(440px,96vw);',
    'height:min(680px,92vh);display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.25);}',
    '#ip-modal-header{display:flex;align-items:center;justify-content:space-between;',
    'padding:14px 18px;border-bottom:1px solid #f3f4f6;}',
    '#ip-modal-title{font-size:14px;font-weight:600;color:#111;font-family:system-ui,sans-serif;}',
    '#ip-close{background:none;border:none;cursor:pointer;color:#9ca3af;font-size:22px;line-height:1;padding:2px 8px;}',
    '#ip-close:hover{color:#374151;}',
    '#ip-frame{flex:1;border:none;width:100%;}'
  ].join('');
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.id = 'ip-btn';
  btn.textContent = '\\uD83D\\uDCCB Free Assessment';
  root.appendChild(btn);

  var overlay = document.createElement('div');
  overlay.id = 'ip-overlay';
  overlay.innerHTML = '<div id="ip-modal">' +
    '<div id="ip-modal-header">' +
    '<span id="ip-modal-title">' + LABEL + '</span>' +
    '<button id="ip-close" aria-label="Close">&times;</button>' +
    '</div>' +
    '<iframe id="ip-frame" src="' + INTAKE_URL + '" allow="clipboard-write"></iframe>' +
    '</div>';
  root.appendChild(overlay);

  function open() { overlay.classList.add('open'); }
  function close() { overlay.classList.remove('open'); }

  btn.addEventListener('click', open);
  document.getElementById('ip-close').addEventListener('click', close);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') close(); });
  // Deliberately no auto-close on completion: the confirmation screen reads the
  // job back and sets the callback expectation, so it has to stay readable. The
  // close button, backdrop click, and Escape all still dismiss it.
})();
`.trim();

  const inlineScript = `
(function () {
  var INTAKE_URL = '${intakeUrl}';
  var targets = document.querySelectorAll('[data-ip-embed]');
  if (!targets.length) return;

  var style = document.createElement('style');
  style.textContent = '.ip-inline-frame{width:100%;border:none;border-radius:12px;display:block;}';
  document.head.appendChild(style);

  targets.forEach(function(el) {
    var height = el.getAttribute('data-ip-height') || '640';
    var frame = document.createElement('iframe');
    frame.src = INTAKE_URL;
    frame.className = 'ip-inline-frame';
    frame.style.height = height + 'px';
    frame.allow = 'clipboard-write';
    el.appendChild(frame);
  });

  // Completion used to dim the frame; it now holds the read-back confirmation,
  // so it stays at full opacity. The form still posts 'ip:intake-complete' for
  // host pages that want to hook their own analytics onto it.
})();
`.trim();

  const buttonScript = `
(function () {
  var INTAKE_URL = '${intakeUrl}';
  var LABEL = '${label}';
  var targets = document.querySelectorAll('[data-ip-button]');
  if (!targets.length) return;

  var style = document.createElement('style');
  style.textContent = [
    '.ip-btn{display:inline-block;background:#2454d8;color:#fff;text-decoration:none;',
    'border-radius:10px;padding:14px 28px;font-size:15px;font-weight:700;',
    'font-family:system-ui,sans-serif;box-shadow:0 4px 16px rgba(36,84,216,0.35);',
    'transition:transform .15s,box-shadow .15s;}',
    '.ip-btn:hover{transform:translateY(-2px);box-shadow:0 6px 22px rgba(36,84,216,0.45);color:#fff;}'
  ].join('');
  document.head.appendChild(style);

  targets.forEach(function(el) {
    var text = el.getAttribute('data-ip-label') || 'Get a Free Assessment';
    var target = el.getAttribute('data-ip-target') || '_blank';
    var a = document.createElement('a');
    a.href = INTAKE_URL;
    a.target = target;
    a.rel = 'noopener noreferrer';
    a.className = 'ip-btn';
    a.textContent = text;
    el.appendChild(a);
  });
})();
`.trim();

  const script = mode === "inline" ? inlineScript : mode === "button" ? buttonScript : popupScript;

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
