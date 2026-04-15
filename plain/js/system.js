/**
 * GymFlow — Controller Layer
 * ===========================
 * GymSystem  (Abstraction) — orchestrates members, check-ins, and logs.
 * AccessLog  — simple data class for timestamped access records.
 */

// ============================================================
//  AccessLog
// ============================================================
class AccessLog {

    static _nextId = 1;

    constructor(memberId, memberName, planTier, status, reason = '') {
        this.id         = AccessLog._nextId++;
        this.memberId   = memberId;
        this.memberName = memberName;
        this.planTier   = planTier;
        this.status     = status;        // 'granted' | 'denied'
        this.reason     = reason;
        this.timestamp  = new Date();
    }

    toJSON() {
        return {
            id:         this.id,
            memberId:   this.memberId,
            memberName: this.memberName,
            planTier:   this.planTier,
            status:     this.status,
            reason:     this.reason,
            timestamp:  this.timestamp.toISOString()
        };
    }

    static fromJSON(data) {
        const log     = new AccessLog(data.memberId, data.memberName, data.planTier, data.status, data.reason);
        log.id        = data.id;
        log.timestamp = new Date(data.timestamp);
        return log;
    }
}


// ============================================================
//  GymSystem  —  Controller  (Abstraction)
// ============================================================
class GymSystem {

    constructor() {
        this._members       = [];
        this._accessLogs    = [];
        this._todayCheckins = new Set();
        this._todayDenials  = 0;
    }

    // ── Member Management ────────────────────────────────────

    addMember(name, email, phone, planTier) {
        const plans = MembershipPlan.getAvailablePlans();
        const plan  = plans[planTier];
        if (!plan) throw new Error(`Invalid plan tier: ${planTier}`);

        // Duplicate-email guard
        if (this._members.find(m => m.email === email)) {
            throw new Error(`A member with email "${email}" already exists`);
        }

        const member = new Member(name, email, phone, plan);
        this._members.push(member);
        this.save();
        return member;
    }

    removeMember(memberId) {
        const idx = this._members.findIndex(m => m.memberId === memberId);
        if (idx === -1) throw new Error(`Member ${memberId} not found`);
        this._members.splice(idx, 1);
        this.save();
    }

    findMember(query) {
        const q = query.toString().toLowerCase().trim();
        return this._members.find(m =>
            m.memberId.toLowerCase() === q ||
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q)
        );
    }

    getMemberById(id) {
        return this._members.find(m => m.memberId === id);
    }

    getAllMembers() {
        return [...this._members];
    }

    // ── Check-in / Access Control ────────────────────────────

    checkIn(memberId) {
        const member = this.getMemberById(memberId);

        /* Unknown ID */
        if (!member) {
            const log = new AccessLog(memberId, 'Unknown', 'N/A', 'denied', 'Member ID not found');
            this._accessLogs.unshift(log);
            this._todayDenials++;
            this.save();
            return { success: false, reason: 'Member ID not found', log };
        }

        /* Inactive / expired */
        if (!member.isActive()) {
            const reason = member.status === 'suspended'
                ? 'Membership suspended'
                : 'Membership expired';

            const log = new AccessLog(memberId, member.name, member.plan.tier, 'denied', reason);
            this._accessLogs.unshift(log);
            this._todayDenials++;
            this.save();
            return { success: false, reason, member, log };
        }

        /* ✅ Access granted */
        const log = new AccessLog(memberId, member.name, member.plan.tier, 'granted', 'Valid membership');
        this._accessLogs.unshift(log);
        this._todayCheckins.add(memberId);
        this.save();
        return { success: true, member, log };
    }

    // ── Metrics ──────────────────────────────────────────────

    getMetrics() {
        const totalMembers  = this._members.length;
        const activeMembers = this._members.filter(m => m.isActive()).length;
        const activeToday   = this._todayCheckins.size;
        const deniedToday   = this._todayDenials;
        const monthlyRevenue = this._members.reduce(
            (sum, m) => sum + (m.isActive() ? m.plan.price : 0), 0
        );

        return { totalMembers, activeMembers, activeToday, deniedToday, monthlyRevenue };
    }

    getAccessLogs()       { return [...this._accessLogs]; }
    getRecentLogs(n = 5)  { return this._accessLogs.slice(0, n); }

    // ── Persistence (localStorage) ───────────────────────────

    save() {
        try {
            const data = {
                members:       this._members.map(m => m.toJSON()),
                accessLogs:    this._accessLogs.map(l => l.toJSON()),
                todayCheckins: [...this._todayCheckins],
                todayDenials:  this._todayDenials,
                nextMemberId:  Member._nextId,
                nextLogId:     AccessLog._nextId,
                savedAt:       new Date().toISOString()
            };
            localStorage.setItem('gymflow_data', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save data:', e);
        }
    }

    load() {
        try {
            const raw = localStorage.getItem('gymflow_data');
            if (!raw) { this._loadSeedData(); return; }

            const data = JSON.parse(raw);

            // Restore ID counters
            if (data.nextMemberId) Member.resetIdCounter(data.nextMemberId);
            if (data.nextLogId)    AccessLog._nextId = data.nextLogId;

            // Restore members & logs
            this._members    = data.members.map(m => Member.fromJSON(m));
            this._accessLogs = data.accessLogs.map(l => AccessLog.fromJSON(l));

            // Reset daily counters when the date rolls over
            const savedDate = new Date(data.savedAt).toDateString();
            const today     = new Date().toDateString();
            if (savedDate === today) {
                this._todayCheckins = new Set(data.todayCheckins || []);
                this._todayDenials  = data.todayDenials || 0;
            } else {
                this._todayCheckins = new Set();
                this._todayDenials  = 0;
            }
        } catch (e) {
            console.error('Failed to load data:', e);
            this._loadSeedData();
        }
    }

    /** Populate seed data so the app isn't empty on first launch. */
    _loadSeedData() {
        const plans = MembershipPlan.getAvailablePlans();

        const seeds = [
            new Member('Alex Johnson',  'alex@email.com',  '555-0101', plans.VIP),
            new Member('Maria Garcia',  'maria@email.com', '555-0102', plans.Premium),
            new Member('James Wilson',  'james@email.com', '555-0103', plans.Basic),
            new Member('Sarah Chen',    'sarah@email.com', '555-0104', plans.Premium),
            new Member('David Kim',     'david@email.com', '555-0105', plans.Basic),
        ];

        this._members = seeds;

        // Seed a few access-log entries
        const now = Date.now();
        const makeSeedLog = (member, minutesAgo) => {
            const l = new AccessLog(member.memberId, member.name, member.plan.tier, 'granted', 'Valid membership');
            l.timestamp = new Date(now - minutesAgo * 60000);
            return l;
        };

        this._accessLogs = [
            makeSeedLog(seeds[0], 30),
            makeSeedLog(seeds[1], 45),
            (() => {
                const l = new AccessLog('9999', 'Unknown', 'N/A', 'denied', 'Member ID not found');
                l.timestamp = new Date(now - 60 * 60000);
                return l;
            })(),
            makeSeedLog(seeds[2], 90),
        ];

        this._todayCheckins = new Set([seeds[0].memberId, seeds[1].memberId, seeds[2].memberId]);
        this._todayDenials  = 1;

        this.save();
    }

    clearAllData() {
        localStorage.removeItem('gymflow_data');
        this._members       = [];
        this._accessLogs    = [];
        this._todayCheckins = new Set();
        this._todayDenials  = 0;
        Member.resetIdCounter(1001);
        AccessLog._nextId = 1;
    }
}
