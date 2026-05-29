(function () {
  "use strict";

  var BRAND_COLOR = "#f97316";
  var MODAL_Z = "2147483647";

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function buildIframe(src) {
    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.style.cssText = "width:100%;height:100%;border:none;display:block;";
    iframe.allow = "camera";
    iframe.title = "Get a Free Quote";
    return iframe;
  }

  function getBase() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src;
      if (src && src.indexOf("widget.js") !== -1) {
        return src.replace(/\/widget\.js.*$/, "");
      }
    }
    return window.location.origin;
  }

  function getQuoteUrl(companyId) {
    return getBase() + "/quote/" + companyId;
  }

  // ─── Inline widget ─────────────────────────────────────────────────────────
  // Usage: <div class="craftcapture-inline-widget" data-company="COMPANY_ID" style="height:700px;"></div>

  function initInline() {
    var els = document.querySelectorAll(".craftcapture-inline-widget");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.getAttribute("data-cc-init")) continue;
      el.setAttribute("data-cc-init", "1");
      var companyId = el.getAttribute("data-company");
      if (!companyId) continue;
      if (!el.style.height) el.style.height = "700px";
      el.style.overflow = "hidden";
      el.appendChild(buildIframe(getQuoteUrl(companyId)));
    }
  }

  // ─── Modal ─────────────────────────────────────────────────────────────────

  var modalOpen = false;
  var modalEl = null;

  function openModal(companyId) {
    if (modalOpen) return;
    modalOpen = true;

    // Overlay
    var overlay = document.createElement("div");
    overlay.id = "cc-modal-overlay";
    overlay.style.cssText = [
      "position:fixed;inset:0;",
      "background:rgba(0,0,0,0.55);",
      "z-index:" + MODAL_Z + ";",
      "display:flex;align-items:center;justify-content:center;",
      "padding:16px;",
      "box-sizing:border-box;",
    ].join("");

    // Modal box
    var box = document.createElement("div");
    box.style.cssText = [
      "position:relative;",
      "width:100%;max-width:480px;",
      "height:90vh;max-height:780px;",
      "background:#fff;",
      "border-radius:16px;",
      "overflow:hidden;",
      "box-shadow:0 24px 64px rgba(0,0,0,0.25);",
    ].join("");

    // Close button
    var closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&#x2715;";
    closeBtn.style.cssText = [
      "position:absolute;top:12px;right:12px;",
      "width:32px;height:32px;",
      "border-radius:50%;border:none;",
      "background:rgba(0,0,0,0.15);color:#fff;",
      "font-size:14px;cursor:pointer;",
      "z-index:1;line-height:1;",
    ].join("");
    closeBtn.onclick = closeModal;

    box.appendChild(closeBtn);
    box.appendChild(buildIframe(getQuoteUrl(companyId)));
    overlay.appendChild(box);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    modalEl = overlay;
  }

  function closeModal() {
    if (modalEl) {
      document.body.removeChild(modalEl);
      modalEl = null;
    }
    document.body.style.overflow = "";
    modalOpen = false;
  }

  // ─── Badge widget ──────────────────────────────────────────────────────────
  // Floating bottom-right button

  function initBadge(options) {
    var companyId = options.companyId;
    var text = options.text || "Get a Free Quote";
    var color = options.color || BRAND_COLOR;
    var textColor = options.textColor || "#ffffff";

    var btn = document.createElement("button");
    btn.id = "cc-badge-btn";
    btn.innerText = text;
    btn.style.cssText = [
      "position:fixed;bottom:24px;right:24px;",
      "background:" + color + ";color:" + textColor + ";",
      "border:none;border-radius:999px;",
      "padding:14px 22px;",
      "font-size:15px;font-weight:600;",
      "cursor:pointer;",
      "box-shadow:0 4px 20px rgba(0,0,0,0.2);",
      "z-index:" + (MODAL_Z - 1) + ";",
      "transition:transform 0.15s,box-shadow 0.15s;",
    ].join("");
    btn.onmouseenter = function () {
      btn.style.transform = "scale(1.04)";
      btn.style.boxShadow = "0 6px 24px rgba(0,0,0,0.28)";
    };
    btn.onmouseleave = function () {
      btn.style.transform = "";
      btn.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
    };
    btn.onclick = function () { openModal(companyId); };
    document.body.appendChild(btn);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  window.CraftCapture = {
    initBadgeWidget: initBadge,
    openWidget: function (companyId) { openModal(companyId); },
    closeWidget: closeModal,
  };

  // Auto-init inline widgets
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInline);
  } else {
    initInline();
  }
})();
