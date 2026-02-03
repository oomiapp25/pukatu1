
import React, { useState } from 'react';
import { PukatuAPI } from '../services/api';
import { User, Role } from '../types';
import { LogIn, Lock, UserPlus, Phone, Sparkles, ShieldCheck } from 'lucide-react';

interface LoginProps {
  api: PukatuAPI;
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ api, onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState(''); 
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<Role>('admin');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillJanaCreds = (role: Role = 'admin') => {
    if (isRegistering) {
        setRegName('Jana Admin');
        setRegEmail('jana_admin');
        setRegPassword('Apamate.25');
        setRegRole(role);
    } else {
        setEmail('jana_admin');
        setPassword('Apamate.25');
    }
  };

  const fillSuperAdmin = () => {
    if (isRegistering) {
        setRegName('Jana SuperAdmin');
        setRegEmail('jana_root');
        setRegPassword('Apamate.25');
        setRegRole('superadmin');
    } else {
        setEmail('jana_root');
        setPassword('Apamate.25');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.loginGAS(email, password);
      if (response.success && response.data) {
        onLoginSuccess(response.data);
      } else {
        setError(response.error || 'Login fallido');
      }
    } catch (err) {
      setError('Error de conexión con Supabase');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      if (regPassword.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres por seguridad de Supabase');
          setLoading(false);
          return;
      }
      try {
          const response = await api.registerGAS({
              name: regName,
              email: regEmail,
              password: regPassword,
              role: regRole
          });
          if (response.success && response.data) {
              onLoginSuccess(response.data);
          } else {
              setError(response.error || 'Registro fallido');
          }
      } catch (err) {
          setError('Error de conexión al registrar');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 animate-fadeIn">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100 rotate-3 transition-transform hover:rotate-0">
             {isRegistering ? <UserPlus className="h-8 w-8 text-white" /> : <LogIn className="h-8 w-8 text-white" />}
          </div>
          <h2 className="mt-8 text-3xl font-black text-gray-900 tracking-tight">
            {isRegistering ? 'Únete a PUKATU' : 'Acceso Administrativo'}
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            {isRegistering ? 'Crea tu cuenta de gestión' : 'Gestiona tus sorteos y premios oficiales'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={() => fillJanaCreds('admin')}
                className="py-2.5 px-3 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-xl border border-blue-200 flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
            >
                <Sparkles className="w-3 h-3" /> ADMIN JANA
            </button>
            <button 
                onClick={fillSuperAdmin}
                className="py-2.5 px-3 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-xl border border-purple-200 flex items-center justify-center gap-2 hover:bg-purple-100 transition-colors"
            >
                <ShieldCheck className="w-3 h-3" /> SUPER ADMIN
            </button>
        </div>
        
        {isRegistering ? (
            <form className="space-y-4" onSubmit={handleRegister}>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                    <input
                        type="text" required
                        className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-800"
                        placeholder="Tu Nombre"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Usuario / ID</label>
                    <div className="relative">
                        <input
                            type="text" required
                            className="w-full bg-gray-50 border-none rounded-xl p-4 pl-12 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-800"
                            placeholder="jana_admin"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                        />
                        <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Clave de Acceso</label>
                    <input
                        type="password" required
                        className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-800"
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rango del Perfil</label>
                    <select 
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as Role)}
                        className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all font-black text-gray-700"
                    >
                        <option value="admin">Administrador Regular</option>
                        <option value="superadmin">Super Administrador (Root)</option>
                        <option value="public">Usuario Público</option>
                    </select>
                </div>

                {error && <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-bold animate-shake">{error}</div>}

                <button
                    type="submit" disabled={loading}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? 'CREANDO PERFIL...' : 'REGISTRARME'}
                </button>
            </form>
        ) : (
            <form className="space-y-6" onSubmit={handleLogin}>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Usuario / ID</label>
                        <div className="relative">
                            <input
                                type="text" required
                                className="w-full bg-gray-50 border-none rounded-xl p-4 pl-12 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-800"
                                placeholder="jana_admin"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Clave</label>
                        <div className="relative">
                            <input
                                type="password" required
                                className="w-full bg-gray-50 border-none rounded-xl p-4 pl-12 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-800"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                        </div>
                    </div>
                </div>

                {error && <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-bold animate-shake">{error}</div>}

                <button
                    type="submit" disabled={loading}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? 'AUTENTICANDO...' : 'INICIAR SESIÓN'}
                </button>
            </form>
        )}

        <div className="text-center">
            <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest"
            >
                {isRegistering ? '¿Ya tienes cuenta? Ingresa' : '¿Nuevo administrador? Regístrate'}
            </button>
        </div>
      </div>
    </div>
  );
};
