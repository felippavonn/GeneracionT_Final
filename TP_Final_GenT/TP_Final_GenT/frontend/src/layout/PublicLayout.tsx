/**
 * PublicLayout - Layout para páginas públicas (home, login, register)
 * Reserva Club Frontend
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Menu, X, Calendar, Users, Trophy } from 'lucide-react';
import { useState } from 'react';

export function PublicLayout() {
  const { user, isLoading, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Inicio', icon: Calendar },
    { href: '/', label: 'Canchas', icon: Trophy },
    { href: '/', label: 'Nosotros', icon: Users },
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
      {/* Header */}
      <header className="bg-white border-b border-secondary-200 sticky top-0 z-40">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Principal">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2" aria-label="Reserva Club - Inicio">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-secondary-900">Reserva Club</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-6">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  to={href}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    location.pathname === href
                      ? 'text-primary-600'
                      : 'text-secondary-600 hover:text-secondary-900'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {label}
                </Link>
              ))}

              <div className="flex items-center gap-3 ml-4">
                {user ? (
                  <>
                    <Link to="/mis-reservas" className="btn btn-secondary btn-sm">
                      Mis Reservas
                    </Link>
                    <Link to="/lista-espera" className="btn btn-secondary btn-sm">
                      Lista Espera
                    </Link>
                    {user.rol === 'admin' && (
                      <Link to="/admin" className="btn btn-primary btn-sm">
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="btn btn-ghost btn-sm text-danger-600 hover:bg-danger-50"
                    >
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-ghost btn-sm">
                      Iniciar sesión
                    </Link>
                    <Link to="/register" className="btn btn-primary btn-sm">
                      Registrarse
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn btn-ghost p-2"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div id="mobile-menu" className="md:hidden py-4 border-t border-secondary-100">
              <div className="flex flex-col gap-2">
                {navLinks.map(({ href, label, icon: Icon }) => (
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
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    {label}
                  </Link>
                ))}
                <div className="pt-2 border-t border-secondary-100 flex flex-col gap-2">
                  {user ? (
                    <>
                      <Link to="/mis-reservas" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary">
                        Mis Reservas
                      </Link>
                      <Link to="/lista-espera" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary">
                        Lista Espera
                      </Link>
                      {user.rol === 'admin' && (
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary">
                          Panel Admin
                        </Link>
                      )}
                      <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="btn btn-danger">
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline">
                        Iniciar sesión
                      </Link>
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary">
                        Registrarse
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-secondary-900 text-secondary-300 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            Reserva Club - Club Atlético Villanorte &copy; {new Date().getFullYear()}
          </p>
          <p className="text-xs mt-1">Sistema de reservas de canchas deportivas</p>
        </div>
      </footer>
    </div>
  );
}