import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { StatusBadge, PriorityBadge } from '../../components/Badge';

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: r }, { data: u }] = await Promise.all([
        supabase.from('fault_reports').select('*').eq('id', id).single(),
        supabase.from('fault_updates').select('*').eq('report_id', id).order('created_at', { ascending: false })
      ]);
      setReport(r);
      setUpdates(u || []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="page"><div className="empty-state">Loading…</div></div>;
  if (!report) return <div className="page"><div className="empty-state">Report not found.</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{report.title}</h1>
          <p>{report.ticket_number} · Reported {new Date(report.created_at).toLocaleString()}</p>
        </div>
        <Link to="/my-reports" className="btn btn-ghost">Back to my reports</Link>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <StatusBadge status={report.status} />
          <PriorityBadge priority={report.priority} />
        </div>
        <p><strong>Category:</strong> {report.category}</p>
        <p><strong>Location:</strong> {report.location}</p>
        <p><strong>Description:</strong></p>
        <p className="helper-text" style={{ whiteSpace: 'pre-wrap' }}>{report.description}</p>
        {report.admin_notes && (
          <>
            <p><strong>Latest admin note:</strong></p>
            <p className="helper-text" style={{ whiteSpace: 'pre-wrap' }}>{report.admin_notes}</p>
          </>
        )}
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
