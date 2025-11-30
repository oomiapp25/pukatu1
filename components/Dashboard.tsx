
import React, { useState, useEffect } from 'react';
import { PukatuAPI } from '../services/api';
import { User, SystemStats, Purchase, Lottery, Role } from '../types';
import { Users, Ticket, DollarSign, CheckCircle, Clock, Plus, LayoutList, Trash2, Power, Edit, Shield, Save, X, Key, XCircle, UserPlus, Eye, EyeOff, Lock, MessageCircle } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
            <p className="text-gray-500">Bienvenido de nuevo, <span className="font-semibold text-blue-600">{user.name}</span></p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-gray-100 text-gray-800'}`}>
            {user.role}
        </span>
      </div>
      {renderContent()}
    </div>
  );
};

// --- SUB COMPONENTS ---

const SuperAdminPanel = ({ api, currentUser }: { api: PukatuAPI, currentUser: User }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [tab, setTab] = useState<'overview' | 'manage_lotteries' | 'users' | 'millionaire_bag'>('overview');
  const [allLotteries, setAllLotteries] = useState<Lottery[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // Edit State
  const [editingLottery, setEditingLottery] = useState<Lottery | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Millionaire Bag State
  const [bagData, setBagData] = useState<any>(null);
  const [editingBag, setEditingBag] = useState<any>(null);

  // Create User State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('admin');

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
      // Always refresh stats
      api.getSystemStats().then(res => res.success && res.data && setStats(res.data));

      if (tab === 'manage_lotteries') {
          api.getLotteriesByUser('super@pukatu.com', 'superadmin').then(res => res.success && setAllLotteries(res.data || []));
      }
      if (tab === 'users') {
          api.getAllUsers().then(res => res.success && setAllUsers(res.data || []));
      }
      if (tab === 'millionaire_bag') {
          api.getMillionaireBag().then(res => {
              if (res.success && res.data) {
                  setBagData(res.data);
                  setEditingBag(res.data);
              }
          });
      }
  };

  const handleSaveBag = async (e: React.FormEvent) => {
      e.preventDefault();
      const res = await api.updateMillionaireBag(editingBag);
      if (res.success) {
          alert('Bolsa Millonaria actualizada');
          loadData();
      } else {
          alert('Error al actualizar');
      }
  };

  const handleDeleteLottery = async (id: string) => {
      if(confirm('¿ESTÁ SEGURO? Esta acción es irreversible y eliminará el sorteo para siempre.')) {
          await api.deleteLottery(id);
          loadData(); // Reload
      }
  };

  const handleToggleStatus = async (id: string) => {
      await api.toggleLotteryStatus(id);
      loadData();
  };
  
  const handleEditLottery = (lottery: Lottery) => {
      setEditingLottery({ ...lottery });
  };

  const handleSaveLottery = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingLottery) return;
      await api.updateLottery(editingLottery.id, editingLottery);
      setEditingLottery(null);
      loadData();
      alert('Sorteo actualizado correctamente');
  };

  const handleEditUser = (user: User) => {
      // When editing, we clear the password field initially so we don't show the hash/current pass
      setEditingUser({ ...user, password: '' });
  }

  const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      await api.updateUser(editingUser.id, editingUser);
      setEditingUser(null);
      loadData();
      alert('Usuario actualizado correctamente');
  };

  const handleDeleteUser = async (userId: string) => {
      if (confirm('¿Eliminar este usuario del sistema?')) {
          await api.deleteUser(userId);
          loadData();
      }
  };

  const handleApproveUser = async (userId: string) => {
      if (confirm('¿Aprobar y activar este usuario?')) {
          await api.approveUser(userId);
          loadData();
      }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newUserName || !newUserEmail || !newUserPass) return;

      const res = await api.adminCreateUser({
          name: newUserName,
          email: newUserEmail,
          password: newUserPass,
          role: newUserRole
      });

      if (res.success) {
          alert('Usuario creado correctamente');
          setShowCreateUserModal(false);
          setNewUserName('');
          setNewUserEmail('');
          setNewUserPass('');
          loadData();
      } else {
          alert('Error: ' + res.error);
      }
  };

  return (
    <div className="space-y-6 relative">
         <div className="flex space-x-2 border-b border-gray-200 pb-2 mb-4 overflow-x-auto">
            <button 
                onClick={() => setTab('overview')}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === 'overview' ? 'bg-white border-x border-t border-gray-200 text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Resumen Global
            </button>
            <button 
                onClick={() => setTab('manage_lotteries')}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === 'manage_lotteries' ? 'bg-white border-x border-t border-gray-200 text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Gestión de Sorteos (Total)
            </button>
            <button 
                onClick={() => setTab('users')}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === 'users' ? 'bg-white border-x border-t border-gray-200 text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Usuarios y Roles
            </button>
            <button 
                onClick={() => setTab('millionaire_bag')}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === 'millionaire_bag' ? 'bg-white border-x border-t border-gray-200 text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Gestionar Bolsa Millonaria
            </button>
        </div>

        {tab === 'overview' && stats && (
            <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={<Users className="text-blue-600"/>} label="Usuarios Totales" value={stats.totalUsers} />
                    <StatCard icon={<Ticket className="text-purple-600"/>} label="Loterías Activas" value={stats.activeLotteries} />
                    <StatCard icon={<DollarSign className="text-green-600"/>} label="Ingresos Totales" value={`${CURRENCY_SYMBOL}${stats.totalRevenue}`} />
                    <StatCard icon={<Clock className="text-orange-600"/>} label="Pagos Pendientes" value={stats.pendingPayments} />
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-gray-400"/> Registro de Auditoría (Simulado)</h3>
                    <div className="space-y-3">
                        <AuditRow action="Login SuperAdmin" user="super@pukatu.com" time="Hace 1 min" />
                        <AuditRow action="Crear Sorteo" user="admin@pukatu.com" time="Hace 2 horas" />
                        <AuditRow action="Confirmar Pago" user="admin@pukatu.com" time="Hace 3 horas" />
                    </div>
                </div>
            </div>
        )}

        {tab === 'manage_lotteries' && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creador</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {allLotteries.map(l => (
                            <tr key={l.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{l.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{l.createdBy}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${l.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {l.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEditLottery(l)} className="text-indigo-600 hover:text-indigo-900 mr-4" title="Editar Detalles">
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleToggleStatus(l.id)} className="text-blue-600 hover:text-blue-900 mr-4" title="Cambiar Estado">
                                        <Power className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDeleteLottery(l.id)} className="text-red-600 hover:text-red-900" title="Eliminar Definitivamente">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        )}

        {tab === 'users' && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-700 uppercase">Lista de Usuarios</h3>
                    <button 
                        onClick={() => setShowCreateUserModal(true)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" /> Agregar Usuario
                    </button>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono/Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {allUsers.map(u => {
                            const isSuperUser = u.email === 'super@pukatu.com';
                            const isSelf = u.email === currentUser.email;
                            const canEdit = !isSuperUser && !isSelf;

                            return (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-xs px-2 py-1 rounded border ${u.role === 'superadmin' ? 'bg-purple-50 border-purple-200 text-purple-700' : u.role === 'admin' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${u.status === 'suspended' ? 'bg-red-100 text-red-800' : u.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {u.status === 'suspended' ? 'Suspendido' : u.status === 'pending' ? 'Pendiente' : 'Activo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {canEdit ? (
                                            <>
                                                {u.status === 'pending' && (
                                                    <button onClick={() => handleApproveUser(u.id)} className="text-green-600 hover:text-green-900 mr-4" title="Aprobar Usuario">
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleEditUser(u)} className="text-indigo-600 hover:text-indigo-900 mr-4" title="Editar Rol/Estado/Contraseña">
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-900" title="Eliminar Usuario">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-gray-400 flex justify-end gap-1 items-center">
                                                <Lock className="w-4 h-4"/> Protegido
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </div>
        )}

        {tab === 'millionaire_bag' && editingBag && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
                <h3 className="text-xl font-bold mb-4 text-yellow-600 flex items-center gap-2">
                    <DollarSign className="w-6 h-6"/> Configurar Bolsa Millonaria
                </h3>
                <form onSubmit={handleSaveBag} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Monto Acumulado ({CURRENCY_SYMBOL})</label>
                        <input 
                            type="number" 
                            value={editingBag.currentAmount}
                            onChange={(e) => setEditingBag({...editingBag, currentAmount: Number(e.target.value)})}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2 text-2xl font-bold text-gray-700"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Fecha del Sorteo</label>
                         <input 
                            type="text" 
                            value={editingBag.drawDate}
                            onChange={(e) => setEditingBag({...editingBag, drawDate: e.target.value})}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2"
                            placeholder="Ej. Próximo Viernes"
                        />
                    </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-700">Mensaje / Descripción</label>
                         <textarea 
                            value={editingBag.description}
                            onChange={(e) => setEditingBag({...editingBag, description: e.target.value})}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2"
                            rows={3}
                        />
                    </div>
                    <button type="submit" className="w-full bg-yellow-600 text-white font-bold py-2 rounded-md hover:bg-yellow-700">
                        Actualizar Bolsa
                    </button>
                </form>
            </div>
        )}

        {/* CREATE USER MODAL */}
        {showCreateUserModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full m-4">
                    <div className="flex justify-between items-center p-5 border-b border-gray-200 rounded-t-lg bg-gray-50">
                        <h3 className="text-xl font-semibold text-gray-900">Agregar Nuevo Usuario</h3>
                        <button onClick={() => setShowCreateUserModal(false)} className="text-gray-400 hover:text-gray-900">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                            <input 
                                type="text" 
                                value={newUserName} 
                                onChange={(e) => setNewUserName(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Teléfono (Usuario)</label>
                            <input 
                                type="text" 
                                value={newUserEmail} 
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                required
                                placeholder="0412..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contraseña Inicial</label>
                            <input 
                                type="password" 
                                value={newUserPass} 
                                onChange={(e) => setNewUserPass(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-yellow-50 font-mono"
                                required
                                placeholder="Escribe la contraseña"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Rol Asignado</label>
                            <select 
                                value={newUserRole} 
                                onChange={(e) => setNewUserRole(e.target.value as Role)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            >
                                <option value="public">Usuario Público</option>
                                <option value="admin">Administrador</option>
                                <option value="superadmin">Super Admin</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Los administradores pueden crear y gestionar sorteos.</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowCreateUserModal(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                                Cancelar
                            </button>
                            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2">
                                <UserPlus className="w-4 h-4" /> Crear Usuario
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* EDIT LOTTERY MODAL */}
        {editingLottery && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full m-4">
                    <div className="flex justify-between items-center p-5 border-b border-gray-200 rounded-t-lg bg-gray-50">
                        <h3 className="text-xl font-semibold text-gray-900">Editar Sorteo</h3>
                        <button onClick={() => setEditingLottery(null)} className="text-gray-400 hover:text-gray-900">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <form onSubmit={handleSaveLottery} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Título</label>
                            <input 
                                type="text" 
                                value={editingLottery.title} 
                                onChange={(e) => setEditingLottery({...editingLottery, title: e.target.value})}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Premio</label>
                                <input 
                                    type="text" 
                                    value={editingLottery.prize} 
                                    onChange={(e) => setEditingLottery({...editingLottery, prize: e.target.value})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fecha Sorteo</label>
                                <input 
                                    type="date" 
                                    value={editingLottery.drawDate} 
                                    onChange={(e) => setEditingLottery({...editingLottery, drawDate: e.target.value})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700">Descripción</label>
                             <textarea 
                                value={editingLottery.description}
                                onChange={(e) => setEditingLottery({...editingLottery, description: e.target.value})}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                rows={3}
                             />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setEditingLottery(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                                Cancelar
                            </button>
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                                <Save className="w-4 h-4" /> Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* EDIT USER MODAL */}
        {editingUser && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full m-4">
                    <div className="flex justify-between items-center p-5 border-b border-gray-200 rounded-t-lg bg-gray-50">
                        <h3 className="text-xl font-semibold text-gray-900">Editar Usuario</h3>
                        <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-900">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input 
                                type="text" 
                                value={editingUser.name} 
                                onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                            <input 
                                type="text" 
                                value={editingUser.email} 
                                onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                disabled 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Rol</label>
                                <select 
                                    value={editingUser.role} 
                                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as Role})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                >
                                    <option value="public">Usuario Público</option>
                                    <option value="admin">Admin</option>
                                    <option value="superadmin">Super Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Estado</label>
                                <select 
                                    value={editingUser.status || 'active'} 
                                    onChange={(e) => setEditingUser({...editingUser, status: e.target.value as 'active' | 'suspended'})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                >
                                    <option value="active">Activo</option>
                                    <option value="suspended">Suspendido</option>
                                </select>
                            </div>
                        </div>
                        <div className="border-t pt-4 mt-2">
                             <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <Key className="w-4 h-4"/> Restablecer Contraseña
                             </label>
                             <input 
                                type="password" 
                                value={editingUser.password || ''} 
                                onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono bg-yellow-50"
                                placeholder="Nueva contraseña"
                            />
                             <p className="text-xs text-gray-500 mt-1">Escribe aquí para cambiar la contraseña del usuario.</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setEditingUser(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                                Cancelar
                            </button>
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                                <Save className="w-4 h-4" /> Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
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
    const [newPhone, setNewPhone] = useState('');

    useEffect(() => {
        if (tab === 'payments') {
            api.getPendingPayments().then(res => res.success && setPending(res.data || []));
        }
        if (tab === 'my_lotteries') {
            api.getLotteriesByUser(user.email, user.role).then(res => res.success && setMyLotteries(res.data || []));
        }
    }, [tab, api, user]);

    const handleConfirm = async (id: string) => {
        const purchase = pending.find(p => p.id === id);
        if (!purchase) return;

        if(confirm(`¿Confirmar pago de ${purchase.buyerName} y enviar comprobante WhatsApp?`)) {
            const res = await api.confirmPayment(id);
            if (res.success) {
                setPending(prev => prev.filter(p => p.id !== id));
                
                // Prepare WhatsApp Message
                const message = `✅ *COMPROBANTE DE PAGO PUKATU*

Hola *${purchase.buyerName}*, hemos confirmado tu participación.

🏆 *Sorteo:* ${purchase.lotteryTitle}
🔢 *Números:* ${purchase.selectedNumbers.join(', ')}
💰 *Monto:* ${CURRENCY_SYMBOL}${purchase.totalAmount}
📅 *Fecha:* ${new Date().toLocaleDateString()}

¡Buena suerte! 🍀`;

                // Open WhatsApp
                const waUrl = `https://wa.me/${purchase.email}?text=${encodeURIComponent(message)}`;
                window.open(waUrl, '_blank');
            }
        }
    };

    const handleReject = async (id: string) => {
        if(confirm('¿RECHAZAR y descartar este pago? Los números serán liberados.')) {
            await api.rejectPayment(id);
            setPending(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.createLottery({
            title: newTitle,
            prize: newPrize,
            pricePerNumber: 10,
            totalNumbers: 100,
            description: "Nuevo sorteo creado por admin",
            contactPhone: newPhone
        });
        alert('Sorteo creado exitosamente');
        setTab('my_lotteries');
        setNewTitle('');
        setNewPrize('');
        setNewPhone('');
    };

    return (
        <div>
            <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
                <button 
                    onClick={() => setTab('my_lotteries')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap ${tab === 'my_lotteries' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
                >
                    <LayoutList className="w-4 h-4"/> Mis Sorteos
                </button>
                <button 
                    onClick={() => setTab('create')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap ${tab === 'create' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
                >
                    <Plus className="w-4 h-4"/> Crear Sorteo
                </button>
                <button 
                    onClick={() => setTab('payments')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap ${tab === 'payments' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700">WhatsApp de Contacto</label>
                                <input value={newPhone} onChange={e => setNewPhone(e.target.value)} type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" placeholder="Ej. 584121234567" required />
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
                            <div key={l.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h4 className="font-bold text-lg">{l.title}</h4>
                                <p className="text-sm text-gray-500">Premio: {l.prize}</p>
                                <div className="mt-2 flex justify-between text-sm">
                                    <span>Vendidos: {l.soldNumbers.length}/{l.totalNumbers}</span>
                                    <span className={`font-semibold ${l.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>{l.status}</span>
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                        <button onClick={() => handleConfirm(p.id)} className="text-green-600 hover:text-green-900 flex items-center gap-1 border border-green-200 px-2 py-1 rounded bg-green-50">
                                            <CheckCircle className="w-4 h-4" /> Confirmar
                                        </button>
                                        <button onClick={() => handleReject(p.id)} className="text-red-600 hover:text-red-900 flex items-center gap-1 border border-red-200 px-2 py-1 rounded bg-red-50">
                                            <XCircle className="w-4 h-4" /> Descartar
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
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.status === 'confirmed' ? 'bg-green-100 text-green-800' : p.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {p.status === 'confirmed' ? 'Confirmado' : p.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
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
