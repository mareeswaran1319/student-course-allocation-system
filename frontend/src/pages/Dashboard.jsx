import { useEffect, useState } from 'react';
import { allocationAPI, studentAPI, courseAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart
} from 'recharts';
import { Users, BookOpen, CheckCircle, XCircle, TrendingUp, Award, Target, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  General: '#3b82f6',
  OBC: '#a855f7',
  SC: '#f97316',
  ST: '#10b981',
};

const PREF_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export default function Dashboard() {
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [statsRes, studentsRes, coursesRes] = await Promise.all([
        allocationAPI.getStats(),
        studentAPI.getAll(),
        courseAPI.getAll(),
      ]);
      setStats(statsRes.data.data);
      setStudents(studentsRes.data.data);
      setCourses(coursesRes.data.data);
    } catch {
      // ok
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const events = ['allocation:complete', 'allocation:reset', 'student:created', 'student:deleted', 'course:created', 'course:deleted'];
    events.forEach(e => socket.on(e, () => { fetchAll(); toast.success('Dashboard updated!', { icon: '📊' }); }));
    return () => events.forEach(e => socket.off(e));
  }, [socket]);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  );

  const overall = stats?.overall || {};
  const perCourse = stats?.perCourse || [];
  const categoryWise = stats?.categoryWise || [];
  const prefData = [
    { name: '1st Pref', value: parseInt(overall.got_first_pref || 0), fill: '#10b981' },
    { name: '2nd Pref', value: parseInt(overall.got_second_pref || 0), fill: '#f59e0b' },
    { name: '3rd Pref', value: parseInt(overall.got_third_pref || 0), fill: '#ef4444' },
    { name: 'Unallocated', value: parseInt(overall.total_unallocated || 0), fill: '#6b7280' },
  ].filter(d => d.value > 0);

  const statCards = [
    { label: 'Total Students', value: students.length, icon: Users, color: 'from-blue-600 to-blue-400', glow: 'shadow-blue-500/20' },
    { label: 'Total Courses', value: courses.length, icon: BookOpen, color: 'from-purple-600 to-purple-400', glow: 'shadow-purple-500/20' },
    { label: 'Allocated', value: parseInt(overall.total_allocated || 0), icon: CheckCircle, color: 'from-emerald-600 to-emerald-400', glow: 'shadow-emerald-500/20' },
    { label: 'Unallocated', value: parseInt(overall.total_unallocated || 0), icon: XCircle, color: 'from-red-600 to-red-400', glow: 'shadow-red-500/20' },
    { label: 'Got 1st Choice', value: parseInt(overall.got_first_pref || 0), icon: Award, color: 'from-yellow-600 to-yellow-400', glow: 'shadow-yellow-500/20' },
    { label: 'Allocation Rate', value: students.length > 0 ? `${Math.round(parseInt(overall.total_allocated || 0) / students.length * 100)}%` : '0%', icon: TrendingUp, color: 'from-cyan-600 to-cyan-400', glow: 'shadow-cyan-500/20' },
  ];

  const courseChartData = perCourse.map(c => ({
    name: c.course_code,
    Allocated: parseInt(c.allocated),
    Available: parseInt(c.available),
    Total: parseInt(c.total_seats),
  }));

  const catChartData = categoryWise.map(c => ({
    name: c.category,
    value: parseInt(c.count),
    fill: CATEGORY_COLORS[c.category] || '#6b7280',
  }));

  const topStudents = [...students].sort((a, b) => b.marks - a.marks).slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, glow }) => (
          <div key={label} className={`stat-card shadow-xl ${glow}`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
              <Icon size={20} className="text-gray-900" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Allocation Bar Chart */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-1">Course Seat Utilization</h3>
          <p className="text-gray-400 text-xs mb-6">Allocated vs Available seats per course</p>
          {courseChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={courseChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827fff" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827fff', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#111827' }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />
                <Bar dataKey="Allocated" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Available" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Activity size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Run allocation to see statistics</p>
              </div>
            </div>
          )}
        </div>

        {/* Preference Distribution Pie */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Preference Distribution</h3>
          <p className="text-gray-400 text-xs mb-4">How students got their preferences</p>
          {prefData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={prefData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {prefData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827fff', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#111827' }} />
                <Legend formatter={(v) => <span className="text-gray-600 text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Target size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No allocation data yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Allocation */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Category-wise Allocation</h3>
          <p className="text-gray-400 text-xs mb-6">Students allocated by reservation category</p>
          {catChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#111827fff" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ background: '#111827fff', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#111827' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {catChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No category data yet</div>
          )}
        </div>

        {/* Top Students Table */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Top Merit Students</h3>
          <p className="text-gray-400 text-xs mb-4">Highest scoring applicants</p>
          <div className="space-y-3">
            {topStudents.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/40 hover:bg-white/60 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                  ${i === 0 ? 'bg-yellow-500/20 text-yellow-600' : i === 1 ? 'bg-dark-400/20 text-gray-600' : i === 2 ? 'bg-orange-700/20 text-orange-600' : 'bg-gray-100/40 text-gray-500'}`}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.student_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary-600">{s.marks}%</p>
                  <span className={`badge badge-${s.category.toLowerCase()}`}>{s.category}</span>
                </div>
              </div>
            ))}
            {topStudents.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No students registered yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
