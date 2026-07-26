import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { StatusBadge, PriorityBadge } from '../../components/Badge';

const STATUS_FILTERS = ['All', 'Pending', 'In Progress', 'Resolved', 'Closed'];
const PRIORITY_FILTERS = ['All', 'Low', 'Medium', 'High', 'Critical'];

export default function AllReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('fault_reports')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });
    setReports(data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this report permanently?')) return;
    await supabase.from('fault_reports').delete().eq('id', id);
    setReports((rs) => rs.filter((r) => r.id !== id));
  }

  const filtered = reports.filter((r) => {
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || r.priority === priorityFilter;
    const matchesSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      (r.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>All reports</h1>
          <p>{filtered.length} of {reports.length} reports shown</p>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <input
          placeholder="Search title, ticket, or reporter…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8 }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8 }}>
          {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8 }}>
          {PRIORITY_FILTERS.map((p) => <option key={p} value={p}>{p}</option>)}
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
                <th>Ticket</th><th>Title</th><th>Reporter</th><th>Category</th>
                <th>Priority</th><th>Status</th><th>Reported</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td><Link to={`/admin/reports/${r.id}`}>{r.ticket_number}</Link></td>
                  <td>{r.title}</td>
                  <td>{r.profiles?.full_name ?? '—'}</td>
                  <td>{r.category}</td>
                  <td><PriorityBadge priority={r.priority} /></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>Delete</button>
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
