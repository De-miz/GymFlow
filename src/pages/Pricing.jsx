import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/gymApi';
import { useToast } from '../components/Toast';

export default function Pricing() {
  const showToast = useToast();
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  const loadPlans = useCallback(async () => {
    try {
      const data = await api.getPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err);
      showToast('Failed to load plans', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleEditClick = (plan) => {
    setEditingPlan(plan.tier);
    setEditPrice(plan.price);
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setEditPrice('');
  };

  const handleSaveEdit = async (tier) => {
    try {
      if (editPrice === '' || isNaN(editPrice) || Number(editPrice) < 0) {
        showToast('Please enter a valid price', 'warning');
        return;
      }
      await api.updatePlanPrice(tier, Number(editPrice));
      showToast(`${tier} plan price updated!`, 'success');
      setEditingPlan(null);
      loadPlans();
    } catch (err) {
      showToast('Failed to update price: ' + err.message, 'error');
    }
  };

  const TIER_ICONS = { Basic: <span className="material-symbols-outlined">fitness_center</span>, Premium: <span className="material-symbols-outlined">star</span>, VIP: <span className="material-symbols-outlined">workspace_premium</span> };

  return (
    <section className="view active" id="view-pricing">
      <div className="view-header">
        <h2 className="view-title">Pricing Management</h2>
        <p className="view-subtitle">View and configure membership plan prices</p>
      </div>

      <div className="glass-panel">
        <h3 className="section-title"><span className="material-symbols-outlined">payments</span> Current Pricing Plans</h3>
        
        <div className="plan-cards-container">
          {plans.map(plan => (
            <div key={plan.tier} className={`plan-card plan-${plan.tier.toLowerCase()}`}>
              <div className="plan-icon">{TIER_ICONS[plan.tier] || <span className="material-symbols-outlined">fitness_center</span>}</div>
              <h3 className="plan-name">{plan.tier}</h3>
              
              {editingPlan === plan.tier ? (
                <div className="edit-price-form" style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>GHS</span>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ width: '100px', textAlign: 'center', padding: '8px' }}
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      min="0"
                      step="0.01"
                      autoFocus
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleSaveEdit(plan.tier)}>Save</button>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleCancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="plan-price">
                    GHS {plan.price}<span>/mo</span>
                  </div>
                  <div className="plan-duration" style={{ marginBottom: '16px' }}>
                    {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}
                  </div>
                  <button className="btn btn-secondary" style={{ marginBottom: '16px' }} onClick={() => handleEditClick(plan)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span> Edit Price
                  </button>
                </>
              )}
              
              <ul className="plan-perks">
                {plan.perks.map((perk, i) => (
                  <li key={i}>{perk}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
