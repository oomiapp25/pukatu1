
import React, { useState } from 'react';
import { PukatuAPI } from '../services/api';
import { User, Role } from '../types';
import { LogIn, Lock, UserPlus, Phone, Sparkles, ShieldCheck, AlertTriangle, Zap } from 'lucide-react';

interface LoginProps {
  api: PukatuAPI;
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ api, onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDevAccess = async () => {
    setLoading(true);
    const res = await api.devAccess('superadmin');
    if (res.success && res.data) {
      onLoginSuccess(res.data);
    }
    setLoading(false);
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
        setError(response.error || 'Error de acceso.');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 animate-fadeIn relative overflow-hidden">
        
        {api.isOffline && (
            <div className="absolute top-0 left-0 w-full bg-amber-500 text-white text-[10px] font-black py-1 text-center uppercase tracking-widest flex items-center justify-center gap-2">
                <AlertTriangle className="w-3 h-3" /> Modo Demo Activo (Local)
            </div>
        )}

        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100 rotate-3">
             <LogIn className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-8 text-3xl font-black text-gray-900 tracking-tight">Acceso PUKATU</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">Gestiona sorteos oficiales de forma segura</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Usuario / Email</label>
              <div className="relative">
                <input
                  type="text" required
                  className="w-full bg-gray-50 border-none rounded-xl p-4 pl-12 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-800"
                  placeholder="admin_root"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
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

          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-bold flex flex-col gap-2">
              <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> {error}</div>
              <p className="text-[9px] opacity-70">Si el servidor no responde, intenta el acceso de emergencia abajo.</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'CONECTANDO...' : 'INICIAR SESIÓN'}
            </button>

            <button
              type="button"
              onClick={handleDevAccess}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-blue-900 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
            >
              <Zap className="w-4 h-4 text-yellow-400" /> Acceso de Desarrollador (Bypass)
            </button>
          </div>
        </form>

        <div className="text-center pt-4">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                PUKATU NETWORK &copy; 2025
            </p>
        </div>
      </div>
    </div>
  );
};
