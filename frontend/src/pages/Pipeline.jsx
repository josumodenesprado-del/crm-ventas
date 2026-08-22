import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Pipeline = () => {
  const { token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState(null);

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
  }, []);

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

  const handleDrop = async (e, nuevoEstado) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.estado === nuevoEstado) return;

    try {
      await fetch(`/api/leads/${draggedLead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      setLeads(leads.map(l => 
        l.id === draggedLead.id ? { ...l, estado: nuevoEstado } : l
      ));
    } catch (error) {
      console.error('Error updating lead:', error);
    }

    setDraggedLead(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Pipeline</h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnLeads = leads.filter(l => l.estado === column.id);
          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-72"
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
              <div className={`${column.color} p-2 rounded-b-lg min-h-[400px]`}>
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    className="bg-white p-4 rounded-lg shadow-sm mb-2 cursor-move hover:shadow-md transition border border-gray-100"
                  >
                    <h4 className="font-medium text-gray-800">{lead.nombre}</h4>
                    {lead.empresa && (
                      <p className="text-sm text-gray-500 mt-1">{lead.empresa}</p>
                    )}
                    <div className="flex items-center mt-2 space-x-2 text-xs text-gray-400">
                      {lead.telefono && <span>📞 {lead.telefono}</span>}
                      {lead.email && <span>✉️ {lead.email}</span>}
                    </div>
                    {lead.vendedor_nombre && (
                      <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                        {lead.vendedor_nombre}
                      </div>
                    )}
                  </div>
                ))}
                {columnLeads.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Arrastra leads aquí
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pipeline;