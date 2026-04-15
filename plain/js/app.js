/**
 * GymFlow — Main Application Controller
 * =======================================
 * Handles navigation (hash-based SPA routing), event wiring,
 * form validation, check-in keypad, and lifecycle management.
 */

const app = {

    /** @type {GymSystem} */
    system: null,
    currentView: 'dashboard',

    // ── Initialisation ───────────────────────────────────────

    init() {
        this.system = new GymSystem();
        this.system.load();

        this._setupNavigation();
        this._setupEventListeners();
        this._renderPlanCards();
        this._navigateTo(window.location.hash.slice(1) || 'dashboard');
    },

    // ── Navigation ───────────────────────────────────────────

    _setupNavigation() {
        window.addEventListener('hashchange', () => {
            this._navigateTo(window.location.hash.slice(1) || 'dashboard');
        });

        // Sidebar nav clicks
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.hash = item.dataset.view;
            });
        });

        // Mobile bottom-nav clicks
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.hash = item.dataset.view;
            });
        });
    },

    _navigateTo(viewName) {
        const valid = ['dashboard', 'register', 'checkin', 'logs'];
        if (!valid.includes(viewName)) viewName = 'dashboard';
        this.currentView = viewName;

        // Update sidebar active state
        document.querySelectorAll('.nav-item').forEach(el =>
            el.classList.toggle('active', el.dataset.view === viewName)
        );

        // Update mobile nav active state
        document.querySelectorAll('.mobile-nav-item').forEach(el =>
            el.classList.toggle('active', el.dataset.view === viewName)
        );

        // Show target view, hide others
        document.querySelectorAll('.view').forEach(v =>
            v.classList.toggle('active', v.id === `view-${viewName}`)
        );

        this._refreshView(viewName);
    },

    _refreshView(viewName) {
        switch (viewName) {
            case 'dashboard':
                UI.renderDashboard(this.system.getMetrics());
                UI.renderRecentActivity(this.system.getRecentLogs(5));
                break;
            case 'register':
                UI.renderMembersTable(this.system.getAllMembers());
                break;
            case 'checkin':
                this._clearKeypad();
                break;
            case 'logs':
                UI.renderAccessLogs(this.system.getAccessLogs());
                break;
        }
    },

    // ── Event Listeners ──────────────────────────────────────

    _setupEventListeners() {

        /* Registration form */
        const form = document.getElementById('registrationForm');
        if (form) form.addEventListener('submit', e => { e.preventDefault(); this._handleRegistration(); });

        /* Plan card selection (delegated) */
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.plan-card');
            if (!card) return;
            document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            document.getElementById('selectedPlan').value = card.dataset.tier;
        });

        /* Keypad buttons */
        document.querySelectorAll('.keypad-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const value  = btn.dataset.value;
                if      (action === 'clear')     this._clearKeypad();
                else if (action === 'backspace') this._keypadBackspace();
                else if (action === 'enter')     this._handleCheckIn();
                else if (value)                  this._keypadInput(value);
            });
        });

        /* Manual ID input Enter key */
        const idInput = document.getElementById('checkinIdInput');
        if (idInput) {
            idInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') { e.preventDefault(); this._handleCheckIn(); }
            });
        }

        /* Modal close */
        document.getElementById('modalClose')?.addEventListener('click', () => UI.closeModal());
        document.getElementById('modalOverlay')?.addEventListener('click', e => {
            if (e.target.id === 'modalOverlay') UI.closeModal();
        });

        /* Quick-action buttons on dashboard */
        document.getElementById('btnQuickRegister')?.addEventListener('click', () => { window.location.hash = 'register'; });
        document.getElementById('btnQuickCheckin')?.addEventListener('click',  () => { window.location.hash = 'checkin'; });

        /* Access-log filter */
        document.getElementById('logFilter')?.addEventListener('change', e => this._filterLogs(e.target.value));

        /* Keyboard support for check-in keypad */
        document.addEventListener('keydown', (e) => {
            if (this.currentView !== 'checkin') return;
            if (e.key >= '0' && e.key <= '9')  this._keypadInput(e.key);
            else if (e.key === 'Enter')         this._handleCheckIn();
            else if (e.key === 'Backspace')     { e.preventDefault(); this._keypadBackspace(); }
            else if (e.key === 'Escape')        this._clearKeypad();
        });
    },

    // ── Registration ─────────────────────────────────────────

    _renderPlanCards() {
        const container = document.getElementById('planCards');
        if (!container) return;

        const plans     = MembershipPlan.getAvailablePlans();
        const tierIcons = { Basic: '🏋️', Premium: '⭐', VIP: '👑' };

        container.innerHTML = Object.values(plans).map(p => `
            <div class="plan-card plan-${p.tier.toLowerCase()}" data-tier="${p.tier}">
                <div class="plan-icon">${tierIcons[p.tier]}</div>
                <h3 class="plan-name">${p.tier}</h3>
                <div class="plan-price">$${p.price}<span>/mo</span></div>
                <div class="plan-duration">${p.durationMonths} month${p.durationMonths > 1 ? 's' : ''}</div>
                <ul class="plan-perks">
                    ${p.perks.map(k => `<li>${k}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    },

    _handleRegistration() {
        const name  = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const plan  = document.getElementById('selectedPlan').value;

        if (!name)                   { UI.showToast('Please enter a name', 'error'); return; }
        if (!email || !email.includes('@')) { UI.showToast('Please enter a valid email', 'error'); return; }
        if (!phone)                  { UI.showToast('Please enter a phone number', 'error'); return; }
        if (!plan)                   { UI.showToast('Please select a membership plan', 'error'); return; }

        try {
            const member = this.system.addMember(name, email, phone, plan);
            UI.showToast(`${name} registered! ID: ${member.memberId}`, 'success');

            // Reset form
            document.getElementById('registrationForm').reset();
            document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
            document.getElementById('selectedPlan').value = '';

            // Refresh member list
            UI.renderMembersTable(this.system.getAllMembers());
        } catch (err) {
            UI.showToast(err.message, 'error');
        }
    },

    // ── Check-in Keypad ──────────────────────────────────────

    _keypadInput(digit) {
        const el = document.getElementById('checkinIdInput');
        if (el.value.length < 6) el.value += digit;
    },

    _keypadBackspace() {
        const el = document.getElementById('checkinIdInput');
        el.value = el.value.slice(0, -1);
    },

    _clearKeypad() {
        const el = document.getElementById('checkinIdInput');
        if (el) el.value = '';
        UI.resetCheckInDisplay();
    },

    _handleCheckIn() {
        const el       = document.getElementById('checkinIdInput');
        const memberId = el.value.trim();
        if (!memberId) { UI.showToast('Please enter a member ID', 'warning'); return; }

        const result = this.system.checkIn(memberId);
        UI.renderCheckInResult(result);

        // Clear input after brief delay so the user sees their input
        setTimeout(() => { el.value = ''; }, 1000);
    },

    // ── Member Detail Modal ──────────────────────────────────

    viewMemberDetail(memberId) {
        const m = this.system.getMemberById(memberId);
        if (!m) return;

        const html = `
            <div class="member-detail">
                <div class="member-detail-header">
                    <div class="member-avatar">${m.name.charAt(0).toUpperCase()}</div>
                    <div>
                        <h3>${UI._esc(m.name)}</h3>
                        <span class="badge badge-${m.plan.tier.toLowerCase()}">${m.getDisplayBadge()}</span>
                    </div>
                </div>
                <div class="member-detail-grid">
                    <div class="detail-item"><label>Member ID</label><span>${m.memberId}</span></div>
                    <div class="detail-item"><label>Email</label><span>${UI._esc(m.email)}</span></div>
                    <div class="detail-item"><label>Phone</label><span>${UI._esc(m.phone)}</span></div>
                    <div class="detail-item"><label>Member Since</label><span>${UI._fmtDate(m.memberSince)}</span></div>
                    <div class="detail-item"><label>Expires</label><span>${UI._fmtDate(m.expiryDate)}</span></div>
                    <div class="detail-item">
                        <label>Status</label>
                        <span>
                            <span class="status-dot status-${m.isActive() ? 'active' : 'expired'}"></span>
                            ${m.isActive() ? `Active (${m.getDaysRemaining()} days left)` : 'Expired'}
                        </span>
                    </div>
                    <div class="detail-item" style="grid-column:span 2">
                        <label>Plan Perks</label>
                        <ul class="detail-perks">
                            ${m.plan.perks.map(p => `<li>${p}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>`;

        UI.showModal('Member Details', html);
    },

    // ── Log Filtering ────────────────────────────────────────

    _filterLogs(filter) {
        let logs = this.system.getAccessLogs();
        if (filter === 'granted') logs = logs.filter(l => l.status === 'granted');
        if (filter === 'denied')  logs = logs.filter(l => l.status === 'denied');
        UI.renderAccessLogs(logs);
    }
};

/* ── Bootstrap ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => app.init());
