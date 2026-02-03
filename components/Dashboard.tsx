
import React, { useState, useEffect } from 'react';
import { PukatuAPI } from '../services/api';
import { User, SystemStats, Lottery, Role, Purchase } from '../types';
import { Users, Ticket, DollarSign, Clock, Plus, LayoutList, Trash2, Power, Edit, Shield, Save, UserPlus, Dices, Loader2, Sparkles, RefreshCw, CheckCircle, Gift, MessageCircle } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';
import { generateDrawNarrative } from '../services/geminiService';

interface DashboardProps {
  user: User;
  api: PukatuAPI;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, api }) => {
  const renderContent = () => {
    switch (user.role) {
      case 'superadmin':
        return <SuperAdminPanel api={api} currentUser={user} />;
      case 'admin':
        return <AdminPanel api={api} user={user} />;
      case 'public':
        return <UserPanel api={api} user={user} />;
      default:
        return <div>Rol desconocido</div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Panel de Control</h1>
            <p className="text-gray-500 font-medium">Gestionando como: <span className="text-blue-600 font-bold">{user.name}</span></p>
        </div>
        <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 flex items-center gap-2 ${user.role === 'superadmin' ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {user.role === 'superadmin' && <Shield className="w-3 h-3"/>}
                {user.role}
            </span>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

// --- SUB COMPONENTS ---

const SuperAdminPanel = ({ api, currentUser }: { api: PukatuAPI, currentUser: User }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [tab, setTab] = useState<'overview' | 'manage_lotteries' | 'users'>('overview');
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(false);
  
  const refreshStats = () => {
      api.getSystemStats().then(res => res.success && res.data && setStats(res.data));
  };

  const loadAllLotteries = async () => {
    setLoading(true);
    const res = await api.getLotteriesByUser('', 'superadmin');
    if (res.success) setLotteries(res.data || []);
    setLoading(false);
  };

  useEffect(() => { 
      refreshStats();
      if (tab === 'manage_lotteries') loadAllLotteries();
  }, [api, tab]);

  const handleDelete = async (id: string) => {
      if (!confirm('¿Estás seguro de eliminar este sorteo permanentemente?')) return;
      const res = await api.deleteLottery(id);
      if (res.success) loadAllLotteries();
      else alert("Error: " + res.error);
  };

  const toggleStatus = async (l: Lottery) => {
      const newStatus = l.status === 'active' ? 'paused' : 'active';
      const res = await api.updateLotteryStatus(l.id, newStatus);
      if (res.success) loadAllLotteries();
  };

  return (
    <div className="space-y-6">
         <div className="flex space-x-2 border-b border-gray-200 pb-2 mb-4 overflow-x-auto custom-scrollbar">
            {['overview', 'manage_lotteries', 'users'].map((t) => (
                <button 
                    key={t}
                    onClick={() => setTab(t as any)}
                    className={`px-6 py-3 rounded-t-xl text-sm font-bold transition-all whitespace-nowrap ${tab === t ? 'bg-white border-x border-t border-gray-200 text-blue-600 -mb-[2px]' : 'text-gray-400 hover:text-gray-900'}`}
                >
                    {t === 'overview' ? 'Resumen Global' : t === 'manage_lotteries' ? 'Gestión de Sorteos' : 'Usuarios Registrados'}
                </button>
            ))}
        </div>

        {tab === 'overview' && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Users className="text-blue-600"/>} label="Total Usuarios" value={stats.totalUsers} />
                <StatCard icon={<Ticket className="text-purple-600"/>} label="Sorteos Totales" value={stats.totalLotteries} />
                <StatCard icon={<DollarSign className="text-green-600"/>} label="Ingresos Totales" value={`${CURRENCY_SYMBOL}${stats.totalRevenue}`} />
                <StatCard icon={<Clock className="text-orange-600"/>} label="Pagos Pendientes" value={stats.pendingPayments} />
            </div>
        )}

        {tab === 'manage_lotteries' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-black text-gray-900 flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-blue-600" /> Control de Juegos Activos
                    </h3>
                    <button onClick={loadAllLotteries} className="p-2 hover:bg-white rounded-lg transition-colors">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 border-b">
                                <th className="px-6 py-4">Juego</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Ventas</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {lotteries.map(l => (
                                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden border">
                                                <img src={l.image} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{l.title}</p>
                                                <p className="text-[10px] text-gray-400">{l.prize}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${l.status === 'active' ? 'bg-green-100 text-green-700' : l.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-gray-700">{l.soldNumbers.length} / {l.totalNumbers}</p>
                                        <div className="w-20 bg-gray-200 h-1 rounded-full mt-1">
                                            <div className="bg-blue-600 h-full rounded-full" style={{width: `${(l.soldNumbers.length/l.totalNumbers)*100}%`}}></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {l.status !== 'completed' && (
                                                <button onClick={() => toggleStatus(l)} title={l.status === 'active' ? 'Pausar' : 'Activar'} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                                                    <Power className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(l.id)} title="Eliminar" className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {lotteries.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No hay juegos registrados en la base de datos.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        
        {tab === 'users' && (
            <div className="bg-blue-50 p-12 rounded-3xl text-center border-2 border-dashed border-blue-200 animate-fadeIn">
                <Users className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-blue-900">Directorio de Usuarios</h3>
                <p className="text-blue-600/60 max-w-sm mx-auto mt-2 font-medium">Esta sección permite administrar permisos y roles de los administradores regionales.</p>
                <div className="mt-6 flex justify-center gap-4">
                    <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-all">
                        <UserPlus className="w-4 h-4" /> CREAR ADMIN
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

const AdminPanel = ({ api, user }: { api: PukatuAPI, user: User }) => {
    const [tab, setTab] = useState<'create' | 'my_lotteries' | 'payments'>('my_lotteries');
    const [myLotteries, setMyLotteries] = useState<Lottery[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDrawing, setIsDrawing] = useState<string | null>(null);

    // Create Form State
    const [newTitle, setNewTitle] = useState('');
    const [newPrize, setNewPrize] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newImage, setNewImage] = useState<string>('');
    const [newDate, setNewDate] = useState<string>('');

    const refreshData = () => {
        setLoading(true);
        if (tab === 'my_lotteries') {
            api.getLotteriesByUser(user.email, user.role).then(res => {
                if (res.success) setMyLotteries(res.data || []);
                setLoading(false);
            });
        } else if (tab === 'payments') {
            api.getPurchases().then(res => {
                if (res.success) setPurchases(res.data || []);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    };

    useEffect(() => { refreshData(); }, [tab, api, user]);

    const handleConfirmPayment = async (pId: string) => {
        const res = await api.confirmPurchase(pId);
        if (res.success) refreshData();
        else alert(res.error);
    };

    const handleFinalizeDraw = async (l: Lottery) => {
        if (l.soldNumbers.length === 0) {
            alert("No hay boletos vendidos para realizar el sorteo.");
            return;
        }
        if (!confirm(`¿Deseas realizar el GRAN SORTEO para "${l.title}" usando la IA de PUKATU?`)) return;

        setIsDrawing(l.id);
        const winningNumber = l.soldNumbers[Math.floor(Math.random() * l.soldNumbers.length)];
        const narrative = await generateDrawNarrative(l.title, l.prize, winningNumber);
        
        const res = await api.finalizeDraw(l.id, winningNumber, narrative);
        if (res.success) {
            alert(`¡Sorteo Finalizado! Ganador: #${winningNumber}`);
            refreshData();
        } else {
            alert("Error: " + res.error);
        }
        setIsDrawing(null);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await api.createLottery({
            title: newTitle, prize: newPrize, pricePerNumber: 10, totalNumbers: 100,
            description: "Sorteo oficial administrado por " + user.name,
            contactPhone: newPhone, image: newImage || 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=1000&auto=format&fit=crop',
            drawDate: newDate
        });
        if (res.success) {
            setTab('my_lotteries');
            setNewTitle(''); setNewPrize(''); setNewPhone(''); setNewImage('');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                <button onClick={() => setTab('my_lotteries')} className={`px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 transition-all whitespace-nowrap ${tab === 'my_lotteries' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-500 border hover:border-blue-400'}`}>
                    <LayoutList className="w-4 h-4"/> Mis Sorteos
                </button>
                <button onClick={() => setTab('payments')} className={`px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 transition-all whitespace-nowrap ${tab === 'payments' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-500 border hover:border-blue-400'}`}>
                    <DollarSign className="w-4 h-4"/> Verificar Pagos
                </button>
                <button onClick={() => setTab('create')} className={`px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 transition-all whitespace-nowrap ${tab === 'create' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-500 border hover:border-blue-400'}`}>
                    <Plus className="w-4 h-4"/> Nuevo Sorteo
                </button>
            </div>

            {tab === 'payments' && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                        <h3 className="font-black text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-600" /> Solicitudes de Pago
                        </h3>
                        <button onClick={refreshData} className="text-gray-400 hover:text-blue-600"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/></button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="px-6 py-4">Comprador</th>
                                    <th className="px-6 py-4">Sorteo</th>
                                    <th className="px-6 py-4">Números</th>
                                    <th className="px-6 py-4">Monto</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {purchases.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900 text-sm">{p.buyerName}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{p.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600">{p.lotteryTitle}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1">
                                                {p.selectedNumbers.map(n => <span key={n} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">{n}</span>)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-gray-900">{CURRENCY_SYMBOL}{p.totalAmount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${p.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {p.status === 'pending' ? (
                                                <button onClick={() => handleConfirmPayment(p.id)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button disabled className="p-2 text-gray-200">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {purchases.length === 0 && !loading && (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No hay registros de compras aún.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'my_lotteries' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
                    {myLotteries.map(l => (
                        <div key={l.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm flex flex-col relative group">
                            {l.status === 'completed' && (
                                <div className="absolute top-4 right-4 z-20 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-lg border-2 border-yellow-500 animate-pulse">
                                    <Gift className="w-3 h-3"/> GANADOR: #{l.winningNumber}
                                </div>
                            )}
                            <div className="h-40 relative">
                                <img src={l.image} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Edit className="w-4 h-4"/> Config</button>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <h4 className="font-black text-gray-900 truncate mb-1">{l.title}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-4">{l.prize}</p>
                                
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-sm font-black text-blue-600">{l.soldNumbers.length} Vendidos</span>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${l.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{l.status}</span>
                                </div>

                                {l.status === 'active' && (
                                    <button 
                                        onClick={() => handleFinalizeDraw(l)}
                                        disabled={!!isDrawing}
                                        className="w-full bg-gray-900 text-white py-3 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-blue-50"
                                    >
                                        {isDrawing === l.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4 text-yellow-400"/>}
                                        REALIZAR SORTEO
                                    </button>
                                )}
                                {l.status === 'completed' && (
                                    <div className="p-3 bg-blue-50 rounded-xl text-[10px] text-blue-700 font-bold italic leading-relaxed">
                                        "Sorteo finalizado con éxito. El ganador fue notificado."
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {myLotteries.length === 0 && !loading && (
                        <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                             <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                             <p className="text-gray-400 font-medium">No has creado sorteos aún.</p>
                        </div>
                    )}
                </div>
            )}

            {tab === 'create' && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl animate-fadeIn">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                        <Ticket className="text-blue-600" /> Nuevo Juego Oficial
                    </h3>
                    <form className="space-y-5" onSubmit={handleCreate}>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Título</label>
                            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Premio</label>
                                <input value={newPrize} onChange={e => setNewPrize(e.target.value)} type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</label>
                                <input value={newDate} onChange={e => setNewDate(e.target.value)} type="datetime-local" className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold" required />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp Contacto</label>
                            <input value={newPhone} onChange={e => setNewPhone(e.target.value)} type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold" required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl transition-all flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <Save className="w-5 h-5"/>} PUBLICAR SORTEO
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

const UserPanel = ({ api, user }: { api: PukatuAPI, user: User }) => {
    const [myPurchases, setMyPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getPurchases().then(res => {
            if (res.success) setMyPurchases(res.data || []);
            setLoading(false);
        });
    }, [api]);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-black text-2xl text-gray-900 mb-8 flex items-center gap-3">
                    <Ticket className="w-8 h-8 text-blue-600" /> Mis Boletos Adquiridos
                </h3>
                
                {loading ? (
                    <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>
                ) : myPurchases.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 font-medium italic">Aún no has participado en ningún sorteo.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {myPurchases.map(p => (
                            <div key={p.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{p.lotteryTitle}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(p.purchaseDate).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${p.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {p.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {p.selectedNumbers.map(n => <span key={n} className="w-8 h-8 flex items-center justify-center bg-white border border-blue-200 text-blue-700 rounded-lg text-xs font-black shadow-sm">{n}</span>)}
                                </div>
                                <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-400">PAGO CONFIRMADO</span>
                                    <span className="text-sm font-black text-gray-900">{CURRENCY_SYMBOL}{p.totalAmount}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value }: { icon: any, label: string, value: string | number }) => (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-6 hover:shadow-xl transition-all group">
        <div className="p-5 bg-gray-50 rounded-2xl group-hover:bg-blue-50 transition-colors duration-500">{icon}</div>
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
        </div>
    </div>
);
