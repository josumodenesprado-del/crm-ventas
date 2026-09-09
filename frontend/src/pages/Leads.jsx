import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const estados = [
  { value: 'sin_contactar', label: 'Sin Contactar' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'interesado', label: 'Interesado' },
  { value: 'propuesta_enviada', label: 'Propuesta Enviada' },
  { value: 'cerrado_ganado', label: 'Ganado' },
  { value: 'cerrado_perdido', label: 'Perdido' },
];

const badgeColors = {
  sin_contactar: 'bg-gray-100 text-gray-800',
  contactado: 'bg-blue-100 text-blue-800',
  interesado: 'bg-yellow-100 text-yellow-800',
  propuesta_enviada: 'bg-purple-100 text-purple-800',
  cerrado_ganado: 'bg-green-100 text-green-800',
  cerrado_perdido: 'bg-red-100 text-red-800',
};

const CATEGORIAS = {
  web: 'Páginas Web',
  clinica: 'Clínicas Dental y Estética',
};

const Leads = ({ categoria }) => {
  const { user, token } = useAuth();
  const toast = useToast();
  const titulo = CATEGORIAS[categoria] || 'Leads';
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroVendedor, setFiltroVendedor] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [vendedores, setVendedores] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ nombre: '', empresa: '', telefono: '', email: '', estado: 'sin_contactar', notas: '', fecha_seguimiento: '', categoria: categoria || 'web', ciudad: '', provincia: '', direccion: '' });

  useEffect(() => {
    fetchLeads();
    if (user?.rol === 'admin') fetchVendedores();
  }, []);

  const fetchLeads = async () => {
    const res = await fetch('/api/leads', { headers: { Authorization: `Bearer ${token}` } });
    setLeads(await res.json());
    setLoading(false);
  };

  const fetchVendedores = async () => {
    const res = await fetch('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setVendedores(await res.json());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const url = editingLead ? `/api/leads/${editingLead.id}` : '/api/leads';
    const method = editingLead ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
    await fetchLeads();
    setShowModal(false);
    setEditingLead(null);
    setForm({ nombre: '', empresa: '', telefono: '', email: '', estado: 'sin_contactar', notas: '', fecha_seguimiento: '', categoria: categoria || 'web', ciudad: '', provincia: '', direccion: '' });
    setSubmitting(false);
    toast.success(editingLead ? 'Lead actualizado' : 'Lead creado');
  };

  const handleDelete = async (id) => {
    await fetch(`/api/leads/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchLeads();
    toast.success('Lead eliminado');
    setConfirmDelete(null);
  };

  const openEdit = (lead) => {
    setEditingLead(lead);
    setForm({ nombre: lead.nombre, empresa: lead.empresa || '', telefono: lead.telefono || '', email: lead.email || '', estado: lead.estado, notas: lead.notas || '', fecha_seguimiento: lead.fecha_seguimiento ? lead.fecha_seguimiento.split('T')[0] : '', categoria: lead.categoria || 'web', ciudad: lead.ciudad || '', provincia: lead.provincia || '', direccion: lead.direccion || '' });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingLead(null);
    setForm({ nombre: '', empresa: '', telefono: '', email: '', estado: 'sin_contactar', notas: '', fecha_seguimiento: '', categoria: categoria || 'web', ciudad: '', provincia: '', direccion: '' });
    setShowModal(true);
  };

  const exportarCSV = () => {
    const encabezado = ['Nombre', 'Empresa', 'Telefono', 'Email', 'Estado', 'Seguimiento', 'Notas'];
    const filas = leadsFiltrados.map(l => [
      l.nombre,
      l.empresa || '',
      l.telefono || '',
      l.email || '',
      estados.find(e => e.value === l.estado)?.label || l.estado,
      l.fecha_seguimiento ? l.fecha_seguimiento.split('T')[0] : '',
      l.notas || ''
    ]);
    const csv = [encabezado, ...filas].map(f => f.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${categoria || 'todos'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Leads exportados');
  };

  const leadsFiltrados = leads.filter(l => {
    const q = busqueda.toLowerCase();
    const matchBusqueda = !q || l.nombre.toLowerCase().includes(q) || (l.empresa && l.empresa.toLowerCase().includes(q)) || (l.email && l.email.toLowerCase().includes(q)) || (l.ciudad && l.ciudad.toLowerCase().includes(q)) || (l.provincia && l.provincia.toLowerCase().includes(q));
    const matchEstado = filtroEstado === 'todos' || l.estado === filtroEstado;
    const matchVendedor = filtroVendedor === 'todos' || l.asignado_a == filtroVendedor;
    const matchCategoria = !categoria || (l.categoria || 'web') === categoria;
    let matchFecha = true;
    if (filtroFecha) {
      matchFecha = l.fecha_seguimiento && l.fecha_seguimiento.split('T')[0] === filtroFecha;
    }
    return matchBusqueda && matchEstado && matchVendedor && matchCategoria && matchFecha;
  });

  if (loading) return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4">
        <div className="h-10 bg-gray-100 rounded mb-3"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-50 dark:bg-gray-700/50 rounded mb-2"></div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Leads · {titulo}</h1>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-48 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400" />
          </div>
          <button onClick={exportarCSV} className="bg-green-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-700 transition text-sm whitespace-nowrap">Excel</button>
          <button onClick={openNew} className="bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition text-sm whitespace-nowrap">+ Nuevo</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
          <option value="todos">Todos los estados</option>
          {estados.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        {user?.rol === 'admin' && (
          <select value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            <option value="todos">Todos los vendedores</option>
            {vendedores.filter(v => v.rol === 'vendedor').map(v => (
              <option key={v.id} value={v.id}>{v.nombre}</option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-2">
          <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
          {filtroFecha && <button onClick={() => setFiltroFecha('')} className="text-gray-400 hover:text-gray-600 text-sm">Limpiar</button>}
        </div>
        <span className="text-sm text-gray-400 ml-auto hidden sm:inline">{leadsFiltrados.length} de {leads.length}</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Empresa</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Contacto</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Ubicación</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Notas</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Seguimiento</th>
                {user?.rol === 'admin' && <th className="px-4 py-3 font-medium hidden lg:table-cell">Vendedor</th>}
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {leadsFiltrados.map((lead) => (
                <tr key={lead.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 dark:text-white">{lead.nombre}</div>
                    <div className="text-xs text-gray-400 sm:hidden">{lead.empresa || ''}</div>
                    <div className="text-xs text-gray-400 md:hidden">{lead.telefono || lead.email || ''}</div>
                    {(lead.ciudad || lead.provincia) && <div className="text-xs text-gray-400 md:hidden">📍 {[lead.ciudad, lead.provincia].filter(Boolean).join(', ')}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{lead.empresa || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    {lead.telefono && <div>{lead.telefono}</div>}
                    {lead.email && <div>{lead.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    {(lead.ciudad || lead.provincia) ? (
                      <div className="max-w-[200px]">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">📍 {[lead.ciudad, lead.provincia].filter(Boolean).join(', ')}</div>
                        {lead.direccion && <div className="text-xs text-gray-500 dark:text-gray-400 break-words">{lead.direccion}</div>}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColors[lead.estado]}`}>
                      {estados.find(e => e.value === lead.estado)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[150px] hidden lg:table-cell">
                    {lead.notas ? <span className="block truncate" title={lead.notas}>{lead.notas}</span> : '-'}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {lead.fecha_seguimiento ? (() => {
                      const hoy = new Date(); hoy.setHours(0,0,0,0);
                      const segStr = lead.fecha_seguimiento.split('T')[0];
                      const seg = new Date(segStr + 'T00:00:00');
                      const diff = Math.floor((seg - hoy) / (1000*60*60*24));
                      const [y,m,d] = segStr.split('-');
                      if (diff < 0) return <span className="text-red-600 font-medium text-xs">Vencido {Math.abs(diff)}d</span>;
                      if (diff === 0) return <span className="text-orange-500 font-medium text-xs">Es hoy</span>;
                      if (diff <= 3) return <span className="text-yellow-600 text-xs">En {diff}d</span>;
                      return <span className="text-gray-500 dark:text-gray-400 text-xs">{d}/{m}/{y}</span>;
                    })() : '-'}
                  </td>
                  {user?.rol === 'admin' && <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs hidden lg:table-cell">{lead.vendedor_nombre}</td>}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(lead)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                      <button onClick={() => setConfirmDelete(lead)} className="text-red-600 hover:text-red-800 text-sm font-medium">Borrar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {leadsFiltrados.length === 0 && (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">{busqueda ? 'No se encontraron leads' : 'No hay leads. Crea el primero!'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{editingLead ? 'Editar Lead' : 'Nuevo Lead'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa / Clinica</label>
                <input type="text" value={form.empresa} onChange={(e) => setForm({...form, empresa: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefono</label>
                  <input type="tel" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                <select value={form.estado} onChange={(e) => setForm({...form, estado: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                  {estados.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de lead</label>
                <select value={form.categoria} onChange={(e) => setForm({...form, categoria: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                  <option value="web">Páginas Web</option>
                  <option value="clinica">Clínicas Dental y Estética</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ciudad</label>
                  <input type="text" value={form.ciudad} onChange={(e) => setForm({...form, ciudad: e.target.value})} placeholder="Ej. Lorca" className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provincia</label>
                  <input type="text" value={form.provincia} onChange={(e) => setForm({...form, provincia: e.target.value})} placeholder="Ej. Murcia" className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                <input type="text" value={form.direccion} onChange={(e) => setForm({...form, direccion: e.target.value})} placeholder="Calle y número" className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
                <textarea value={form.notas} onChange={(e) => setForm({...form, notas: e.target.value})} rows={3} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" placeholder="Notas..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Seguimiento</label>
                <input type="date" value={form.fecha_seguimiento} onChange={(e) => setForm({...form, fecha_seguimiento: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">Cancelar</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">{submitting ? 'Guardando...' : (editingLead ? 'Guardar' : 'Crear')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmDelete && (
        <ConfirmModal
          titulo="Eliminar Lead"
          mensaje={`¿Eliminar "${confirmDelete.nombre}"? No se puede deshacer.`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default Leads;
