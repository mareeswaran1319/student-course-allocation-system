import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, ListChecks, Bot,
  GraduationCap, Zap, LogOut, KeyRound, X, Eye, EyeOff, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/allocations', label: 'Allocations', icon: ListChecks },
  { to: '/admin/ai-assistant', label: 'AI Assistant', icon: Bot },
];

function ChangePasswordModal({ onClose, changePassword }) {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      toast.error('New passwords do not match.');
      return;
    }
    if (newPass.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPass, newPass);
      toast.success('Password changed successfully!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="card w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
              <KeyRound size={16} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
          </div>
          <button onClick={onClose} className="btn-icon text-gray-500 hover:text-gray-900">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="form-label">Current Password</label>
            <div className="relative">
              <input
                className="form-input pr-10"
                type={showCurrent ? 'text' : 'password'}
                placeholder="Current password"
                value={currentPass}
                onChange={e => setCurrentPass(e.target.value)}
                required
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowCurrent(p => !p)}>
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="form-label">New Password</label>
            <div className="relative">
              <input
                className="form-input pr-10"
                type={showNew ? 'text' : 'password'}
                placeholder="New password (min 6 chars)"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                required
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowNew(p => !p)}>
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Confirm new password"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { connected } = useSocket();
  const { admin, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  const [showChangePw, setShowChangePw] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <>
      {showChangePw && (
        <ChangePasswordModal onClose={() => setShowChangePw(false)} changePassword={changePassword} />
      )}

      <aside className="fixed left-0 top-0 h-full w-64 z-50 flex flex-col">
        <div className="absolute right-0 top-0 bottom-0 w-px" />

        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-300/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Course Allocation</p>
              <p className="text-gray-500 text-xs">University System</p>
            </div>
          </div>
        </div>

        {/* Admin badge */}
        {admin && (
          <div className="mx-4 mt-3 mb-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/50 text-xs font-medium">
              <ShieldCheck size={13} />
              <span>Admin: <strong>{admin.username}</strong></span>
            </div>
          </div>
        )}

        {/* Real-time Status */}
        <div className="mx-4 mt-2 mb-2">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
            ${connected ? 'bg-emerald-50 text-emerald-600 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {connected ? 'Live Connected' : 'Disconnected'}
            <Zap size={12} className="ml-auto" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                ${isActive
                  ? 'bg-primary-600/20 text-primary-700 border border-primary-200 shadow-lg shadow-primary-500/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={`${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`} />
                  {label}
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="px-3 pb-4 border-t border-gray-300/60 pt-3 space-y-1">
          <button
            onClick={() => setShowChangePw(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 transition-all duration-200"
          >
            <KeyRound size={16} className="text-gray-400" />
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut size={16} />
            Logout
          </button>
          <p className="text-gray-400 text-xs text-center pt-2">AI-Powered System v1.0</p>
        </div>
      </aside>
    </>
  );
}
