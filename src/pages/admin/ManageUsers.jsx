import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  async function toggleActive(u) {
    await supabase.from('profiles').update({ is_active: !u.is_active }).eq('id', u.id);
    load();
  }

  async function toggleRole(u) {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change ${u.full_name}'s role to "${newRole}"?`)) return;
    await supabase.from('profiles').update({ role: newRole }).eq('id', u.id);
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Manage users</h1>
          <p>{users.length} registered accounts.</p>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.department || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                  <td>{u.is_active ? 'Active' : 'Deactivated'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleRole(u)}>
                      Make {u.role === 'admin' ? 'user' : 'admin'}
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
