import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const Usuarios = () => {
  const { token } = useAuth();
  const toast = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ username: '', nombre: '', password: '', rol: 'vendedor' });
  const [confirmToggle, setConfirmToggle] = useState(null);

  useEffect(() => { fetchUsuarios(); }, []);

  const fetchUsuarios = async () => {
    const res = await fetch('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setUsuarios(await res.json());
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingUser) {
      const body = { nombre: form.nombre, email: form.email, username: form.username, rol: form.rol };
      if (form.password) body.password = form.password;
      await fetch(`/api/auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
    } else {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
    }
    fetchUsuarios();
    closeModal();
    toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado');
  };

  const handleToggleActive = async () => {
    if (!confirmToggle) return;
    await fetch(`/api/auth/users/${confirmToggle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ activo: !confirmToggle.activo })
    });
    fetchUsuarios();
    toast.success(confirmToggle.activo ? 'Usuario desactivado' : 'Usuario activado');
    setConfirmToggle(null);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ username: user.username, nombre: user.nombre, email: user.email || '', password: '', rol: user.rol });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingUser(null);
    setForm({ username: '', nombre: '', email: '', password: '', rol: 'vendedor' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setForm({ username: '', nombre: '', email: '', password: '', rol: 'vendedor' });
  };

  if (loading) return (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-36"></div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded mb-3"></div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-50 dark:bg-gray-700/50 rounded mb-2"></div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Usuarios</h1>
        <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          + Nuevo Usuario
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-left text-sm text-gray-500 dark:text-gray-400">
                <th className="px-6 py-4 font-medium">Usuario</th>
                <th className="px-6 py-4 font-medium">Nombre</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Rol</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((user) => (
                <tr key={user.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 font-mono text-sm text-gray-800 dark:text-white">{user.username}</td>
                  <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">{user.nombre}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.rol === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'}`}>
                      {user.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setConfirmToggle(user)} className={`px-2 py-1 rounded-full text-xs font-medium ${user.activo ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'}`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => openEdit(user)} className="text-blue-600 hover:text-blue-800">Editar</button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No hay usuarios creados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usuario *</label>
                <input type="text" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-gray-700 text-gray-800 dark:text-white" placeholder="nombre_usuario" required />
                <p className="text-xs text-gray-400 mt-1">Para acceder al CRM</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" required />
              </div>
              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" placeholder="Opcional" />
                </div>
              )}
              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva contraseña</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" placeholder="Dejar vacío para no cambiar" />
                </div>
              )}
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña *</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" required />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                <select value={form.rol} onChange={(e) => setForm({...form, rol: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                  <option value="vendedor">Vendedor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">{editingUser ? 'Guardar' : 'Crear Usuario'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;