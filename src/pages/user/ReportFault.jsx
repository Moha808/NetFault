import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function ReportFault() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', category: '', location: '', description: '', priority: 'Medium'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('name').eq('is_active', true).order('name')
      .then(({ data }) => setCategories(data?.map((c) => c.name) || []));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error } = await supabase
      .from('fault_reports')
      .insert({ ...form, user_id: user.id })
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate(`/reports/${data.id}`);
  }

  return (
    <div className="card form-card wide">
      <h2>Report a network fault</h2>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">Fault title</label>
          <input id="title" required value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="e.g. Wi-Fi unreachable in Lab 2" />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" required value={form.category}
              onChange={(e) => update('category', e.target.value)}>
              <option value="" disabled>Select a category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="priority">Priority</label>
            <select id="priority" value={form.priority}
              onChange={(e) => update('priority', e.target.value)}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="location">Location</label>
          <input id="location" required value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="e.g. Admin Block, 2nd Floor" />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" rows={5} required value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Describe what's happening, when it started, and anything you've already tried." />
        </div>

        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit report'}
        </button>
      </form>
    </div>
  );
}
