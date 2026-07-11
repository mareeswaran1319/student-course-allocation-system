import { useNavigate } from 'react-router-dom';
import { GraduationCap, Shield, ChevronRight, Users, BookOpen, Zap, Star } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-root">
      {/* Animated background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Grid pattern overlay */}
      <div className="grid-overlay" />

      <div className="landing-content">
        {/* Top badge */}
        <div className="landing-badge">
          <Zap size={14} />
          <span>AI-Powered Allocation System</span>
          <span className="badge-dot" />
          <span style={{ color: '#86efac' }}>Live</span>
        </div>

        {/* Hero title */}
        <div className="landing-hero">
          <div className="landing-logo-wrap">
            <div className="landing-logo">
              <GraduationCap size={36} className="text-white" />
            </div>
            <div className="landing-logo-ring" />
          </div>
          <h1 className="landing-title">
            Student Course
            <span className="landing-title-gradient"> Allocation</span>
            <br />System
          </h1>
          <p className="landing-subtitle">
            Smart, fair, and transparent course allocation powered by AI.<br />
            Choose your portal to get started.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="portal-cards">
          {/* Student Portal */}
          <div
            className="portal-card portal-card-student"
            onClick={() => navigate('/student/register')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/student/register')}
          >
            <div className="portal-card-glow portal-card-glow-student" />
            <div className="portal-card-inner">
              <div className="portal-icon-wrap portal-icon-student">
                <Users size={28} className="text-white" />
              </div>
              <div className="portal-info">
                <h2 className="portal-title">Student Portal</h2>
                <p className="portal-desc">
                  Register for courses and submit your preferences. Quick, easy, and secure.
                </p>
              </div>
              <div className="portal-features">
                <div className="portal-feature">
                  <Star size={12} />
                  <span>Course Registration</span>
                </div>
                <div className="portal-feature">
                  <Star size={12} />
                  <span>Preference Selection</span>
                </div>
                <div className="portal-feature">
                  <Star size={12} />
                  <span>Instant Confirmation</span>
                </div>
              </div>
              <div className="portal-cta portal-cta-student">
                <span>Register Now</span>
                <ChevronRight size={18} />
              </div>
            </div>
          </div>

          {/* Admin Portal */}
          <div
            className="portal-card portal-card-admin"
            onClick={() => navigate('/admin/login')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/login')}
          >
            <div className="portal-card-glow portal-card-glow-admin" />
            <div className="portal-card-inner">
              <div className="portal-icon-wrap portal-icon-admin">
                <Shield size={28} className="text-white" />
              </div>
              <div className="portal-info">
                <h2 className="portal-title">Admin Portal</h2>
                <p className="portal-desc">
                  Manage students, courses, and run AI-powered allocations. Full system control.
                </p>
              </div>
              <div className="portal-features">
                <div className="portal-feature">
                  <Star size={12} />
                  <span>Student Management</span>
                </div>
                <div className="portal-feature">
                  <Star size={12} />
                  <span>AI Allocation Engine</span>
                </div>
                <div className="portal-feature">
                  <Star size={12} />
                  <span>Real-time Dashboard</span>
                </div>
              </div>
              <div className="portal-cta portal-cta-admin">
                <span>Admin Login</span>
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="landing-stats">
          <div className="landing-stat">
            <BookOpen size={16} />
            <span><strong>6</strong> Courses Available</span>
          </div>
          <div className="landing-stat-divider" />
          <div className="landing-stat">
            <Users size={16} />
            <span><strong>Real-time</strong> Updates</span>
          </div>
          <div className="landing-stat-divider" />
          <div className="landing-stat">
            <Zap size={16} />
            <span><strong>AI-Powered</strong> Allocation</span>
          </div>
        </div>

        <p className="landing-footer">University Course Allocation System &copy; 2026</p>
      </div>
    </div>
  );
}
