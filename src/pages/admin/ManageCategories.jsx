import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    if (!newName.trim()) return;
    const { error } = await supabase.from('categories').insert({ name: newName.trim() });
    if (error) {
      setError(error.message);
      return;
    }
    setNewName('');
    load();
  }

  async function toggleActive(cat) {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Manage categories</h1>
          <p>Categories available when users report a fault.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="card" style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          placeholder="New category name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8 }}
        />
        <button className="btn btn-primary" type="submit">Add category</button>
      </form>
      {error && <p className="error-text">{error}</p>}

      <div className="table-wrap">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.is_active ? 'Active' : 'Disabled'}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(c)}>
                      {c.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
