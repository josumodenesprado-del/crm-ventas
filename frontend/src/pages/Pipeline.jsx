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
  const [detailLead, setDetailLead] = useState(null);
  const [detailActivity, setDetailActivity] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const columns = [
    { id: 'sin_contactar', label: 'Sin Contactar', color: 'bg-gray-100', headerColor: 'bg-gray-500' },
    { id: 'contactado', label: 'Contactado', color: 'bg-blue-50', headerColor: 'bg-blue-500' },
    { id: 'interesado', label: 'Interesado', color: 'bg-yellow-50', headerColor: 'bg-yellow-500' },
    { id: 'propuesta_enviada', label: 'Propuesta', color: 'bg-purple-50', headerColor: 'bg-purple-500' },
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
      const res = await fetch('/api/leads', { headers: { Authorization: `Bearer ${token}` } });
      setLeads(await res.json());
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

  const moveLead = async (nuevoEstado, withDate) => {
    if (!pendingMove) return;
    const { lead } = pendingMove;
    const fecha = withDate && segFecha ? segFecha : null;
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: nuevoEstado, fecha_seguimiento: fecha })
      });
      setLeads(leads.map(l => l.id === lead.id ? { ...l, estado: nuevoEstado, fecha_seguimiento: fecha } : l));
      if (detailLead && detailLead.id === lead.id) {
        setDetailLead({ ...detailLead, estado: nuevoEstado, fecha_seguimiento: fecha });
      }
      toast.success(`Lead movido a ${columns.find(c => c.id === nuevoEstado)?.label}`);
    } catch (error) {
      console.error('Error updating lead:', error);
    }
    setShowSeguimientoModal(false);
    setPendingMove(null);
    setSegFecha('');
  };

  const saveNotes = async () => {
    if (!detailLead || savingNotes) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/leads/${detailLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          notas: notesDraft,
          fecha_seguimiento: detailLead.fecha_seguimiento ? detailLead.fecha_seguimiento.split('T')[0] : null
        })
      });
      if (!res.ok) throw new Error('Error al guardar');
      const updated = await res.json();
      setDetailLead(updated);
      setLeads(leads.map(l => l.id === updated.id ? updated : l));
      setEditingNotes(false);
      toast.success('Notas guardadas');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('No se pudo guardar');
    } finally {
      setSavingNotes(false);
    }
  };

  const openDetail = async (lead) => {
    setDetailLead(lead);
    setDetailActivity([]);
    setDetailLoading(true);
    setEditingNotes(false);
    setNotesDraft(lead.notas || '');
    try {
      const res = await fetch(`/api/leads/${lead.id}/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDetailActivity(await res.json());
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
        <div className="grid grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="h-12 bg-gray-300 rounded-t-lg"></div>
              <div className="bg-gray-100 rounded-b-lg p-2 min-h-[400px]"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const colLabel = pendingMove ? columns.find(c => c.id === pendingMove.nuevoEstado)?.label : '';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Pipeline</h1>
        {user?.rol === 'admin' && vendedores.length > 0 && (
          <select value={vendedorFilter} onChange={(e) => setVendedorFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
            <option value="todos">Todos los vendedores</option>
            {vendedores.filter(v => v.rol === 'vendedor').map(v => (
              <option key={v.id} value={v.id}>{v.nombre}</option>
            ))}
          </select>
        )}
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex sm:grid sm:grid-cols-6 gap-3" style={{ minWidth: '900px' }}>
          {columns.map((column) => {
            let filteredLeads = leads.filter(l => l.estado === column.id);
            if (vendedorFilter !== 'todos') {
              filteredLeads = filteredLeads.filter(l => l.asignado_a == vendedorFilter);
            }
            return (
              <div key={column.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, column.id)} className="min-w-[180px] flex-shrink-0 sm:flex-shrink">
                <div className={`${column.headerColor} text-white px-3 py-2.5 rounded-t-lg`}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm">{column.label}</h3>
                    <span className="bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs">{filteredLeads.length}</span>
                  </div>
                </div>
                <div className={`${column.color} dark:bg-gray-800/50 p-2 rounded-b-lg min-h-[300px] sm:min-h-[400px]`}>
                  {filteredLeads.map((lead) => (
                    <div key={lead.id} draggable onDragStart={(e) => handleDragStart(e, lead)}
                      onClick={() => openDetail(lead)}
                      className="bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm mb-2 cursor-pointer hover:shadow-md transition border border-gray-100 dark:border-gray-700">
                      <h4 className="font-medium text-gray-800 dark:text-white text-sm leading-tight">{lead.nombre}</h4>
                      {lead.empresa && <p className="text-xs text-gray-400 mt-1 truncate">{lead.empresa}</p>}
                      {lead.fecha_seguimiento && (() => {
                        const hoy = new Date(); hoy.setHours(0,0,0,0);
                        const segStr = lead.fecha_seguimiento.split('T')[0];
                        const seg = new Date(segStr + 'T00:00:00');
                        const diff = Math.floor((seg - hoy) / (1000*60*60*24));
                        let cls = 'bg-gray-100 dark:bg-gray-700 text-gray-400';
                        const [y,m,d] = segStr.split('-');
                        let txt = `${d}/${m}/${y}`;
                        if (diff < 0) { cls = 'bg-red-50 dark:bg-red-900/30 text-red-600 font-medium'; txt = `Vencido ${Math.abs(diff)}d`; }
                        else if (diff === 0) { cls = 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 font-medium'; txt = 'Hoy'; }
                        else if (diff <= 3) { cls = 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600'; txt = `En ${diff}d`; }
                        return <div className={`mt-1.5 text-xs px-2 py-0.5 rounded ${cls}`}>{txt}</div>;
                      })()}
                      {user?.rol === 'admin' && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {columns.filter(c => c.id !== lead.estado).slice(0, 3).map(c => (
                            <button key={c.id} onClick={(e) => { e.stopPropagation(); setPendingMove({ lead, nuevoEstado: c.id }); setSegFecha(''); setShowSeguimientoModal(true); }}
                              className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-400">
                              → {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredLeads.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs">Arrastra aquí</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {detailLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={() => setDetailLead(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{detailLead.nombre}</h2>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${columns.find(c => c.id === detailLead.estado)?.headerColor} text-white`}>
                  {columns.find(c => c.id === detailLead.estado)?.label}
                </span>
              </div>
              <button onClick={() => setDetailLead(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              {detailLead.empresa && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Empresa</p>
                  <p className="text-sm text-gray-800 dark:text-white">{detailLead.empresa}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detailLead.telefono && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase">Teléfono</p>
                    <a href={`tel:${detailLead.telefono.replace(/\s/g, '')}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">📞 {detailLead.telefono}</a>
                  </div>
                )}
                {detailLead.email && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase">Email</p>
                    <a href={`mailto:${detailLead.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all">{detailLead.email}</a>
                  </div>
                )}
              </div>
              {(detailLead.ciudad || detailLead.provincia || detailLead.direccion) && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Ubicación</p>
                  <p className="text-sm text-gray-800 dark:text-white">📍 {[detailLead.ciudad, detailLead.provincia].filter(Boolean).join(', ')}</p>
                  {detailLead.direccion && <p className="text-sm text-gray-500 dark:text-gray-400">{detailLead.direccion}</p>}
                </div>
              )}
              {detailLead.fecha_seguimiento && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Próximo seguimiento</p>
                  <p className="text-sm text-gray-800 dark:text-white">📅 {detailLead.fecha_seguimiento.split('T')[0].split('-').reverse().join('/')}</p>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-gray-400 uppercase">Notas</p>
                  {!editingNotes && (
                    <button onClick={() => { setNotesDraft(detailLead.notas || ''); setEditingNotes(true); }} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">Editar</button>
                  )}
                </div>
                {editingNotes ? (
                  <div>
                    <textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} rows={4}
                      placeholder="Escribe aquí lo hablado, próxima acción..."
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setEditingNotes(false)} className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">Cancelar</button>
                      <button onClick={saveNotes} disabled={savingNotes} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">{savingNotes ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                  </div>
                ) : (
                  detailLead.notas
                    ? <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{detailLead.notas}</p>
                    : <p className="text-sm text-gray-400 italic">Sin notas. Pulsa Editar para añadir.</p>
                )}
              </div>
              {detailLead.vendedor_nombre && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Vendedor</p>
                  <p className="text-sm text-gray-800 dark:text-white">{detailLead.vendedor_nombre}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase mb-2">Mover a</p>
                <div className="flex flex-wrap gap-2">
                  {columns.filter(c => c.id !== detailLead.estado).map(c => (
                    <button key={c.id} onClick={() => { setPendingMove({ lead: detailLead, nuevoEstado: c.id }); setSegFecha(''); setShowSeguimientoModal(true); }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90 transition ${c.headerColor}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase mb-2">Historial</p>
                {detailLoading ? (
                  <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
                ) : detailActivity.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detailActivity.map(a => (
                      <div key={a.id} className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xs text-gray-800 dark:text-white">{a.descripcion}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{a.usuario_nombre || 'Sistema'} · {new Date(a.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Sin actividad registrada</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSeguimientoModal && pendingMove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Seguimiento</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span className="font-medium">{pendingMove.lead.nombre}</span> → <span className="font-medium">{colLabel}</span>
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Próximo seguimiento</label>
                <input type="date" value={segFecha} onChange={(e) => setSegFecha(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button onClick={() => { setShowSeguimientoModal(false); setPendingMove(null); }} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">Cancelar</button>
                <button onClick={() => moveLead(pendingMove.nuevoEstado, false)} className="px-4 py-2 text-gray-600 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 rounded-lg transition text-sm">Sin fecha</button>
                <button onClick={() => moveLead(pendingMove.nuevoEstado, true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
