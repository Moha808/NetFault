import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/Badge';

const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function AdminReportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    const [{ data: r }, { data: u }] = await Promise.all([
      supabase.from('fault_reports').select('*, profiles(full_name, email, department)').eq('id', id).single(),
      supabase.from('fault_updates').select('*').eq('report_id', id).order('created_at', { ascending: false })
    ]);
    setReport(r);
    setStatus(r?.status || '');
    setPriority(r?.priority || '');
    setUpdates(u || []);
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const { error: updateError } = await supabase
      .from('fault_reports')
      .update({ status, priority, admin_notes: message || report.admin_notes })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    if (message.trim()) {
      await supabase.from('fault_updates').insert({
        report_id: id,
        admin_id: user.id,
        message: message.trim(),
        status
      });
    }

    setMessage('');
    setSaving(false);
    load();
  }

  if (loading) return <div className="page"><div className="empty-state">Loading…</div></div>;
  if (!report) return <div className="page"><div className="empty-state">Report not found.</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{report.title}</h1>
          <p>{report.ticket_number} · Reported by {report.profiles?.full_name} ({report.profiles?.email})</p>
        </div>
        <Link to="/admin/reports" className="btn btn-ghost">Back to all reports</Link>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <StatusBadge status={report.status} />
          <PriorityBadge priority={report.priority} />
        </div>
        <p><strong>Category:</strong> {report.category}</p>
        <p><strong>Location:</strong> {report.location}</p>
        <p><strong>Department:</strong> {report.profiles?.department || '—'}</p>
        <p><strong>Description:</strong></p>
        <p className="helper-text" style={{ whiteSpace: 'pre-wrap' }}>{report.description}</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Update this report</h3>
        <form onSubmit={handleSave}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="priority">Priority</label>
              <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="message">Resolution note (logged to update history)</label>
            <textarea id="message" rows={3} value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Replaced faulty switch port, tested and confirmed stable." />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save update'}
          </button>
        </form>
      </div>

      <h3>Update history</h3>
      {updates.length === 0 ? (
        <p className="helper-text">No updates logged yet.</p>
      ) : (
        <ul className="timeline">
          {updates.map((u) => (
            <li key={u.id}>
              <div className="timeline-meta">{new Date(u.created_at).toLocaleString()}</div>
              <StatusBadge status={u.status} />
              <p style={{ margin: '6px 0 0' }}>{u.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
