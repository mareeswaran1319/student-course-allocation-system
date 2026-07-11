import { useEffect, useState } from 'react';
import { allocationAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Play, RefreshCw, Download, CheckCircle, XCircle, Clock, Zap, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Allocations() {
  const { socket } = useSocket();
  const [allocations, setAllocations] = useState([]);
  const [stats, setStats] = useState(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [aRes, sRes] = await Promise.all([allocationAPI.getAll(), allocationAPI.getStats()]);
      setAllocations(aRes.data.data);
      setStats(sRes.data.data);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('allocation:progress', (data) => {
      setProgress(p => [...p.slice(-19), data]); // keep last 20
    });
    socket.on('allocation:complete', (summary) => {
      setRunning(false);
      setProgress([]);
      fetchData();
      toast.success(`✅ Allocation complete! ${summary.total_allocated} students allocated`);
    });
    socket.on('allocation:error', ({ error }) => {
      setRunning(false);
      toast.error(error);
    });
    socket.on('allocation:reset', () => {
      fetchData();
      toast('Allocations reset', { icon: '🔄' });
    });
    return () => {
      socket.off('allocation:progress');
      socket.off('allocation:complete');
      socket.off('allocation:error');
      socket.off('allocation:reset');
    };
  }, [socket]);

  const runAllocation = async () => {
    setRunning(true);
    setProgress([]);
    try {
      await allocationAPI.run();
    } catch (e) {
      toast.error(e.message);
      setRunning(false);
    }
  };

  const resetAllocations = async () => {
    if (!window.confirm('Reset all allocations? This cannot be undone.')) return;
    try {
      await allocationAPI.reset();
    } catch (e) { toast.error(e.message); }
  };

  const overall = stats?.overall || {};
  const notFirstPref = stats?.notFirstPref || [];
  const rejectionRate = stats?.rejectionRate || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Allocation Engine</h2>
          <p className="page-subtitle">Merit-based course allocation with reservation rules</p>
        </div>
        <div className="flex gap-3">
          <button onClick={resetAllocations} className="btn-secondary flex items-center gap-2" disabled={running}>
            <RefreshCw size={15} className={running ? 'animate-spin' : ''} /> Reset
          </button>
          <button onClick={runAllocation} className="btn-success flex items-center gap-2" disabled={running}>
            {running ? <><Clock size={15} className="animate-spin" /> Running...</> : <><Play size={15} /> Run Allocation</>}
          </button>
        </div>
      </div>

      {/* Real-time Progress */}
      {running && (
        <div className="card p-5 border-primary-500/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" />
            <p className="text-primary-600 font-semibold text-sm">Allocation in progress...</p>
            <Zap size={16} className="text-yellow-600 animate-bounce ml-auto" />
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {progress.map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-xs bg-gray-50/50 rounded-lg px-3 py-2 animate-fade-in">
                <CheckCircle size={12} className="text-emerald-600 flex-shrink-0" />
                <span className="text-emerald-700 font-mono">{p.student_id}</span>
                <span className="text-gray-500">→</span>
                <span className="text-gray-900">Pref {p.preference_rank}</span>
                <span className="text-gray-400 ml-auto">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {overall.total_allocated > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Students', value: overall.total_students, color: 'text-gray-900' },
            { label: 'Allocated', value: overall.total_allocated, color: 'text-emerald-600' },
            { label: 'Unallocated', value: overall.total_unallocated, color: 'text-red-600' },
            { label: 'Got 1st Pref', value: overall.got_first_pref, color: 'text-yellow-600' },
            { label: 'Got 2nd Pref', value: overall.got_second_pref, color: 'text-orange-600' },
            { label: 'Got 3rd Pref', value: overall.got_third_pref, color: 'text-red-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-gray-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Allocation Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-200/50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Allocation Results ({allocations.length})</h3>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-500">Loading...</div>
          ) : allocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Play size={32} className="mb-3 opacity-30" />
              <p className="mb-2">No allocations yet.</p>
              <button onClick={runAllocation} className="btn-primary text-sm">Run Allocation Now</button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th><th>Name</th><th>Marks</th><th>Category</th>
                  <th>Allocated Course</th><th>Preference</th><th>Category Slot</th><th>First Pref</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map(a => (
                  <tr key={a.id}>
                    <td><span className="font-mono text-primary-600 text-xs">{a.student_id}</span></td>
                    <td><span className="font-medium text-gray-900">{a.name}</span></td>
                    <td><span className="font-bold text-gray-900">{a.marks}</span></td>
                    <td><span className={`badge badge-${a.category.toLowerCase()}`}>{a.category}</span></td>
                    <td>
                      <div>
                        <p className="text-gray-900 font-medium text-xs">{a.course_name}</p>
                        <p className="text-gray-400 text-xs font-mono">{a.course_code}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${a.preference_rank === 1 ? 'badge-success' : a.preference_rank === 2 ? 'badge-warning' : 'badge-danger'}`}>
                        {a.preference_rank === 1 ? '🥇' : a.preference_rank === 2 ? '🥈' : '🥉'} Pref {a.preference_rank}
                      </span>
                    </td>
                    <td><span className={`badge badge-${a.category_slot.toLowerCase()}`}>{a.category_slot}</span></td>
                    <td>
                      <span className="text-gray-500 text-xs">{a.pref1_code || '-'}</span>
                      {a.preference_rank !== 1 && a.pref1_code &&
                        <span className="ml-1 text-red-600 text-xs">≠ {a.course_code}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Not First Preference Table */}
      {notFirstPref.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-200/50 flex items-center gap-3">
            <AlertTriangle size={18} className="text-yellow-600" />
            <h3 className="font-semibold text-gray-900">Students Who Didn't Get 1st Preference ({notFirstPref.length})</h3>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Student</th><th>Marks</th><th>Category</th><th>1st Preference</th><th>Allocated To</th><th>Status</th></tr>
              </thead>
              <tbody>
                {notFirstPref.map((s, i) => (
                  <tr key={i}>
                    <td><span className="font-medium text-gray-900">{s.name}</span><br /><span className="text-xs font-mono text-gray-400">{s.student_id}</span></td>
                    <td><span className="font-bold text-gray-900">{s.marks}</span></td>
                    <td><span className={`badge badge-${s.category?.toLowerCase()}`}>{s.category}</span></td>
                    <td><span className="text-gray-600">{s.first_pref || '-'}</span></td>
                    <td><span className={s.allocated_to ? 'text-emerald-600' : 'text-red-600'}>{s.allocated_to || 'Not Allocated'}</span></td>
                    <td>
                      {s.allocated_to
                        ? <span className="badge badge-warning">Pref {s.preference_rank}</span>
                        : <span className="badge badge-danger">Unallocated</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rejection Rate Table */}
      {rejectionRate.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-200/50 flex items-center gap-3">
            <XCircle size={18} className="text-red-600" />
            <h3 className="font-semibold text-gray-900">Course Rejection Rates</h3>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Course</th><th>1st Pref Applications</th><th>Allocated</th><th>Rejected</th><th>Rejection Rate</th></tr>
              </thead>
              <tbody>
                {rejectionRate.map((c, i) => {
                  const rejected = parseInt(c.first_pref_applicants) - parseInt(c.allocated);
                  const rate = c.first_pref_applicants > 0 ? Math.round(rejected / c.first_pref_applicants * 100) : 0;
                  return (
                    <tr key={i}>
                      <td><span className="font-medium text-gray-900">{c.course_name}</span><br /><span className="font-mono text-xs text-gray-400">{c.course_code}</span></td>
                      <td><span className="text-gray-600">{c.first_pref_applicants}</span></td>
                      <td><span className="text-emerald-600 font-medium">{c.allocated}</span></td>
                      <td><span className="text-red-600 font-medium">{Math.max(0, rejected)}</span></td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="progress-bar flex-1">
                            <div className="progress-fill" style={{ width: `${rate}%`,
                              background: rate > 60 ? 'linear-gradient(90deg,#ef4444,#f97316)' : rate > 30 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#10b981,#34d399)' }} />
                          </div>
                          <span className={`text-sm font-bold w-12 text-right ${rate > 60 ? 'text-red-600' : rate > 30 ? 'text-yellow-600' : 'text-emerald-600'}`}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
