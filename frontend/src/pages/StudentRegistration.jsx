import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, courseAPI } from '../services/api';
import { GraduationCap, ArrowLeft, CheckCircle, User, Hash, Award, Tag, Calendar, BookOpen, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['General', 'OBC', 'SC', 'ST'];

const emptyForm = {
  student_id: '',
  name: '',
  marks: '',
  category: 'General',
  application_date: new Date().toISOString().slice(0, 16),
  pref1_course_id: '',
  pref2_course_id: '',
  pref3_course_id: '',
};

export default function StudentRegistration() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [courses, setCourses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(null); // holds the registered student data
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    courseAPI.getAll()
      .then(res => setCourses(res.data.data))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoadingCourses(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await studentAPI.create(form);
      setRegistered({ ...res.data.data, form });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const getCourseNameById = (id) => {
    const c = courses.find(c => String(c.id) === String(id));
    return c ? `${c.course_name} (${c.course_code})` : '-';
  };

  // ─── SUCCESS STATE ────────────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="student-reg-root">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="grid-overlay" />

        <div className="student-reg-container">
          <div className="reg-success-card">
            <div className="success-icon-wrap">
              <div className="success-icon-ring" />
              <CheckCircle size={48} className="success-icon" />
            </div>
            <h2 className="success-title">Registration Successful! 🎉</h2>
            <p className="success-subtitle">
              You have been successfully registered. Your details are now with the admin.
            </p>

            <div className="success-details">
              <div className="success-detail-row">
                <span className="success-label">Student ID</span>
                <span className="success-value mono">{registered.student_id}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-label">Name</span>
                <span className="success-value">{registered.name}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-label">Marks</span>
                <span className="success-value">{registered.marks}%</span>
              </div>
              <div className="success-detail-row">
                <span className="success-label">Category</span>
                <span className={`badge badge-${registered.category.toLowerCase()}`}>{registered.category}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-label">1st Preference</span>
                <span className="success-value">{getCourseNameById(form.pref1_course_id)}</span>
              </div>
              {form.pref2_course_id && (
                <div className="success-detail-row">
                  <span className="success-label">2nd Preference</span>
                  <span className="success-value">{getCourseNameById(form.pref2_course_id)}</span>
                </div>
              )}
              {form.pref3_course_id && (
                <div className="success-detail-row">
                  <span className="success-label">3rd Preference</span>
                  <span className="success-value">{getCourseNameById(form.pref3_course_id)}</span>
                </div>
              )}
            </div>

            <div className="success-actions">
              <button
                className="btn-success-reg"
                onClick={() => { setRegistered(null); setForm(emptyForm); }}
              >
                Register Another Student
              </button>
              <button
                className="btn-outline-reg"
                onClick={() => navigate('/')}
              >
                <ArrowLeft size={16} />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── REGISTRATION FORM ────────────────────────────────────────────────────────
  return (
    <div className="student-reg-root">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grid-overlay" />

      <div className="student-reg-container">
        {/* Header */}
        <div className="reg-header">
          <button className="reg-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="reg-logo">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="reg-title">Student Registration</h1>
            <p className="reg-subtitle">Fill in your details to apply for course allocation</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="reg-card">
          <form onSubmit={handleSubmit} className="reg-form">
            {/* Personal Info Section */}
            <div className="reg-section">
              <div className="reg-section-header">
                <User size={16} />
                <span>Personal Information</span>
              </div>
              <div className="reg-grid-2">
                <div className="reg-field">
                  <label className="reg-label">
                    <Hash size={13} /> Student ID <span className="req">*</span>
                  </label>
                  <input
                    className="reg-input"
                    placeholder="e.g., STU016"
                    value={form.student_id}
                    onChange={e => set('student_id', e.target.value)}
                    required
                  />
                </div>
                <div className="reg-field">
                  <label className="reg-label">
                    <User size={13} /> Full Name <span className="req">*</span>
                  </label>
                  <input
                    className="reg-input"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    required
                  />
                </div>
                <div className="reg-field">
                  <label className="reg-label">
                    <Award size={13} /> Marks (0–100) <span className="req">*</span>
                  </label>
                  <input
                    className="reg-input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="85.5"
                    value={form.marks}
                    onChange={e => set('marks', e.target.value)}
                    required
                  />
                </div>
                <div className="reg-field">
                  <label className="reg-label">
                    <Tag size={13} /> Category <span className="req">*</span>
                  </label>
                  <select
                    className="reg-select"
                    value={form.category}
                    onChange={e => set('category', e.target.value)}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="reg-field reg-field-full">
                  <label className="reg-label">
                    <Calendar size={13} /> Application Date
                  </label>
                  <input
                    className="reg-input"
                    type="datetime-local"
                    value={form.application_date}
                    onChange={e => set('application_date', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Course Preferences Section */}
            <div className="reg-section">
              <div className="reg-section-header">
                <BookOpen size={16} />
                <span>Course Preferences</span>
              </div>
              {loadingCourses ? (
                <div className="reg-loading">Loading available courses...</div>
              ) : (
                <div className="reg-prefs">
                  {[1, 2, 3].map(rank => (
                    <div className="reg-pref-item" key={rank}>
                      <div className={`pref-rank pref-rank-${rank}`}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                      </div>
                      <div className="reg-field" style={{ flex: 1 }}>
                        <label className="reg-label">
                          {rank === 1 ? '1st Preference' : rank === 2 ? '2nd Preference' : '3rd Preference'}
                          {rank === 1 ? <span className="req"> *</span> : <span className="opt"> (optional)</span>}
                        </label>
                        <select
                          className="reg-select"
                          value={form[`pref${rank}_course_id`]}
                          onChange={e => set(`pref${rank}_course_id`, e.target.value)}
                          required={rank === 1}
                        >
                          <option value="">Select a course...</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.course_name} ({c.course_code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="reg-submit-btn" disabled={submitting || loadingCourses}>
              {submitting ? (
                <>
                  <div className="btn-spinner" />
                  Registering...
                </>
              ) : (
                <>
                  Register Now
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
