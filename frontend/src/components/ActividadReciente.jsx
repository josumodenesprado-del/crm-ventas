import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const iconMap = {
  creado: { color: 'bg-blue-100 text-blue-600', icon: 'M12 4v16m8-8H4' },
  cambio_estado: { color: 'bg-purple-100 text-purple-600', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  editado: { color: 'bg-yellow-100 text-yellow-600', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  eliminado: { color: 'bg-red-100 text-red-600', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
  usuario_creado: { color: 'bg-green-100 text-green-600', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  usuario_editado: { color: 'bg-orange-100 text-orange-600', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  usuario_estado: { color: 'bg-gray-100 text-gray-600', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
};

const timeAgo = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString('es-ES');
};

const ActividadReciente = () => {
  const { token } = useAuth();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActividad();
  }, []);

  const fetchActividad = async () => {
    try {
      const res = await fetch('/api/actividad?limit=20', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setActividades(await res.json());
    } catch (error) {
      console.error('Error fetching actividad:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Actividad Reciente</h2>
        <button onClick={fetchActividad} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
          Actualizar
        </button>
      </div>
      <div className="space-y-3">
        {actividades.map(a => {
          const style = iconMap[a.accion] || iconMap.editado;
          return (
            <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className={`${style.color} p-2 rounded-lg flex-shrink-0 mt-0.5`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-white">
                  <span className="font-medium">{a.usuario_nombre || 'Sistema'}</span>
                  {' · '}
                  {a.descripcion}
                  {a.lead_nombre && (
                    <span className="text-gray-500 dark:text-gray-400"> — {a.lead_nombre}{a.lead_empresa ? ` (${a.lead_empresa})` : ''}</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(a.created_at)}</p>
              </div>
            </div>
          );
        })}
        {actividades.length === 0 && (
          <p className="text-center text-gray-400 py-8">Sin actividad registrada</p>
        )}
      </div>
    </div>
  );
};

export default ActividadReciente;
