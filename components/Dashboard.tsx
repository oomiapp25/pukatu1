import React, { useState, useEffect } from 'react';
import { PukatuAPI } from '../services/api';
import { User, SystemStats, Purchase, Lottery } from '../types';
import { Users, Ticket, DollarSign, CheckCircle, Clock, Plus, LayoutList } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';

interface DashboardProps {
  user: User;
  api: PukatuAPI;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, api }) => {
  const renderContent = () => {
    switch (user.role) {
      case 'superadmin':
        return <SuperAdminPanel api={api} />;
      case 'admin':
        return <AdminPanel api={api} user={user} />;
      case 'public':
        return <UserPanel api={api} user={user} />;
      default:
        return <div>Rol desconocido</div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
        <p className="text-gray-500">Bienvenido de nuevo, <span className="font-semibold text-blue-600">{user.name}</span> <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full uppercase ml-2">{user.role}</span></p>
      </div>
      {renderContent()}
    </div>
  );
};

// --- SUB COMPONENTS ---

const SuperAdminPanel = ({ api }: { api: PukatuAPI }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    api.getSystemStats().then(res => {
        if(res.success && res.data) setStats(res.data);
    });
  }, [api]);

  if (!stats) return <div className="p-4">Cargando estadísticas globales...</div>;

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Users className="text-blue-600"/>} label="Usuarios Totales" value={stats.totalUsers} />
            <StatCard icon={<Ticket className="text-purple-600"/>} label="Loterías Activas" value={stats.activeLotteries} />
            <StatCard icon={<DollarSign className="text-green-600"/>} label="Ingresos Totales" value={`${CURRENCY_SYMBOL}${stats.totalRevenue}`} />
            <StatCard icon={<Clock className="text-orange-600"/>} label="Pagos Pendientes" value={stats.pendingPayments} />
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold mb-4">Registro de Auditoría (Reciente)</h3>
            <div className="space-y-3">
                <AuditRow action="Login" user="admin@pukatu.com" time="Hace 5 min" />
                <AuditRow action="Crear Sorteo" user="super@pukatu.com" time="Hace 2 horas" />
                <AuditRow action="Confirmar Pago" user="admin@pukatu.com" time="Hace 3 horas" />
            </div>
        </div>
    </div>
  );
};

const AdminPanel = ({ api, user }: { api: PukatuAPI, user: User }) => {
    const [tab, setTab] = useState<'create' | 'payments' | 'my_lotteries'>('my_lotteries');
    const [pending, setPending] = useState<Purchase[]>([]);
    const [myLotteries, setMyLotteries] = useState<Lottery[]>([]);

    // Create Form State
    const [newTitle, setNewTitle] = useState('');
    const [newPrize, setNewPrize] = useState('');

    useEffect(() => {
        if (tab === 'payments') {
            api.getPendingPayments().then(res => res.success && setPending(res.data || []));
        }
        if (tab === 'my_lotteries') {
            api.getLotteriesByUser(user.email, user.role).then(res => res.success && setMyLotteries(res.data || []));
        }
    }, [tab, api, user]);

    const handleConfirm = async (id: string) => {
        await api.confirmPayment(id);
        setPending(prev => prev.filter(p => p.id !== id));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.createLottery({
            title: newTitle,
            prize: newPrize,
            pricePerNumber: 10,
            totalNumbers: 100,
            description: "Nuevo sorteo creado por admin"
        });
        alert('Sorteo creado exitosamente');
        setTab('my_lotteries');
        setNewTitle('');
        setNewPrize('');
    };

    return (
        <div>
            <div className="flex space-x-4 mb-6">
                <button 
                    onClick={() => setTab('my_lotteries')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${tab === 'my_lotteries' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
                >
                    <LayoutList className="w-4 h-4"/> Mis Sorteos
                </button>
                <button 
                    onClick={() => setTab('create')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${tab === 'create' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
                >
                    <Plus className="w-4 h-4"/> Crear Sorteo
                </button>
                <button 
                    onClick={() => setTab('payments')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${tab === 'payments' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
                >
                    <DollarSign className="w-4 h-4"/> Gestionar Pagos
                </button>
            </div>

            {tab === 'create' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl">
                    <h3 className="text-lg font-bold mb-4">Nuevo Sorteo</h3>
                    <form className="space-y-4" onSubmit={handleCreate}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Título del Sorteo</label>
                            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" placeholder="Ej. Gran Rifa Navideña" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Premio</label>
                                <input value={newPrize} onChange={e => setNewPrize(e.target.value)} type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" placeholder="$1000" required />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700">Publicar Sorteo</button>
                    </form>
                </div>
            )}

            {tab === 'my_lotteries' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myLotteries.length === 0 ? <p className="text-gray-500">No tienes sorteos activos.</p> : 
                        myLotteries.map(l => (
                            <div key={l.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                                <h4 className="font-bold text-lg">{l.title}</h4>
                                <p className="text-sm text-gray-500">Premio: {l.prize}</p>
                                <div className="mt-2 flex justify-between text-sm">
                                    <span>Vendidos: {l.soldNumbers.length}/{l.totalNumbers}</span>
                                    <span className="text-green-600 font-semibold">{l.status}</span>
                                </div>
                            </div>
                        ))
                    }
                 </div>
            )}

            {tab === 'payments' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sorteo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pending.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No hay pagos pendientes</td></tr>
                            ) : pending.map(p => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.buyerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.lotteryTitle}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{CURRENCY_SYMBOL}{p.totalAmount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleConfirm(p.id)} className="text-green-600 hover:text-green-900 flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" /> Confirmar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const UserPanel = ({ api, user }: { api: PukatuAPI, user: User }) => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [myLotteries, setMyLotteries] = useState<Lottery[]>([]);

    useEffect(() => {
        api.getMyPurchases().then(res => res.success && setPurchases(res.data || []));
        api.getLotteriesByUser(user.email, user.role).then(res => res.success && setMyLotteries(res.data || []));
    }, [api, user]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold mb-4">Mis Tickets Comprados</h3>
                <div className="space-y-4">
                    {purchases.length === 0 ? <p className="text-gray-500">No has comprado tickets aún.</p> :
                        purchases.map(p => (
                        <div key={p.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                            <div>
                                <p className="font-semibold text-gray-900">{p.lotteryTitle}</p>
                                <p className="text-sm text-gray-500">Fecha: {p.purchaseDate}</p>
                                <div className="flex gap-2 mt-1">
                                    {p.selectedNumbers.map(n => (
                                        <span key={n} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">#{n}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {p.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                                </span>
                                <p className="font-bold mt-1">{CURRENCY_SYMBOL}{p.totalAmount}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold mb-4">Sorteos en los que participas</h3>
                 <div className="space-y-4">
                     {myLotteries.map(l => (
                         <div key={l.id} className="flex gap-4 items-center border border-gray-100 p-2 rounded-lg">
                             <img src={l.image} className="w-16 h-16 object-cover rounded" alt={l.title}/>
                             <div>
                                 <h4 className="font-bold">{l.title}</h4>
                                 <p className="text-sm text-gray-500">Premio: {l.prize}</p>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>
    );
};

// Helper Components
const StatCard = ({ icon, label, value }: { icon: any, label: string, value: string | number }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

const AuditRow = ({ action, user, time }: { action: string, user: string, time: string }) => (
    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0">
        <div>
            <span className="font-medium text-gray-900">{action}</span>
            <span className="text-gray-500 mx-2">•</span>
            <span className="text-gray-600">{user}</span>
        </div>
        <span className="text-gray-400">{time}</span>
    </div>
);