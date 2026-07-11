import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

const titles = {
  '/': 'Dashboard',
  '/students': 'Student Management',
  '/courses': 'Course Management',
  '/allocations': 'Allocation Engine',
  '/ai-assistant': 'AI Assistant',
};

export default function Navbar() {
  const { pathname } = useLocation();
  const title = titles[pathname] || 'Dashboard';

  return (
    <header className="h-16 flex items-center px-6 justify-between border-b border-gray-300/60"
      >
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-400">Student Course Allocation System</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-white/60 border border-gray-200/50 rounded-lg pl-8 pr-4 py-2 text-sm text-gray-900 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 w-48"
          />
        </div>
        <button className="relative btn-icon text-gray-500 hover:text-gray-900">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center text-xs font-bold text-gray-900 cursor-pointer hover:scale-105 transition-transform">
          AD
        </div>
      </div>
    </header>
  );
}
