import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Table2, TrendingUp, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-dark-900/90 backdrop-blur-md border-b border-dark-700/50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-dark-100 leading-tight">Spend Analytics</p>
              <p className="text-xs text-dark-500">Platform</p>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>
            <NavLink
              to="/records"
              className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
            >
              <Table2 className="w-4 h-4" />
              <span className="hidden sm:inline">Records</span>
            </NavLink>
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-dark-400">
              <div className="w-7 h-7 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary-400" />
              </div>
              <span className="max-w-[120px] truncate">{user?.name || user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
