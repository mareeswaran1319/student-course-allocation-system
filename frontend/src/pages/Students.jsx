import { useEffect, useState } from 'react';
import { studentAPI, courseAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Plus, Edit2, Trash2, Search, X, Save, UserPlus, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['General', 'OBC', 'SC', 'ST'];

const emptyForm = {
  student_id: '', name: '', marks: '', category: 'General',
  application_date: new Date().toISOString().slice(0, 16),
  pref1_course_id: '', pref2_course_id: '', pref3_course_id: '',
};

export default function Students() {
  const { socket } = useSocket();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const fetchStudents = async () => {
    try {
      const [sRes, cRes] = await Promise.all([studentAPI.getAll(), courseAPI.getAll()]);
      setStudents(sRes.data.data);
      setCourses(cRes.data.data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('student:created', (s) => setStudents(p => [s, ...p]));
    socket.on('student:updated', (s) => setStudents(p => p.map(x => x.id === s.id ? s : x)));
    socket.on('student:deleted', ({ id }) => setStudents(p => p.filter(x => x.id !== id)));
    return () => { socket.off('student:created'); socket.off('student:updated'); socket.off('student:deleted'); };
  }, [socket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await studentAPI.update(editId, form);
        toast.success('Student updated!');
      } else {
        await studentAPI.create(form);
        toast.success('Student registered!');
        fetchStudents();
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
    } catch (e) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (s) => {
    setEditId(s.id);
    setForm({
      student_id: s.student_id, name: s.name, marks: s.marks, category: s.category,
      application_date: new Date(s.application_date).toISOString().slice(0, 16),
      pref1_course_id: s.pref1_course_id || '', pref2_course_id: s.pref2_course_id || '',
      pref3_course_id: s.pref3_course_id || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      await studentAPI.delete(id);
      toast.success('Student deleted');
      fetchStudents();
    } catch (e) { toast.error(e.message); }
  };

  const filtered = students.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.student_id.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || s.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Students</h2>
          <p className="page-subtitle">{students.length} registered students</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="btn-primary flex items-center gap-2">
          <UserPlus size={16} /> Register Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-9" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select sm:w-40" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">{editId ? 'Edit Student' : 'Register New Student'}</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn-icon text-gray-500 hover:text-gray-900">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Student ID *</label>
                  <input className="form-input" placeholder="e.g., STU016" value={form.student_id}
                    onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} required disabled={!!editId} />
                </div>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="Full name" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Marks (0-100) *</label>
                  <input className="form-input" type="number" min="0" max="100" step="0.01" placeholder="85.5"
                    value={form.marks} onChange={e => setForm(p => ({ ...p, marks: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="form-label">Application Date</label>
                  <input className="form-input" type="datetime-local" value={form.application_date}
                    onChange={e => setForm(p => ({ ...p, application_date: e.target.value }))} />
                </div>
              </div>
              <div className="border-t border-gray-200/50 pt-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Course Preferences</p>
                {[1, 2, 3].map(rank => (
                  <div key={rank} className="mb-3">
                    <label className="form-label">
                      {rank === 1 ? '🥇 1st' : rank === 2 ? '🥈 2nd' : '🥉 3rd'} Preference {rank === 1 ? '*' : '(optional)'}
                    </label>
                    <select className="form-select"
                      value={form[`pref${rank}_course_id`]}
                      onChange={e => setForm(p => ({ ...p, [`pref${rank}_course_id`]: e.target.value }))}
                      required={rank === 1}>
                      <option value="">Select course...</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex items-center gap-2" disabled={submitting}>
                  <Save size={16} />{submitting ? 'Saving...' : editId ? 'Update Student' : 'Register Student'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <UserPlus size={32} className="mb-3 opacity-30" />
              <p>No students found. Register your first student!</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th><th>Name</th><th>Marks</th><th>Category</th>
                  <th>1st Pref</th><th>2nd Pref</th><th>3rd Pref</th>
                  <th>Allocated To</th><th>Preference Got</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td><span className="font-mono text-primary-600 text-xs">{s.student_id}</span></td>
                    <td><span className="font-medium text-gray-900">{s.name}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{s.marks}</span>
                        <div className="progress-bar w-16 hidden sm:block">
                          <div className="progress-fill" style={{ width: `${s.marks}%` }} />
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge badge-${s.category.toLowerCase()}`}>{s.category}</span></td>
                    <td className="text-gray-600 text-xs">{s.pref1_code || '-'}</td>
                    <td className="text-gray-600 text-xs">{s.pref2_code || '-'}</td>
                    <td className="text-gray-600 text-xs">{s.pref3_code || '-'}</td>
                    <td>
                      {s.allocated_course_code
                        ? <span className="text-emerald-600 font-medium text-xs">{s.allocated_course_code}</span>
                        : <span className="text-gray-400 text-xs">Not allocated</span>}
                    </td>
                    <td>
                      {s.preference_rank
                        ? <span className={`badge ${s.preference_rank === 1 ? 'badge-success' : s.preference_rank === 2 ? 'badge-warning' : 'badge-danger'}`}>
                            Pref {s.preference_rank}
                          </span>
                        : <span className="text-gray-400 text-xs">-</span>}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(s)} className="btn-icon text-gray-500 hover:text-blue-600"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(s.id, s.name)} className="btn-icon text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
