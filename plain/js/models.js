/**
 * GymFlow — OOP Class Hierarchy
 * ==============================
 * Demonstrates: Encapsulation, Inheritance, Composition, Polymorphism
 *
 * Class Map:
 *   Person (Base)  →  Member (Derived, inherits Person)
 *   MembershipPlan (Standalone, composed into Member)
 */

// ============================================================
//  MembershipPlan  —  Composition
//  A Member HAS-A MembershipPlan. This class encapsulates
//  pricing, duration, perks, and tier information.
// ============================================================
class MembershipPlan {

    constructor(name, price, durationMonths, perks, tier) {
        this._name           = name;
        this._price          = price;
        this._durationMonths = durationMonths;
        this._perks          = [...perks];
        this._tier           = tier;            // 'Basic' | 'Premium' | 'VIP'
    }

    /* ---- Encapsulated Getters ---- */
    get name()           { return this._name; }
    get price()          { return this._price; }
    get durationMonths() { return this._durationMonths; }
    get perks()          { return [...this._perks]; }   // defensive copy
    get tier()           { return this._tier; }

    toString() {
        return `${this._tier} Plan — $${this._price}/mo`;
    }

    /* ---- Serialisation ---- */
    toJSON() {
        return {
            name:           this._name,
            price:          this._price,
            durationMonths: this._durationMonths,
            perks:          [...this._perks],
            tier:           this._tier
        };
    }

    static fromJSON(data) {
        return new MembershipPlan(
            data.name, data.price, data.durationMonths, data.perks, data.tier
        );
    }

    /* ---- Factory: available plans ---- */
    static getAvailablePlans() {
        return {
            Basic: new MembershipPlan(
                'Basic', 29.99, 1,
                ['Gym Floor Access', 'Locker Room'],
                'Basic'
            ),
            Premium: new MembershipPlan(
                'Premium', 59.99, 3,
                ['Gym Floor Access', 'Locker Room', 'Group Classes', 'Sauna'],
                'Premium'
            ),
            VIP: new MembershipPlan(
                'VIP', 99.99, 6,
                ['Full Facility Access', 'Personal Trainer', 'Spa & Sauna', 'Priority Booking', 'Guest Pass'],
                'VIP'
            )
        };
    }
}


// ============================================================
//  Person  —  Base Class  (Encapsulation)
//  Stores personal details behind getters / setters with
//  basic validation, demonstrating encapsulation.
// ============================================================
class Person {

    constructor(name, email, phone) {
        this._name  = name;
        this._email = email;
        this._phone = phone;
    }

    /* ---- Encapsulated Getters / Setters ---- */
    get name()  { return this._name; }
    set name(v) {
        if (!v || v.trim().length === 0) throw new Error('Name cannot be empty');
        this._name = v.trim();
    }

    get email()  { return this._email; }
    set email(v) {
        if (!v || !v.includes('@')) throw new Error('Invalid email address');
        this._email = v.trim();
    }

    get phone()  { return this._phone; }
    set phone(v) { this._phone = v ? v.trim() : ''; }

    getInfo() {
        return `${this._name} (${this._email})`;
    }

    toJSON() {
        return { name: this._name, email: this._email, phone: this._phone };
    }
}


// ============================================================
//  Member  —  Derived Class  (Inheritance + Polymorphism)
//  Inherits from Person. Adds membership-specific fields.
//  Composes a MembershipPlan instance (Composition).
//  isActive() and getDisplayBadge() exhibit Polymorphism:
//    - VIP members get a 7-day grace period on expiry.
//    - Badge text / emoji varies by tier.
// ============================================================
class Member extends Person {

    static _nextId = 1001;

    /**
     * @param {string}         name
     * @param {string}         email
     * @param {string}         phone
     * @param {MembershipPlan} plan
     * @param {object}         [options]  — used when rehydrating from JSON
     */
    constructor(name, email, phone, plan, options = {}) {
        super(name, email, phone);

        this._memberId   = options.memberId || String(Member._nextId++);
        this._memberSince = options.memberSince ? new Date(options.memberSince) : new Date();
        this._plan       = plan;                       // Composition
        this._status     = options.status || 'active';  // 'active' | 'suspended'

        if (options.expiryDate) {
            this._expiryDate = new Date(options.expiryDate);
        } else {
            this._expiryDate = new Date(this._memberSince);
            this._expiryDate.setMonth(this._expiryDate.getMonth() + plan.durationMonths);
        }
    }

    /* ---- Encapsulated Getters ---- */
    get memberId()    { return this._memberId; }
    get memberSince() { return new Date(this._memberSince); }
    get expiryDate()  { return new Date(this._expiryDate); }
    get plan()        { return this._plan; }
    get status()      { return this._status; }
    set status(v)     { this._status = v; }

    /**
     * Polymorphism — Active-check varies by tier.
     * VIP members receive a 7-day grace period after expiry.
     */
    isActive() {
        const now = new Date();
        if (this._status === 'suspended') return false;
        if (now <= this._expiryDate) return true;

        // VIP grace period: 7 extra days
        if (this._plan.tier === 'VIP') {
            const grace = new Date(this._expiryDate);
            grace.setDate(grace.getDate() + 7);
            return now <= grace;
        }
        return false;
    }

    /**
     * Polymorphism — Display badge varies by tier.
     */
    getDisplayBadge() {
        const badges = { VIP: '👑 VIP', Premium: '⭐ Premium', Basic: '🏋️ Basic' };
        return badges[this._plan.tier] || '🏋️ Basic';
    }

    getDaysRemaining() {
        const diff = this._expiryDate - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    renewMembership() {
        this._expiryDate = new Date();
        this._expiryDate.setMonth(this._expiryDate.getMonth() + this._plan.durationMonths);
        this._status = 'active';
    }

    /* ---- Serialisation ---- */
    toJSON() {
        return {
            ...super.toJSON(),
            memberId:    this._memberId,
            memberSince: this._memberSince.toISOString(),
            expiryDate:  this._expiryDate.toISOString(),
            plan:        this._plan.toJSON(),
            status:      this._status
        };
    }

    static fromJSON(data) {
        const plan = MembershipPlan.fromJSON(data.plan);
        return new Member(data.name, data.email, data.phone, plan, {
            memberId:    data.memberId,
            memberSince: data.memberSince,
            expiryDate:  data.expiryDate,
            status:      data.status
        });
    }

    static resetIdCounter(nextId) {
        Member._nextId = nextId;
    }
}
