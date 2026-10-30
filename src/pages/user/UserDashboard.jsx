import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/Badge';

export default function UserDashboard() {
  const { user, profile } = useAuth();
  const userId = user?.id;

  // Initialize reports immediately from cache if available (0ms instant display)
  const [reports, setReports] = useState(() => {
    if (!userId) return [];
    try {
      const cached = sessionStorage.getItem(`netfault_user_reports_${userId}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(() => {
    if (!userId) return true;
    try {
      const cached = sessionStorage.getItem(`netfault_user_reports_${userId}`);
      return !cached;
    } catch {
      return true;
    }
  });

  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchReports = useCallback(async () => {
    if (!userId) return;

    // Abort any prior in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 10s timeout to prevent requests from hanging on mobile connections
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    setIsRevalidating(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('fault_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (fetchError) {
        throw fetchError;
      }

      const freshReports = data || [];
      setReports(freshReports);
      try {
        sessionStorage.setItem(`netfault_user_reports_${userId}`, JSON.stringify(freshReports));
      } catch {}
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('Reports request timed out on mobile network.');
        if (reports.length === 0) {
          setError('Network request timed out. Please check your connection and tap Retry.');
        }
      } else {
        console.error('Failed to fetch reports:', err);
        if (reports.length === 0) {
          setError(err.message || 'Unable to load your reports.');
        }
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setIsRevalidating(false);
    }
  }, [userId, reports.length]);

  useEffect(() => {
    if (!userId) return;

    // If cache wasn't ready on initial render, load it now
    try {
      const cached = sessionStorage.getItem(`netfault_user_reports_${userId}`);
      if (cached && reports.length === 0) {
        setReports(JSON.parse(cached));
        setLoading(false);
      }
    } catch {}

    fetchReports();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [userId, fetchReports]);

  const counts = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'Pending').length,
    inProgress: reports.filter((r) => r.status === 'In Progress').length,
    resolved: reports.filter((r) => r.status === 'Resolved').length
  };

  const displayName = profile?.full_name?.split(' ')[0] 
    || user?.user_metadata?.full_name?.split(' ')[0] 
    || '';

  // Render skeleton placeholder only when we have zero cached data to show
  if (loading && reports.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ width: 260, height: 28, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 220, height: 18 }} />
          </div>
          <div className="skeleton" style={{ width: 130, height: 42, borderRadius: 8 }} />
        </div>
        <div className="stat-grid">
          {[1, 2, 3, 4].map((i) => (
            <div className="stat-card" key={i}>
              <div className="skeleton" style={{ width: 60, height: 40, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 100, height: 14 }} />
            </div>
          ))}
        </div>
        <div className="table-wrap">
          <div style={{ padding: 20 }}>
            {[1, 2, 3].map((i) => (
              <div className="skeleton" key={i} style={{ height: 20, marginBottom: 16 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Graceful error state with a functioning retry mechanism
  if (error && reports.length === 0) {
    return (
      <div className="page">
        <div className="error-state">
          <p className="error-text">{error}</p>
          <button className="btn btn-primary" onClick={fetchReports}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Welcome back{displayName ? `, ${displayName}` : ''}</h1>
          <p>
            Here's a snapshot of your reported faults.
            {isRevalidating && <span style={{ marginLeft: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Refreshing…</span>}
          </p>
        </div>
        <Link to="/report" className="btn btn-primary">Report a fault</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-number">{counts.total}</div>
          <div className="stat-label">Total reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{counts.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{counts.inProgress}</div>
          <div className="stat-label">In progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{counts.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      <div className="table-wrap">
        {reports.length === 0 ? (
          <div className="empty-state">
            No reports yet. <Link to="/report">Report your first fault.</Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ticket</th><th>Title</th><th>Category</th>
                <th>Priority</th><th>Status</th><th>Reported</th>
              </tr>
            </thead>
            <tbody>
              {reports.slice(0, 8).map((r) => (
                <tr key={r.id}>
                  <td><Link to={`/reports/${r.id}`}>{r.ticket_number}</Link></td>
                  <td>{r.title}</td>
                  <td>{r.category}</td>
                  <td><PriorityBadge priority={r.priority} /></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
