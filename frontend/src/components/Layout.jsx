import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDarkMode } from '../context/DarkModeContext';

const Layout = () => {
  const { user, token, logout } = useAuth();
  const toast = useToast();
  const { dark, toggle } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Las contraseñas no coinciden');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Mínimo 6 caracteres');
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error); return; }
      setPwSuccess('Contraseña actualizada');
      toast.success('Contraseña actualizada');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => { setShowPasswordModal(false); setPwSuccess(''); }, 1500);
    } catch { setPwError('Error de conexión'); }
    finally { setPwLoading(false); }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/pipeline', label: 'Pipeline', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
    { path: '/leads', label: 'Leads', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  ];

  if (user?.rol === 'admin') {
    navItems.push({ path: '/usuarios', label: 'Usuarios', icon: 'M12 4.354a4 4 0 110 7.292 4 4 0 010-7.292zM15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' });
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <img src="/logo.png" alt="CRM" className="h-10 sm:h-14 w-auto object-contain" />
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === item.path
                        ? 'border-blue-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button onClick={toggle} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition" title={dark ? 'Modo claro' : 'Modo oscuro'}>
                {dark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>

              <div className="hidden md:flex items-center space-x-3">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{user?.nombre}</span>
                  <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">{user?.rol}</span>
                </div>
                <button onClick={() => setShowPasswordModal(true)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium">Cambiar contraseña</button>
                <button onClick={handleLogout} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium">Salir</button>
              </div>

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium ${
                    location.pathname === item.path
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="border-t dark:border-gray-700 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800 dark:text-white">{user?.nombre}</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">{user?.rol}</span>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => { setShowPasswordModal(true); setMobileMenuOpen(false); }} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Cambiar contraseña</button>
                <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium">Salir</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Cambiar contraseña</h2>
              <button onClick={() => { setShowPasswordModal(false); setPwError(''); setPwSuccess(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {pwError && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">{pwError}</div>}
              {pwSuccess && <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-3 rounded-lg text-sm">{pwSuccess}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña actual</label>
                <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({...pwForm, currentPassword: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva contraseña</label>
                <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({...pwForm, newPassword: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar contraseña</label>
                <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({...pwForm, confirmPassword: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" required />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => { setShowPasswordModal(false); setPwError(''); setPwSuccess(''); }} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">Cancelar</button>
                <button type="submit" disabled={pwLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">{pwLoading ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
