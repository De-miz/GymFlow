/**
 * GymFlow — UI Rendering Module
 * ==============================
 * Pure DOM-rendering functions. No state management here —
 * the app controller (app.js) calls these with data from GymSystem.
 */

const UI = {

    // ── Toast Notifications ──────────────────────────────────

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast     = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // trigger slide-in
        requestAnimationFrame(() => toast.classList.add('toast-visible'));

        // auto-dismiss after 3 s
        setTimeout(() => {
            toast.classList.remove('toast-visible');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    },

    // ── Modal ────────────────────────────────────────────────

    showModal(title, contentHTML) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML    = contentHTML;
        document.getElementById('modalOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        document.body.style.overflow = '';
    },

    // ── Dashboard ────────────────────────────────────────────

    renderDashboard(metrics) {
        this._animateCounter('metricTotal',   metrics.totalMembers);
        this._animateCounter('metricActive',  metrics.activeToday);
        this._animateCounter('metricDenied',  metrics.deniedToday);
        this._animateCounter('metricRevenue', metrics.monthlyRevenue, true);
    },

    renderRecentActivity(logs) {
        const el = document.getElementById('recentActivity');
        if (!logs.length) {
            el.innerHTML = '<p class="empty-state">No recent activity</p>';
            return;
        }
        el.innerHTML = logs.map(log => `
            <div class="activity-item">
                <div class="activity-status activity-${log.status}">
                    ${log.status === 'granted' ? '✓' : '✕'}
                </div>
                <div class="activity-info">
                    <span class="activity-name">${this._esc(log.memberName)}</span>
                    <span class="activity-detail">${this._esc(log.reason)}</span>
                </div>
                <span class="activity-time">${this._fmtTime(log.timestamp)}</span>
            </div>
        `).join('');
    },

    // ── Members Table ────────────────────────────────────────

    renderMembersTable(members) {
        const tbody = document.getElementById('membersTableBody');
        if (!members.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No members registered</td></tr>';
            return;
        }
        tbody.innerHTML = members.map(m => `
            <tr class="member-row" data-id="${m.memberId}">
                <td><span class="member-id">${m.memberId}</span></td>
                <td>${this._esc(m.name)}</td>
                <td><span class="badge badge-${m.plan.tier.toLowerCase()}">${m.plan.tier}</span></td>
                <td>${this._fmtDate(m.expiryDate)}</td>
                <td>
                    <span class="status-dot status-${m.isActive() ? 'active' : 'expired'}"></span>
                    ${m.isActive() ? 'Active' : 'Expired'}
                </td>
                <td>
                    <button class="btn-icon" onclick="app.viewMemberDetail('${m.memberId}')" title="View Details">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    // ── Check-in Result ──────────────────────────────────────

    renderCheckInResult(result) {
        const container = document.getElementById('checkinResultContainer');
        const display   = document.getElementById('checkinResult');

        // Reset classes
        container.className = 'checkin-result-container';

        if (result.success) {
            container.classList.add('result-granted');
            display.innerHTML = `
                <div class="result-animate">
                    <div class="result-icon result-icon-granted">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="64" height="64">
                            <path d="M20 6L9 17l-5-5"/>
                        </svg>
                    </div>
                    <h2 class="result-title">Access Granted</h2>
                    <p class="result-member-name">${this._esc(result.member.name)}</p>
                    <span class="badge badge-${result.member.plan.tier.toLowerCase()}">${result.member.getDisplayBadge()}</span>
                    <p class="result-detail">Expires ${this._fmtDate(result.member.expiryDate)}</p>
                </div>`;
        } else {
            container.classList.add('result-denied');
            display.innerHTML = `
                <div class="result-animate">
                    <div class="result-icon result-icon-denied">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="64" height="64">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </div>
                    <h2 class="result-title">Access Denied</h2>
                    <p class="result-member-name">${result.member ? this._esc(result.member.name) : 'Unknown Member'}</p>
                    <p class="result-detail">${this._esc(result.reason)}</p>
                </div>`;
        }

        // Auto-revert to idle state after 4 s
        clearTimeout(this._resultTimer);
        this._resultTimer = setTimeout(() => this.resetCheckInDisplay(), 4000);
    },

    resetCheckInDisplay() {
        const container = document.getElementById('checkinResultContainer');
        const display   = document.getElementById('checkinResult');
        if (!container || !display) return;
        container.className = 'checkin-result-container';
        display.innerHTML = `
            <div class="checkin-wait">
                <div class="checkin-wait-icon">🔒</div>
                <p>Enter a Member ID and press SCAN</p>
            </div>`;
    },

    // ── Access Logs ──────────────────────────────────────────

    renderAccessLogs(logs) {
        const tbody = document.getElementById('logsTableBody');
        if (!logs.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No access logs recorded</td></tr>';
            return;
        }
        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${this._fmtDateTime(log.timestamp)}</td>
                <td><span class="member-id">${log.memberId}</span></td>
                <td>${this._esc(log.memberName)}</td>
                <td><span class="badge badge-${log.planTier.toLowerCase()}">${log.planTier}</span></td>
                <td>
                    <span class="log-status log-status-${log.status}">
                        ${log.status === 'granted' ? '✓ Granted' : '✕ Denied'}
                    </span>
                </td>
                <td>${this._esc(log.reason)}</td>
            </tr>
        `).join('');
    },

    // ── Helpers ──────────────────────────────────────────────

    _resultTimer: null,

    _animateCounter(id, target, isCurrency = false) {
        const el = document.getElementById(id);
        if (!el) return;

        const current = parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || 0;
        const duration = 800;
        const start    = performance.now();

        const tick = (now) => {
            const t     = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);              // ease-out cubic
            const val   = Math.round(current + (target - current) * eased);
            el.textContent = isCurrency
                ? `$${val.toLocaleString()}`
                : val.toLocaleString();
            if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    },

    _fmtTime(d) {
        return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    },
    _fmtDate(d) {
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
    _fmtDateTime(d) {
        return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    /** Basic HTML-escape to prevent XSS when rendering user input. */
    _esc(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
};
