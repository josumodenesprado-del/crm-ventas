import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Pipeline = () => {
  const { user, token } = useAuth();
  const toast = useToast();
  const [leads, setLeads] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [vendedorFilter, setVendedorFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState(null);

  const [showSeguimientoModal, setShowSeguimientoModal] = useState(false);
  const [pendingMove, setPendingMove] = useState(null);
  const [segFecha, setSegFecha] = useState('');

  const columns = [
    { id: 'sin_contactar', label: 'Sin Contactar', color: 'bg-gray-100', headerColor: 'bg-gray-500' },
    { id: 'contactado', label: 'Contactado', color: 'bg-blue-50', headerColor: 'bg-blue-500' },
    { id: 'interesado', label: 'Interesado', color: 'bg-yellow-50', headerColor: 'bg-yellow-500' },
    { id: 'propuesta_enviada', label: 'Propuesta Enviada', color: 'bg-purple-50', headerColor: 'bg-purple-500' },
    { id: 'cerrado_ganado', label: 'Ganado', color: 'bg-green-50', headerColor: 'bg-green-500' },
    { id: 'cerrado_perdido', label: 'Perdido', color: 'bg-red-50', headerColor: 'bg-red-500' },
  ];

  useEffect(() => {
    fetchLeads();
    if (user?.rol === 'admin') fetchVendedores();
  }, []);

  const fetchVendedores = async () => {
    const res = await fetch('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setVendedores(await res.json());
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, nuevoEstado) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.estado === nuevoEstado) return;

    setPendingMove({ lead: draggedLead, nuevoEstado });
    setSegFecha('');
    setShowSeguimientoModal(true);
    setDraggedLead(null);
  };

  const confirmMove = async (withDate) => {
    if (!pendingMove) return;

    const { lead, nuevoEstado } = pendingMove;
    const fecha = withDate && segFecha ? segFecha : null;

    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado, fecha_seguimiento: fecha })
      });

      setLeads(leads.map(l =>
        l.id === lead.id ? { ...l, estado: nuevoEstado, fecha_seguimiento: fecha } : l
      ));
      toast.success(`Lead movido a ${columns.find(c => c.id === nuevoEstado)?.label}`);
    } catch (error) {
      console.error('Error updating lead:', error);
    }

    setShowSeguimientoModal(false);
    setPendingMove(null);
    setSegFecha('');
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-48"></div>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-t-lg"></div>
              <div className="bg-gray-100 dark:bg-gray-700/50 rounded-b-lg p-2 min-h-[400px]">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="bg-white dark:bg-gray-800 p-3 rounded-lg mb-2 shadow-sm">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const colLabel = pendingMove ? columns.find(c => c.id === pendingMove.nuevoEstado)?.label : '';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Pipeline</h1>
        {user?.rol === 'admin' && vendedores.length > 0 && (
          <select
            value={vendedorFilter}
            onChange={(e) => setVendedorFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            <option value="todos">Todos los vendedores</option>
            {vendedores.filter(v => v.rol === 'vendedor').map(v => (
              <option key={v.id} value={v.id}>{v.nombre}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-6 gap-3">
        {columns.map((column) => {
          let filteredLeads = leads.filter(l => l.estado === column.id);
          if (vendedorFilter !== 'todos') {
            filteredLeads = filteredLeads.filter(l => l.asignado_a == vendedorFilter);
          }
          const columnLeads = filteredLeads;
          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`${column.headerColor} text-white px-4 py-3 rounded-t-lg`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{column.label}</h3>
                  <span className="bg-white bg-opacity-30 px-2 py-1 rounded-full text-sm">
                    {columnLeads.length}
                  </span>
                </div>
              </div>
              <div className={`${column.color} dark:bg-gray-800/50 p-2 rounded-b-lg min-h-[400px]`}>
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm mb-2 cursor-move hover:shadow-md transition border border-gray-100 dark:border-gray-700"
                  >
                    <h4 className="font-medium text-gray-800 dark:text-white text-sm leading-tight">{lead.nombre}</h4>
                    {lead.empresa && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{lead.empresa}</p>
                    )}
                    {lead.fecha_seguimiento && (
                      (() => {
                        const hoy = new Date(); hoy.setHours(0,0,0,0);
                        const segStr = lead.fecha_seguimiento.split('T')[0];
                        const seg = new Date(segStr + 'T00:00:00');
                        const diff = Math.floor((seg - hoy) / (1000*60*60*24));
                        let cls = 'bg-gray-100 dark:bg-gray-700 text-gray-400';
                        const [y,m,d] = segStr.split('-');
                        let txt = `${d}/${m}/${y}`;
                        if (diff < 0) { cls = 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium'; txt = `Vencido ${Math.abs(diff)}d`; }
                        else if (diff === 0) { cls = 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium'; txt = 'Hoy'; }
                        else if (diff <= 3) { cls = 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'; txt = `En ${diff}d`; }
                        return <div className={`mt-2 text-xs px-2 py-0.5 rounded ${cls}`}>{txt}</div>;
                      })()
                    )}
                  </div>
                ))}
                {columnLeads.length === 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    Arrastra leads aquí
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showSeguimientoModal && pendingMove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Seguimiento</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span className="font-medium">{pendingMove.lead.nombre}</span> → <span className="font-medium">{colLabel}</span>
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Próximo seguimiento</label>
                <input
                  type="date"
                  value={segFecha}
                  onChange={(e) => setSegFecha(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-400 mt-1">¿Cuándo toca contactar de nuevo?</p>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => { setShowSeguimientoModal(false); setPendingMove(null); }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmMove(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition"
                >
                  Sin fecha
                </button>
                <button
                  onClick={() => confirmMove(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
