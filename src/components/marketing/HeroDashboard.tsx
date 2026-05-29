export function HeroDashboard() {
  return (
    <div className="l-hdash">
      <div className="l-hdash-chrome">
        <div className="l-ddots">
          <div className="l-ddot" style={{ background: "#FF5F57" }} />
          <div className="l-ddot" style={{ background: "#FEBC2E" }} />
          <div className="l-ddot" style={{ background: "#28C840" }} />
        </div>
        <div className="l-hdash-url" />
      </div>
      <div className="l-hdash-body">
        <div className="l-hdash-row-hd">
          <span className="l-hdash-title">Leads</span>
          <span className="l-hdash-add">+ Add lead</span>
        </div>
        <div className="l-hdash-table">
          <div className="l-hdash-thead">
            <span>Contact</span>
            <span>Service</span>
            <span>Estimate</span>
            <span>Status</span>
          </div>
          <div className="l-hdash-tr">
            <div className="l-hdash-contact">
              <div className="l-hdash-av l-hdash-av--orange">SM</div>
              <div>
                <div className="l-hdash-name">Sarah M. <span className="l-mock-badge-new">NEW</span></div>
                <div className="l-hdash-ph">2 min ago</div>
              </div>
            </div>
            <div className="l-hdash-svc">Interior</div>
            <div className="l-hdash-est">$1,800–$2,550</div>
            <div><span className="l-hbadge l-hb-new">New</span></div>
          </div>
          <div className="l-hdash-tr">
            <div className="l-hdash-contact">
              <div className="l-hdash-av l-hdash-av--blue">JR</div>
              <div>
                <div className="l-hdash-name">James R.</div>
                <div className="l-hdash-ph">1 hr ago</div>
              </div>
            </div>
            <div className="l-hdash-svc">Exterior</div>
            <div className="l-hdash-est">$4,200–$6,100</div>
            <div><span className="l-hbadge l-hb-quoted">Quoted</span></div>
          </div>
          <div className="l-hdash-tr">
            <div className="l-hdash-contact">
              <div className="l-hdash-av l-hdash-av--green">LK</div>
              <div>
                <div className="l-hdash-name">Linda K.</div>
                <div className="l-hdash-ph">Yesterday</div>
              </div>
            </div>
            <div className="l-hdash-svc">Int + Ext</div>
            <div className="l-hdash-est">$6,500–$9,200</div>
            <div><span className="l-hbadge l-hb-won">Won</span></div>
          </div>
          <div className="l-hdash-tr">
            <div className="l-hdash-contact">
              <div className="l-hdash-av l-hdash-av--purple">MD</div>
              <div>
                <div className="l-hdash-name">Marcus D.</div>
                <div className="l-hdash-ph">2 days ago</div>
              </div>
            </div>
            <div className="l-hdash-svc">Exterior</div>
            <div className="l-hdash-est">$3,100–$4,400</div>
            <div><span className="l-hbadge l-hb-sched">Scheduled</span></div>
          </div>
        </div>
        <div className="l-hdash-toast">
          <span className="l-hdash-toast-dot" />
          New lead via your quote link · Sarah M. · Interior · est. $1,800–$2,550
        </div>
      </div>
    </div>
  );
}
