import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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

const Leads = () => {
  const { user, token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form, setForm] = useState({ nombre: '', empresa: '', telefono: '', email: '', estado: 'sin_contactar', notas: '' });

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    const res = await fetch('/api/leads', { headers: { Authorization: `Bearer ${token}` } });
    setLeads(await res.json());
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingLead ? `/api/leads/${editingLead.id}` : '/api/leads';
    const method = editingLead ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
    fetchLeads();
    setShowModal(false);
    setEditingLead(null);
    setForm({ nombre: '', empresa: '', telefono: '', email: '', estado: 'sin_contactar', notas: '' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este lead?')) return;
    await fetch(`/api/leads/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchLeads();
  };

  const openEdit = (lead) => {
    setEditingLead(lead);
    setForm({ nombre: lead.nombre, empresa: lead.empresa || '', telefono: lead.telefono || '', email: lead.email || '', estado: lead.estado, notas: lead.notas || '' });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingLead(null);
    setForm({ nombre: '', empresa: '', telefono: '', email: '', estado: 'sin_contactar', notas: '' });
    setShowModal(true);
  };

  if (loading) return <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Leads</h1>
        <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          + Nuevo Lead
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-6 py-4 font-medium">Nombre</th>
                <th className="px-6 py-4 font-medium">Empresa</th>
                <th className="px-6 py-4 font-medium">Contacto</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                {user?.rol === 'admin' && <th className="px-6 py-4 font-medium">Vendedor</th>}
                <th className="px-6 py-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{lead.nombre}</td>
                  <td className="px-6 py-4 text-gray-600">{lead.empresa || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {lead.telefono && <div>{lead.telefono}</div>}
                    {lead.email && <div>{lead.email}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColors[lead.estado]}`}>
                      {estados.find(e => e.value === lead.estado)?.label}
                    </span>
                  </td>
                  {user?.rol === 'admin' && <td className="px-6 py-4 text-sm text-gray-600">{lead.vendedor_nombre}</td>}
                  <td className="px-6 py-4">
                    <button onClick={() => openEdit(lead)} className="text-blue-600 hover:text-blue-800 mr-3">Editar</button>
                    <button onClick={() => handleDelete(lead.id)} className="text-red-600 hover:text-red-800">Eliminar</button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No hay leads aun. Crea el primero!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">{editingLead ? 'Editar Lead' : 'Nuevo Lead'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa / Clinica</label>
                <input type="text" value={form.empresa} onChange={(e) => setForm({...form, empresa: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                  <input type="tel" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select value={form.estado} onChange={(e) => setForm({...form, estado: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  {estados.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea value={form.notas} onChange={(e) => setForm({...form, notas: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Notas sobre este lead..." />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">{editingLead ? 'Guardar Cambios' : 'Crear Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;