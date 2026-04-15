import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/gymApi';
import { useToast } from '../components/Toast';

export default function Pricing() {
  const showToast = useToast();
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newPlan, setNewPlan] = useState({
    tier: '',
    name: '',
    price: '',
    duration_months: 1,
    perks: ''
  });

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

  const handleCreatePlan = async () => {
    if (!newPlan.tier || !newPlan.name || !newPlan.price || !newPlan.duration_months) {
      showToast('Please fill all required fields', 'warning');
      return;
    }
    
    try {
      const perksArray = newPlan.perks.split(',').map(p => p.trim()).filter(Boolean);
      await api.createPlan({
        ...newPlan,
        price: Number(newPlan.price),
        duration_months: Number(newPlan.duration_months),
        perks: perksArray
      });
      showToast(`Plan ${newPlan.tier} created successfully!`, 'success');
      setIsAddingMode(false);
      setNewPlan({ tier: '', name: '', price: '', duration_months: 1, perks: '' });
      loadPlans();
    } catch (err) {
      showToast('Failed to create plan: ' + err.message, 'error');
    }
  };

  const handleDeleteClick = async (tier) => {
    if (window.confirm(`Are you sure you want to delete the "${tier}" plan?`)) {
      try {
        await api.deletePlan(tier);
        showToast(`Plan ${tier} deleted successfully!`, 'success');
        loadPlans();
      } catch (err) {
        showToast('Failed to delete plan: ' + err.message, 'error');
      }
    }
  };

  const TIER_ICONS = { Basic: <span className="material-symbols-outlined">fitness_center</span>, Premium: <span className="material-symbols-outlined">star</span>, VIP: <span className="material-symbols-outlined">workspace_premium</span> };

  return (
    <section className="view active" id="view-pricing">
      <div className="view-header">
        <h2 className="view-title">Pricing Management</h2>
        <p className="view-subtitle">View, configure, and add new membership plans</p>
      </div>

      <div className="glass-panel">
        <h3 className="section-title"><span className="material-symbols-outlined">payments</span> Current Pricing Plans</h3>
        
        <div className="plan-cards-container">
          {plans.map(plan => (
            <div key={plan.tier} className="plan-card" style={{ '--plan-color': plan.color }}>
              <div className="plan-icon">{TIER_ICONS[plan.tier] || <span className="material-symbols-outlined">featured_play_list</span>}</div>
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
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => handleEditClick(plan)}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>edit</span> Edit
                    </button>
                    <button className="btn" style={{ padding: '8px', backgroundColor: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleDeleteClick(plan.tier)} title="Delete Plan">
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>delete</span>
                    </button>
                  </div>
                </>
              )}
              
              <ul className="plan-perks">
                {plan.perks.map((perk, i) => (
                  <li key={i}>{perk}</li>
                ))}
              </ul>
            </div>
          ))}

          {/* Add Plan Card */}
          {isAddingMode ? (
            <div className="plan-card" style={{ border: '2px dashed var(--border-medium)', position: 'relative' }}>
              <h3 className="section-title" style={{ justifyContent: 'center', marginBottom: '16px' }}>Create New Plan</h3>
              
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '4px' }}>Tier Name</label>
                  <input className="form-input" style={{ padding: '8px 12px' }} value={newPlan.tier} onChange={e => setNewPlan({...newPlan, tier: e.target.value, name: e.target.value})} placeholder="e.g. Student" />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ marginBottom: '4px' }}>Price (GHS)</label>
                    <input type="number" className="form-input" style={{ padding: '8px 12px' }} value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: e.target.value})} placeholder="e.g. 150" />
                  </div>
                  <div>
                    <label className="form-label" style={{ marginBottom: '4px' }}>Months</label>
                    <input type="number" className="form-input" style={{ padding: '8px 12px' }} value={newPlan.duration_months} onChange={e => setNewPlan({...newPlan, duration_months: e.target.value})} min="1" />
                  </div>
                </div>
                
                <div>
                  <label className="form-label" style={{ marginBottom: '4px' }}>Perks (comma-sep)</label>
                  <input className="form-input" style={{ padding: '8px 12px' }} value={newPlan.perks} onChange={e => setNewPlan({...newPlan, perks: e.target.value})} placeholder="Gym, Pool, Sauna" />
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button className="btn btn-primary btn-block" onClick={handleCreatePlan}>Create</button>
                  <button className="btn btn-secondary btn-block" onClick={() => setIsAddingMode(false)}>Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="plan-card" 
              style={{ border: '2px dashed var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', minHeight: '320px' }}
              onClick={() => setIsAddingMode(true)}
            >
              <div className="plan-icon" style={{ opacity: 0.5, marginBottom: '8px' }}><span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>add_circle</span></div>
              <h3 className="section-title" style={{ color: 'var(--text-muted)', marginBottom: 0 }}>Add New Plan</h3>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
