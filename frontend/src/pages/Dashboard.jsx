import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ActividadReciente from '../components/ActividadReciente';

const Dashboard = () => {
  const { token, user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads', { headers: { Authorization: `Bearer ${token}` } });
      setLeads(await res.json());
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 border"><div className="h-4 bg-gray-200 rounded w-20 mb-2"></div><div className="h-7 bg-gray-200 rounded w-12"></div></div>
          ))}
        </div>
      </div>
    );
  }

  const total = leads.length;
  const porEstado = {
    sin_contactar: leads.filter(l => l.estado === 'sin_contactar').length,
    contactado: leads.filter(l => l.estado === 'contactado').length,
    interesado: leads.filter(l => l.estado === 'interesado').length,
    propuesta_enviada: leads.filter(l => l.estado === 'propuesta_enviada').length,
    cerrado_ganado: leads.filter(l => l.estado === 'cerrado_ganado').length,
    cerrado_perdido: leads.filter(l => l.estado === 'cerrado_perdido').length,
  };

  const estados = [
    { key: 'sin_contactar', label: 'Sin Contactar', color: 'bg-gray-400' },
    { key: 'contactado', label: 'Contactado', color: 'bg-blue-500' },
    { key: 'interesado', label: 'Interesado', color: 'bg-yellow-500' },
    { key: 'propuesta_enviada', label: 'Propuesta', color: 'bg-purple-500' },
    { key: 'cerrado_ganado', label: 'Ganado', color: 'bg-green-500' },
    { key: 'cerrado_perdido', label: 'Perdido', color: 'bg-red-500' },
  ];

  const maxEstado = Math.max(...Object.values(porEstado), 1);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const seguimientosVencidos = leads.filter(l => { if (!l.fecha_seguimiento) return false; const f = new Date(l.fecha_seguimiento.split('T')[0] + 'T00:00:00'); return f < hoy; }).length;
  const seguimientosHoy = leads.filter(l => { if (!l.fecha_seguimiento) return false; const f = new Date(l.fecha_seguimiento.split('T')[0] + 'T00:00:00'); return f.getTime() === hoy.getTime(); }).length;
  const seguimientosProximos = leads.filter(l => { if (!l.fecha_seguimiento) return false; const f = new Date(l.fecha_seguimiento.split('T')[0] + 'T00:00:00'); const diff = Math.floor((f - hoy) / (1000*60*60*24)); return diff > 0 && diff <= 7; }).length;
  const leadsRecientes = [...leads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const tasaConversion = total > 0 ? Math.round((porEstado.cerrado_ganado / total) * 100) : 0;

  const vendedoresMap = {};
  leads.forEach(l => { const nombre = l.vendedor_nombre || 'Sin asignar'; if (!vendedoresMap[nombre]) vendedoresMap[nombre] = { total: 0, ganados: 0 }; vendedoresMap[nombre].total++; if (l.estado === 'cerrado_ganado') vendedoresMap[nombre].ganados++; });
  const vendedoresArr = Object.entries(vendedoresMap).map(([nombre, data]) => ({ nombre, ...data, tasa: data.total > 0 ? Math.round((data.ganados / data.total) * 100) : 0 })).sort((a, b) => b.total - a.total);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{total} leads</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Leads</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mt-1">{total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Conversión</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{tasaConversion}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Hoy</p>
          <p className="text-2xl sm:text-3xl font-bold text-orange-500 mt-1">{seguimientosHoy}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Vencidos</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-500 mt-1">{seguimientosVencidos}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4">Pipeline</h2>
          <div className="space-y-2.5">
            {estados.map(e => (
              <div key={e.key} className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 w-20 sm:w-28">{e.label}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 sm:h-6 overflow-hidden">
                  <div className={`${e.color} h-full rounded-full transition-all duration-500`} style={{ width: `${total > 0 ? (porEstado[e.key] / maxEstado) * 100 : 0}%` }}></div>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-6 sm:w-8 text-right">{porEstado[e.key]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4">Seguimientos</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-xs sm:text-sm text-red-700 dark:text-red-400 font-medium">Vencidos</span>
              <span className="text-lg sm:text-xl font-bold text-red-600">{seguimientosVencidos}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 sm:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span className="text-xs sm:text-sm text-orange-700 dark:text-orange-400 font-medium">Hoy</span>
              <span className="text-lg sm:text-xl font-bold text-orange-600">{seguimientosHoy}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <span className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-400 font-medium">Próx. 7 días</span>
              <span className="text-lg sm:text-xl font-bold text-yellow-600">{seguimientosProximos}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {user?.rol === 'admin' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4">Vendedores</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  <th className="pb-2 font-medium">Vendedor</th>
                  <th className="pb-2 font-medium text-center">Leads</th>
                  <th className="pb-2 font-medium text-center">Ganados</th>
                  <th className="pb-2 font-medium text-center">Tasa</th>
                </tr>
              </thead>
              <tbody>
                {vendedoresArr.map((v, i) => (
                  <tr key={i} className="border-b dark:border-gray-700 last:border-0">
                    <td className="py-2.5 font-medium text-gray-800 dark:text-white text-sm">{v.nombre}</td>
                    <td className="py-2.5 text-gray-600 dark:text-gray-400 text-center">{v.total}</td>
                    <td className="py-2.5 text-green-600 font-medium text-center">{v.ganados}</td>
                    <td className="py-2.5 text-center"><span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs font-medium">{v.tasa}%</span></td>
                  </tr>
                ))}
                {vendedoresArr.length === 0 && <tr><td colSpan="4" className="py-6 text-center text-gray-400">Sin datos</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4">Recientes</h2>
          <div className="space-y-2">
            {leadsRecientes.map(l => (
              <div key={l.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 dark:text-white text-sm truncate">{l.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{l.empresa || 'Sin empresa'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                  l.estado === 'cerrado_ganado' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                  l.estado === 'cerrado_perdido' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                  l.estado === 'interesado' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                  l.estado === 'contactado' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                  l.estado === 'propuesta_enviada' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}>{estados.find(e => e.key === l.estado)?.label}</span>
              </div>
            ))}
            {leadsRecientes.length === 0 && <p className="text-center text-gray-400 py-6">Sin leads</p>}
          </div>
        </div>
      </div>

      {user?.rol === 'admin' && (
        <div className="mt-4 sm:mt-6">
          <ActividadReciente />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
