import { useEffect, useState } from 'react';
import { courseAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Plus, Edit2, Trash2, X, Save, BookOpen, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = {
  course_code: '', course_name: '', description: '',
  total_seats: '', general_seats: '', obc_seats: '', sc_seats: '', st_seats: '',
};

export default function Courses() {
  const { socket } = useSocket();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await courseAPI.getAll();
      setCourses(res.data.data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCourses(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('course:created', () => fetchCourses());
    socket.on('course:updated', () => fetchCourses());
    socket.on('course:deleted', ({ id }) => setCourses(p => p.filter(c => c.id !== id)));
    return () => { socket.off('course:created'); socket.off('course:updated'); socket.off('course:deleted'); };
  }, [socket]);

  // Auto-compute general seats when others change
  const handleSeatChange = (field, value) => {
    setForm(p => {
      const next = { ...p, [field]: value };
      if (field !== 'general_seats' && next.total_seats) {
        const obc = parseInt(next.obc_seats) || 0;
        const sc = parseInt(next.sc_seats) || 0;
        const st = parseInt(next.st_seats) || 0;
        const total = parseInt(next.total_seats) || 0;
        next.general_seats = Math.max(0, total - obc - sc - st).toString();
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = parseInt(form.total_seats);
    const sum = parseInt(form.general_seats || 0) + parseInt(form.obc_seats || 0) + parseInt(form.sc_seats || 0) + parseInt(form.st_seats || 0);
    if (sum !== total) return toast.error(`Seat total mismatch: ${sum} ≠ ${total}`);

    setSubmitting(true);
    try {
      if (editId) {
        await courseAPI.update(editId, form);
        toast.success('Course updated!');
        fetchCourses();
      } else {
        await courseAPI.create(form);
        toast.success('Course created!');
        fetchCourses();
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
    } catch (e) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (c) => {
    setEditId(c.id);
    setForm({
      course_code: c.course_code, course_name: c.course_name, description: c.description || '',
      total_seats: c.total_seats, general_seats: c.general_seats,
      obc_seats: c.obc_seats, sc_seats: c.sc_seats, st_seats: c.st_seats,
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await courseAPI.delete(id);
      toast.success('Course deleted');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Courses</h2>
          <p className="page-subtitle">{courses.length} courses available</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Course
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">{editId ? 'Edit Course' : 'Add New Course'}</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn-icon text-gray-500 hover:text-gray-900">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Course Code *</label>
                  <input className="form-input uppercase" placeholder="e.g., CS101" value={form.course_code}
                    onChange={e => setForm(p => ({ ...p, course_code: e.target.value.toUpperCase() }))}
                    required disabled={!!editId} />
                </div>
                <div>
                  <label className="form-label">Course Name *</label>
                  <input className="form-input" placeholder="e.g., Computer Science" value={form.course_name}
                    onChange={e => setForm(p => ({ ...p, course_name: e.target.value }))} required />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Description</label>
                  <textarea className="form-input resize-none h-20" placeholder="Course description..." value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
              <div className="border-t border-gray-200/50 pt-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Seat Configuration</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="form-label">Total Seats *</label>
                    <input className="form-input" type="number" min="1" placeholder="60" value={form.total_seats}
                      onChange={e => handleSeatChange('total_seats', e.target.value)} required />
                  </div>
                  {[
                    { key: 'general_seats', label: '🔵 General Seats', color: 'text-blue-600' },
                    { key: 'obc_seats', label: '🟣 OBC Seats', color: 'text-purple-600' },
                    { key: 'sc_seats', label: '🟠 SC Seats', color: 'text-orange-600' },
                    { key: 'st_seats', label: '🟢 ST Seats', color: 'text-emerald-600' },
                  ].map(({ key, label, color }) => (
                    <div key={key}>
                      <label className={`form-label ${color}`}>{label}</label>
                      <input className="form-input" type="number" min="0" placeholder="0" value={form[key]}
                        onChange={e => handleSeatChange(key, e.target.value)} required />
                    </div>
                  ))}
                </div>
                {form.total_seats && (
                  <div className="mt-3 p-3 rounded-xl bg-gray-50/50 border border-gray-200/50">
                    <p className="text-xs text-gray-500">
                      Sum of category seats: <span className={`font-bold ${
                        (parseInt(form.general_seats || 0) + parseInt(form.obc_seats || 0) + parseInt(form.sc_seats || 0) + parseInt(form.st_seats || 0)) === parseInt(form.total_seats)
                          ? 'text-emerald-600' : 'text-red-600'}`}>
                        {parseInt(form.general_seats || 0) + parseInt(form.obc_seats || 0) + parseInt(form.sc_seats || 0) + parseInt(form.st_seats || 0)}
                      </span> / {form.total_seats}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex items-center gap-2" disabled={submitting}>
                  <Save size={16} />{submitting ? 'Saving...' : editId ? 'Update Course' : 'Create Course'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-500">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-48 text-gray-400">
          <BookOpen size={32} className="mb-3 opacity-30" />
          <p>No courses added yet. Create your first course!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map(c => {
            const fillPct = c.total_seats > 0 ? Math.round(parseInt(c.total_allocated) / c.total_seats * 100) : 0;
            return (
              <div key={c.id} className="card-hover p-5 group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-primary-500/20 text-primary-600 px-2 py-0.5 rounded-md border border-primary-200">
                        {c.course_code}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{c.course_name}</h3>
                    {c.description && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{c.description}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(c)} className="btn-icon text-gray-500 hover:text-blue-600"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(c.id, c.course_name)} className="btn-icon text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Fill Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Seat Utilization</span>
                    <span className="font-medium text-gray-900">{c.total_allocated || 0}/{c.total_seats}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${fillPct}%`,
                      background: fillPct > 90 ? 'linear-gradient(90deg,#ef4444,#f97316)' : fillPct > 60 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#2563eb,#60a5fa)' }} />
                  </div>
                  <p className="text-right text-xs text-gray-400 mt-1">{fillPct}% filled</p>
                </div>

                {/* Seat Breakdown */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Gen', total: c.general_seats, alloc: c.general_allocated || 0, color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
                    { label: 'OBC', total: c.obc_seats, alloc: c.obc_allocated || 0, color: 'bg-purple-500/20 text-purple-600 border-purple-500/30' },
                    { label: 'SC', total: c.sc_seats, alloc: c.sc_allocated || 0, color: 'bg-orange-500/20 text-orange-600 border-orange-500/30' },
                    { label: 'ST', total: c.st_seats, alloc: c.st_allocated || 0, color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' },
                  ].map(({ label, total, alloc, color }) => (
                    <div key={label} className={`border rounded-lg p-2 text-center ${color}`}>
                      <p className="text-xs font-bold">{total - alloc}</p>
                      <p className="text-xs opacity-70">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-gray-400 mt-1">Available seats by category</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
