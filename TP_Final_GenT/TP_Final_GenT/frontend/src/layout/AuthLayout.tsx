/**
 * AuthLayout - Layout para usuario autenticado (mis reservas, lista espera)
 * Reserva Club Frontend
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Calendar, Clock, List, LogOut, User, Menu, X, Bell } from 'lucide-react';
import { useState } from 'react';

export function AuthLayout() {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/mis-reservas', label: 'Mis Reservas', icon: Calendar },
    { href: '/lista-espera', label: 'Lista de Espera', icon: List },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <header className="bg-white border-b border-secondary-200 sticky top-0 z-40">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Usuario">
          <div className="flex h-16 items-center justify-between">
            {/* Logo + Brand */}
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2" aria-label="Reserva Club - Inicio">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-secondary-900">Reserva Club</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  to={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium transition-colors ${
                    location.pathname === href
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {label}
                </Link>
              ))}

              <div className="flex items-center gap-3 ml-4">
                {/* Notificaciones placeholder */}
                <button className="btn btn-ghost p-2 relative" aria-label="Notificaciones">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    className="btn btn-ghost flex items-center gap-2 p-1"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="hidden sm:block font-medium text-secondary-700">
                      {user?.email?.split('@')[0] || 'Usuario'}
                    </span>
                  </button>
                </div>

                <button onClick={logout} className="btn btn-ghost btn-sm text-danger-600 hover:bg-danger-50">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn btn-ghost p-2"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-secondary-100 flex flex-col gap-2">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  to={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-button text-base font-medium ${
                    location.pathname === href
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-secondary-600 hover:bg-secondary-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
              <div className="pt-2 border-t border-secondary-100 flex flex-col gap-2">
                <button onClick={logout} className="btn btn-danger w-full justify-center">
                  <LogOut className="w-5 h-5" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-secondary-900 text-secondary-300 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm">
          Reserva Club - Club Atlético Villanorte
        </div>
      </footer>
    </div>
  );
}