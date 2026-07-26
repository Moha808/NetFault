import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/Badge';

const STATUS_FILTERS = ['All', 'Pending', 'In Progress', 'Resolved', 'Closed'];

export default function MyReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('fault_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports(data || []);
        setLoading(false);
      });
  }, [user]);

  const filtered = reports.filter((r) => {
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.ticket_number.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My reports</h1>
          <p>All faults you've submitted.</p>
        </div>
        <Link to="/report" className="btn btn-primary">Report a fault</Link>
      </div>

      <div className="card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <input
          placeholder="Search by title or ticket number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8 }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8 }}>
          {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No reports match your filters.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ticket</th><th>Title</th><th>Category</th>
                <th>Priority</th><th>Status</th><th>Reported</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.ticket_number}</td>
                  <td>{r.title}</td>
                  <td>{r.category}</td>
                  <td><PriorityBadge priority={r.priority} /></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td><Link to={`/reports/${r.id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
