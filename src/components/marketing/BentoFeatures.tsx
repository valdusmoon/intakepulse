export function BentoFeatures() {
  return (
    <div className="l-bento-grid">

      {/* CELL 1 — Lead Capture: col 1, rows 1-2, tall */}
      <div className="l-bc l-bc-leadcap">
        <div className="l-bc-label">Lead Capture</div>
        <div className="l-bc-title">Leads arrive ready to quote</div>
        <p className="l-bc-desc">Homeowners submit project details, photos, and get an instant estimate — before you ever pick up the phone.</p>
        <div className="l-mock-leads">
          <div className="l-mock-lead-card">
            <div className="l-mock-lead-left">
              <div className="l-mock-lead-av">SM</div>
              <div>
                <div className="l-mock-lead-name">
                  Sarah M.
                  <span className="l-mock-badge-new">NEW</span>
                </div>
                <div className="l-mock-lead-meta">Interior · 2 min ago</div>
              </div>
            </div>
            <div className="l-mock-lead-est">$1,800–$2,550</div>
          </div>
          <div className="l-mock-lead-card">
            <div className="l-mock-lead-left">
              <div className="l-mock-lead-av l-mock-lead-av--blue">JR</div>
              <div>
                <div className="l-mock-lead-name">James R.</div>
                <div className="l-mock-lead-meta">Exterior · 1 hr ago</div>
              </div>
            </div>
            <div className="l-mock-lead-est">$4,200–$6,100</div>
          </div>
          <div className="l-mock-lead-card l-mock-lead-card--dim">
            <div className="l-mock-lead-left">
              <div className="l-mock-lead-av l-mock-lead-av--green">LK</div>
              <div>
                <div className="l-mock-lead-name">Linda K.</div>
                <div className="l-mock-lead-meta">Interior + Exterior · Yesterday</div>
              </div>
            </div>
            <div className="l-mock-lead-est">$6,500–$9,200</div>
          </div>
        </div>
      </div>

      {/* CELL 2 — Estimate: col 2, row 1 */}
      <div className="l-bc l-bc-estimate">
        <div className="l-bc-label">Instant Estimate</div>
        <div className="l-bc-title">Ballpark before the callback</div>
        <div className="l-mock-est-box">
          <div className="l-mock-est-tag">AI Estimate Range</div>
          <div className="l-mock-est-range">$1,800 – $2,550</div>
          <div className="l-mock-est-note">Interior · 3 rooms · Good condition</div>
          <div className="l-mock-conf">
            <div className="l-mock-conf-track">
              <div className="l-mock-conf-fill"></div>
            </div>
            <span className="l-mock-conf-lbl">High confidence</span>
          </div>
        </div>
      </div>

      {/* CELL 3 — Pipeline: col 2, row 2 */}
      <div className="l-bc l-bc-pipeline">
        <div className="l-bc-label">Pipeline</div>
        <div className="l-bc-title">Every job at a glance</div>
        <div className="l-mock-kanban">
          <div className="l-mock-kol">
            <div className="l-mock-kol-hd">New <span className="l-mock-kcount">4</span></div>
            <div className="l-mock-kcard"></div>
            <div className="l-mock-kcard"></div>
          </div>
          <div className="l-mock-kol">
            <div className="l-mock-kol-hd">Quoted <span className="l-mock-kcount l-mock-kcount--orange">3</span></div>
            <div className="l-mock-kcard"></div>
            <div className="l-mock-kcard"></div>
          </div>
          <div className="l-mock-kol">
            <div className="l-mock-kol-hd">Won <span className="l-mock-kcount l-mock-kcount--green">2</span></div>
            <div className="l-mock-kcard"></div>
            <div className="l-mock-kcard"></div>
          </div>
        </div>
      </div>

      {/* CELL 4 — Quote: col 1, row 3 */}
      <div className="l-bc l-bc-quote">
        <div className="l-bc-label">Quotes</div>
        <div className="l-bc-title">Professional quotes, fast</div>
        <div className="l-mock-quote-table">
          <div className="l-mock-qt-row l-mock-qt-head">
            <span>Line item</span>
            <span>Amount</span>
          </div>
          <div className="l-mock-qt-row">
            <span>Living Room</span>
            <span>$840</span>
          </div>
          <div className="l-mock-qt-row">
            <span>Master Bedroom</span>
            <span>$620</span>
          </div>
          <div className="l-mock-qt-row">
            <span>Hallway</span>
            <span>$310</span>
          </div>
          <div className="l-mock-qt-row l-mock-qt-total">
            <span>Total</span>
            <span>$1,770</span>
          </div>
        </div>
      </div>

      {/* CELL 5 — Contract: col 2, row 3 */}
      <div className="l-bc l-bc-contract">
        <div className="l-bc-label">Contracts</div>
        <div className="l-bc-title">Signed from anywhere</div>
        <div className="l-mock-contract">
          <div className="l-mock-contract-check">✓</div>
          <div className="l-mock-contract-signed">Contract Signed</div>
          <div className="l-mock-contract-by">by Sarah M.</div>
          <div className="l-mock-contract-date">April 12, 2026 · 2:34 PM</div>
          <div className="l-mock-contract-sig">Sarah Mitchell</div>
        </div>
      </div>

      {/* CELL 6 — Review Request: full width, row 4 */}
      <div className="l-bc l-bc-review">
        <div className="l-bc-review-inner">
          <div className="l-bc-review-left">
            <div className="l-bc-label l-bc-label--light">Review Requests</div>
            <div className="l-bc-title l-bc-title--light">More 5-star reviews, automatically</div>
            <p className="l-bc-desc l-bc-desc--light">Mark a job complete and CraftCapture sends a review request to the homeowner — no copy-pasting links, no chasing.</p>
          </div>
          <div className="l-bc-review-right">
            <div className="l-mock-email">
              <div className="l-mock-email-hd">
                <div className="l-mock-email-from">CraftCapture · Review Request</div>
                <div className="l-mock-email-to">To: sarah@example.com</div>
              </div>
              <div className="l-mock-email-body">
                <div className="l-mock-email-stars">★★★★★</div>
                <p className="l-mock-email-msg">How did we do, Sarah? If you&apos;re happy with your paint job, a quick Google review means the world to us.</p>
                <div className="l-mock-email-btn">Leave a Google Review →</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
