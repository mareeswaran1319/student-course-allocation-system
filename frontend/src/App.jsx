import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';

// Public pages
import LandingPage from './pages/LandingPage';
import StudentRegistration from './pages/StudentRegistration';
import AdminLogin from './pages/AdminLogin';

// Admin pages
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Allocations from './pages/Allocations';
import AIAssistant from './pages/AIAssistant';

// Admin layout wrapping sidebar + navbar + content
function AdminLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public Routes ─────────────────────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/student/register" element={<StudentRegistration />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* ── Protected Admin Routes ────────────────────── */}
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <PrivateRoute>
                  <AdminLayout>
                    <Students />
                  </AdminLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <PrivateRoute>
                  <AdminLayout>
                    <Courses />
                  </AdminLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/allocations"
              element={
                <PrivateRoute>
                  <AdminLayout>
                    <Allocations />
                  </AdminLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/ai-assistant"
              element={
                <PrivateRoute>
                  <AdminLayout>
                    <AIAssistant />
                  </AdminLayout>
                </PrivateRoute>
              }
            />

            {/* Redirect old paths */}
            <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/students" element={<Navigate to="/admin/students" replace />} />
            <Route path="/courses" element={<Navigate to="/admin/courses" replace />} />
            <Route path="/allocations" element={<Navigate to="/admin/allocations" replace />} />
            <Route path="/ai-assistant" element={<Navigate to="/admin/ai-assistant" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
            }}
          />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
