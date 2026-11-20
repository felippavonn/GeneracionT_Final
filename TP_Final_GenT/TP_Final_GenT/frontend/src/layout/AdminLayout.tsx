/**
 * AdminLayout - Layout para panel de administración
 * Reserva Club Frontend
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Grid,
  Users,
  Calendar,
  Zap,
  Wrench,
  ClipboardList,
  BarChart3,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/canchas', label: 'Canchas', icon: Grid },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/feriados', label: 'Feriados', icon: Calendar },
  { href: '/admin/franjas-pico', label: 'Franjas Pico', icon: Zap },
  { href: '/admin/bloqueos', label: 'Mantenimiento', icon: Wrench },
  { href: '/admin/auditoria', label: 'Auditoría', icon: ClipboardList },
  { href: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
];

export function AdminLayout() {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-secondary-200 sticky top-0 z-40">
        <div className="flex h-16 items-center justify-between px-4">
          <Link to="/admin" className="flex items-center gap-2" aria-label="Admin Dashboard">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-secondary-900">Admin Panel</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-ghost p-2"
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-secondary-200 transform transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
          aria-label="Navegación administración"
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-secondary-200">
              <Link to="/admin" className="flex items-center gap-2" aria-label="Admin Dashboard">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-secondary-900">Admin Panel</span>
              </Link>
              <button
                className="md:hidden btn btn-ghost p-2"
                onClick={() => setSidebarOpen(false)}
                aria-label="Cerrar menú lateral"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Menú principal">
              {adminNavItems.map(({ href, label, icon: Icon }) => {
                const isActive = location.pathname === href || (href !== '/admin' && location.pathname.startsWith(href));
                return (
                  <Link
                    key={label}
                    to={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar Footer - User Info */}
            <div className="p-4 border-t border-secondary-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 truncate">
                    {user?.email?.split('@')[0] || 'Admin'}
                  </p>
                  <p className="text-xs text-secondary-500">Administrador</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-3 w-full btn btn-ghost btn-sm justify-start text-danger-600 hover:bg-danger-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 md:ml-0 min-h-screen">
          {/* Top Bar */}
          <header className="hidden md:sticky md:top-0 bg-white border-b border-secondary-200 z-30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <h1 className="text-xl font-semibold text-secondary-900">
                  {adminNavItems.find(item =>
                    location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href))
                  )?.label || 'Dashboard'}
                </h1>
                <div className="flex items-center gap-3">
                  <Link to="/" className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer">
                    Ver sitio público
                  </Link>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}