import React, { useState } from 'react';
import { PukatuAPI } from '../services/api';
import { User, Role } from '../types';
import { LogIn, Lock, UserPlus } from 'lucide-react';

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
  const [regRole, setRegRole] = useState<Role>('public');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.login(email, password);
      if (response.success && response.data) {
        onLoginSuccess(response.data);
      } else {
        setError(response.error || 'Login fallido');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      if (regPassword.length < 3) {
          setError('La contraseña debe tener al menos 3 caracteres');
          setLoading(false);
          return;
      }

      try {
          const response = await api.register({
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
          setError('Error de conexión');
      } finally {
          setLoading(false);
      }
  };

  const setDemoUser = (demoEmail: string, demoPass: string = '') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsRegistering(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
             {isRegistering ? <UserPlus className="h-6 w-6 text-blue-600" /> : <LogIn className="h-6 w-6 text-blue-600" />}
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegistering ? 'Únete a PUKATU hoy mismo' : 'Accede al sistema de gestión PUKATU'}
          </p>
        </div>
        
        {!isRegistering && (
            <div className="flex justify-center gap-2 mb-4">
                <button onClick={() => setDemoUser('super@pukatu.com', 'Apamate.25')} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 border border-purple-200">
                    Super Admin
                </button>
                <button onClick={() => setDemoUser('admin@pukatu.com', '123')} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 border border-blue-200">
                    Admin (123)
                </button>
                <button onClick={() => setDemoUser('user@pukatu.com', '123')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 border border-green-200">
                    Usuario (123)
                </button>
            </div>
        )}

        {isRegistering ? (
            // REGISTER FORM
            <form className="mt-8 space-y-4" onSubmit={handleRegister}>
                 <div>
                    <label className="sr-only">Nombre Completo</label>
                    <input
                        type="text"
                        required
                        className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Nombre Completo"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="sr-only">Correo Electrónico</label>
                    <input
                        type="email"
                        required
                        className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Correo Electrónico"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="sr-only">Contraseña</label>
                    <input
                        type="password"
                        required
                        className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Contraseña"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cuenta (Para pruebas)</label>
                    <select 
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as Role)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="public">Usuario Público</option>
                        <option value="admin">Administrador de Lotería</option>
                    </select>
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                    {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                    {loading ? 'Creando cuenta...' : 'Registrarse'}
                </button>
            </form>
        ) : (
            // LOGIN FORM
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
                <div>
                <label htmlFor="email-address" className="sr-only">Correo Electrónico</label>
                <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Dirección de correo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                </div>
                <div>
                <label htmlFor="password" className="sr-only">Contraseña</label>
                <div className="relative">
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                </div>
                </div>
            </div>

            {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded flex items-center justify-center gap-2">
                <span className="block w-2 h-2 bg-red-500 rounded-full"></span>
                {error}
                </div>
            )}

            <div>
                <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                >
                {loading ? 'Verificando...' : 'Entrar'}
                </button>
            </div>
            </form>
        )}

        <div className="text-center mt-4">
            <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
                {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
        </div>
      </div>
    </div>
  );
};