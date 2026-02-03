
import React, { useState, useEffect } from 'react';
import { PukatuAPI } from '../services/api';
import { User, SystemStats, Purchase, Lottery, Role } from '../types';
import { Users, Ticket, DollarSign, CheckCircle, Clock, Plus, LayoutList, Trash2, Power, Edit, Shield, Save, X, Key, XCircle, UserPlus, Eye, EyeOff, Lock, MessageCircle, Dices, Image as ImageIcon, UploadCloud, Loader2, Sparkles } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';

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
            <p className="text-gray-500">Bienvenido de nuevo, <span className="font-bold text-blue-600">{user.name}</span></p>
        </div>
        <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 ${user.role === 'superadmin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
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
  
  useEffect(() => { 
      api.getSystemStats().then(res => res.success && res.data && setStats(res.data));
  }, [api]);

  return (
    <div className="space-y-6">
         <div className="flex space-x-2 border-b border-gray-200 pb-2 mb-4 overflow-x-auto custom-scrollbar">
            {['overview', 'manage_lotteries', 'users'].map((t) => (
                <button 
                    key={t}
                    onClick={() => setTab(t as any)}
                    className={`px-6 py-3 rounded-t-xl text-sm font-bold transition-all ${tab === t ? 'bg-white border-x border-t border-gray-200 text-blue-600 -mb-[2px]' : 'text-gray-400 hover:text-gray-900'}`}
                >
                    {t === 'overview' ? 'Resumen Global' : t === 'manage_lotteries' ? 'Todos los Sorteos' : 'Gestión Usuarios'}
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
        
        {tab !== 'overview' && (
            <div className="bg-blue-50 p-12 rounded-3xl text-center border-2 border-dashed border-blue-200">
                <Shield className="w-16 h-16 text-blue-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-blue-900">Módulo en Desarrollo</h3>
                <p className="text-blue-600/60 max-w-sm mx-auto mt-2">Estamos migrando las herramientas de gestión avanzada a la nueva infraestructura de Supabase.</p>
            </div>
        )}
    </div>
  );
};

const AdminPanel = ({ api, user }: { api: PukatuAPI, user: User }) => {
    const [tab, setTab] = useState<'create' | 'payments' | 'my_lotteries'>('my_lotteries');
    const [myLotteries, setMyLotteries] = useState<Lottery[]>([]);
    const [loading, setLoading] = useState(false);

    // Create Form State
    const [newTitle, setNewTitle] = useState('');
    const [newPrize, setNewPrize] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newImage, setNewImage] = useState<string>('');
    const [newDate, setNewDate] = useState<string>('');

    useEffect(() => {
        if (tab === 'my_lotteries') {
            setLoading(true);
            api.getLotteriesByUser(user.email, user.role).then(res => {
                if (res.success) setMyLotteries(res.data || []);
                setLoading(false);
            });
        }
    }, [tab, api, user]);

    const handleCreateTestGame = async () => {
        setLoading(true);
        const res = await api.createLottery({
            title: "Sorteo Especial de Prueba",
            prize: "$5,000 USD",
            description: "Este sorteo ha sido creado automáticamente para probar la plataforma.",
            contactPhone: "584121112233",
            image: "https://images.unsplash.com/photo-1596750014482-a65c49a594ae?q=80&w=1000&auto=format&fit=crop",
            drawDate: new Date(Date.now() + 86400000 * 7).toISOString(),
            pricePerNumber: 10,
            totalNumbers: 100
        });
        if (res.success) {
            alert('¡Sorteo de prueba generado!');
            setTab('my_lotteries');
        } else {
            alert('Error creando sorteo: ' + res.error);
        }
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await api.createLottery({
            title: newTitle,
            prize: newPrize,
            pricePerNumber: 10,
            totalNumbers: 100,
            description: "Sorteo administrado por " + user.name,
            contactPhone: newPhone,
            image: newImage || 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=1000&auto=format&fit=crop',
            drawDate: newDate
        });
        if (res.success) {
            alert('Sorteo publicado con éxito');
            setTab('my_lotteries');
            setNewTitle(''); setNewPrize(''); setNewPhone(''); setNewImage('');
        } else {
            alert('Error: ' + res.error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                <button onClick={() => setTab('my_lotteries')} className={`px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${tab === 'my_lotteries' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 border hover:border-blue-400'}`}>
                    <LayoutList className="w-4 h-4"/> Mis Sorteos
                </button>
                <button onClick={() => setTab('create')} className={`px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${tab === 'create' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 border hover:border-blue-400'}`}>
                    <Plus className="w-4 h-4"/> Crear Nuevo
                </button>
            </div>

            {tab === 'create' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                            <Ticket className="text-blue-600" /> Publicar Sorteo
                        </h3>
                        <form className="space-y-5" onSubmit={handleCreate}>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Título</label>
                                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold" placeholder="Ej. Rifazo del Mes" required />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Premio</label>
                                    <input value={newPrize} onChange={e => setNewPrize(e.target.value)} type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold" placeholder="$1,000 USD" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</label>
                                    <input value={newDate} onChange={e => setNewDate(e.target.value)} type="datetime-local" className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold" required />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp Soporte</label>
                                <input value={newPhone} onChange={e => setNewPhone(e.target.value)} type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold" placeholder="58412..." required />
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <Save className="w-5 h-5"/>}
                                PUBLICAR AHORA
                            </button>
                        </form>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-3xl text-white shadow-2xl flex flex-col justify-center items-center text-center">
                        <Dices className="w-20 h-20 mb-6 text-blue-200 animate-pulse" />
                        <h3 className="text-2xl font-black mb-4 tracking-tight">Acceso Rápido</h3>
                        <p className="text-blue-100 mb-8 max-w-xs text-sm leading-relaxed">¿Eres Jana? Puedes crear un sorteo de prueba con un solo clic para ver cómo funciona el sistema antes de publicar uno real.</p>
                        <button 
                            onClick={handleCreateTestGame} 
                            disabled={loading}
                            className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                            <Sparkles className="w-6 h-6" /> CREAR JUEGO DE PRUEBA
                        </button>
                    </div>
                </div>
            )}

            {tab === 'my_lotteries' && (
                 <div>
                    {loading ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>
                    ) : myLotteries.length === 0 ? (
                        <div className="bg-white p-16 rounded-3xl text-center border border-gray-100">
                            <Ticket className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                            <h4 className="text-xl font-black text-gray-900 mb-2">Aún no tienes sorteos</h4>
                            <p className="text-gray-500 mb-8 max-w-xs mx-auto">Comienza a ganar dinero publicando tu primera lotería ahora mismo.</p>
                            <button onClick={() => setTab('create')} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700">Crear Sorteo</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myLotteries.map(l => (
                                <div key={l.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                                    <div className="h-40 relative">
                                        <img src={l.image} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="bg-white text-gray-900 p-3 rounded-full font-bold flex items-center gap-2"><Edit className="w-4 h-4"/> Editar</button>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h4 className="font-black text-gray-900 text-lg truncate">{l.title}</h4>
                                        <div className="flex justify-between items-center mt-4">
                                            <span className="text-sm font-black text-blue-600">{l.prize}</span>
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${l.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                                                {l.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
            )}
        </div>
    );
};

const UserPanel = ({ api, user }: { api: PukatuAPI, user: User }) => (
    <div className="bg-white p-16 rounded-3xl border border-gray-100 text-center shadow-sm">
        <div className="mx-auto w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-8">
            <Ticket className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="font-black text-2xl text-gray-900 mb-4 tracking-tight">Tus Participaciones</h3>
        <p className="text-gray-500 max-w-sm mx-auto mb-10 font-medium">Aquí podrás consultar todos los números que has comprado y ver si has resultado ganador.</p>
        <div className="inline-block px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm">
             MÓDULO EN DESARROLLO
        </div>
    </div>
);

const StatCard = ({ icon, label, value }: { icon: any, label: string, value: string | number }) => (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-6 hover:shadow-xl transition-all cursor-default">
        <div className="p-5 bg-gray-50 rounded-2xl group-hover:bg-blue-50 transition-colors">{icon}</div>
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
        </div>
    </div>
);
