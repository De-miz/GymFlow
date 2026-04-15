import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/gymApi';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

export default function Register() {
  const showToast = useToast();
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [modalMember, setModalMember] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([api.getPlans(), api.getMembers()]);
      setPlans(p);
      setMembers(m);
    } catch (err) {
      console.error('Failed to load register data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) { showToast('Please enter a name', 'error'); return; }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      showToast('Please enter a valid email', 'error'); return;
    }
    if (!formData.phone.trim()) { showToast('Please enter a phone number', 'error'); return; }
    if (!selectedPlan) { showToast('Please select a membership plan', 'error'); return; }

    try {
      const member = await api.registerMember(
        formData.name.trim(),
        formData.email.trim(),
        formData.phone.trim(),
        selectedPlan
      );
      showToast(`${member.name} registered! ID: ${member.member_id}`, 'success');

      // Reset form
      setFormData({ name: '', email: '', phone: '' });
      setSelectedPlan('');

      // Refresh member list
      const updated = await api.getMembers();
      setMembers(updated);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleViewMember = async (memberId) => {
    try {
      const member = await api.getMember(memberId);
      setModalMember(member);
    } catch (err) {
      showToast('Failed to load member details', 'error');
    }
  };

  const TIER_ICONS = { Basic: <span className="material-symbols-outlined">fitness_center</span>, Premium: <span className="material-symbols-outlined">star</span>, VIP: <span className="material-symbols-outlined">workspace_premium</span> };

  return (
    <section className="view active" id="view-register">
      <div className="view-header">
        <h2 className="view-title">Member Registration</h2>
        <p className="view-subtitle">Add new members and manage existing ones</p>
      </div>

      <div className="register-layout">
        {/* Plan Selection */}
        <div>
          <h3 className="section-title">Select a Plan</h3>
          <div className="plan-cards-container" id="planCards">
            {plans.map(plan => (
              <div
                key={plan.tier}
                className={`plan-card plan-${plan.tier.toLowerCase()}${selectedPlan === plan.tier ? ' selected' : ''}`}
                data-tier={plan.tier}
                onClick={() => setSelectedPlan(plan.tier)}
              >
                <div className="plan-icon">{TIER_ICONS[plan.tier] || <span className="material-symbols-outlined">fitness_center</span>}</div>
                <h3 className="plan-name">{plan.tier}</h3>
                <div className="plan-price">
                  GHS {plan.price}<span>/mo</span>
                </div>
                <div className="plan-duration">
                  {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}
                </div>
                <ul className="plan-perks">
                  {plan.perks.map((perk, i) => (
                    <li key={i}>{perk}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Form + Member List */}
        <div className="register-form-section">
          <div className="glass-panel">
            <h3 className="section-title"><span className="material-symbols-outlined">edit</span> New Member</h3>
            <form id="registrationForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="regName">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  id="regName"
                  name="name"
                  placeholder="e.g. John Smith"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="regEmail">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    id="regEmail"
                    name="email"
                    placeholder="john@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="regPhone">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    id="regPhone"
                    name="phone"
                    placeholder="555-0100"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" id="btnRegister">
                Register Member
              </button>
            </form>
          </div>

          <div className="glass-panel">
            <h3 className="section-title"><span className="material-symbols-outlined">group</span> Current Members</h3>
            <div className="table-container">
              <table className="data-table" id="membersTable">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Plan</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="membersTableBody">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">No members registered</td>
                    </tr>
                  ) : (
                    members.map(m => (
                      <tr key={m.member_id} className="member-row" data-id={m.member_id}>
                        <td><span className="member-id">{m.member_id}</span></td>
                        <td>{m.name}</td>
                        <td>
                          <span className={`badge badge-${m.plan_tier.toLowerCase()}`}>
                            {m.plan_tier}
                          </span>
                        </td>
                        <td>{fmtDate(m.expiry_date)}</td>
                        <td>
                          <span className={`status-dot status-${m.isActive ? 'active' : 'expired'}`}></span>
                          {m.isActive ? 'Active' : 'Expired'}
                        </td>
                        <td>
                          <button
                            className="btn-icon"
                            title="View Details"
                            onClick={() => handleViewMember(m.member_id)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Member Detail Modal */}
      <Modal
        isOpen={!!modalMember}
        title="Member Details"
        onClose={() => setModalMember(null)}
      >
        {modalMember && <MemberDetail member={modalMember} />}
      </Modal>
    </section>
  );
}

/* ── Member Detail (Modal Content) ─────────────────────── */

function MemberDetail({ member }) {
  const m = member;

  return (
    <div className="member-detail">
      <div className="member-detail-header">
        <div className="member-avatar">
          {m.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3>{m.name}</h3>
          <span className={`badge badge-${m.plan_tier.toLowerCase()}`}>
            {m.displayBadge}
          </span>
        </div>
      </div>
      <div className="member-detail-grid">
        <div className="detail-item">
          <label>Member ID</label>
          <span>{m.member_id}</span>
        </div>
        <div className="detail-item">
          <label>Email</label>
          <span>{m.email}</span>
        </div>
        <div className="detail-item">
          <label>Phone</label>
          <span>{m.phone}</span>
        </div>
        <div className="detail-item">
          <label>Member Since</label>
          <span>{fmtDate(m.member_since)}</span>
        </div>
        <div className="detail-item">
          <label>Expires</label>
          <span>{fmtDate(m.expiry_date)}</span>
        </div>
        <div className="detail-item">
          <label>Status</label>
          <span>
            <span className={`status-dot status-${m.isActive ? 'active' : 'expired'}`}></span>
            {m.isActive
              ? `Active (${m.daysRemaining} days left)`
              : 'Expired'}
          </span>
        </div>
        <div className="detail-item" style={{ gridColumn: 'span 2' }}>
          <label>Plan Perks</label>
          <ul className="detail-perks">
            {(m.plan_perks || []).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────────── */

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
