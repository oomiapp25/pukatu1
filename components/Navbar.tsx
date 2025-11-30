import React from 'react';
import { Ticket, ShoppingBag, Home, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { ViewState, User } from '../types';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  cartCount: number;
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, cartCount, user, onLogout }) => {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => setView(ViewState.HOME)}>
            <div className="bg-blue-600 p-2 rounded-lg mr-2">
                <Ticket className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">PUKATU</span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={() => setView(ViewState.HOME)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === ViewState.HOME ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Loterías</span>
              </div>
            </button>

             <button 
              onClick={() => setView(ViewState.MILLIONAIRE_BAG)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === ViewState.MILLIONAIRE_BAG ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500 hover:text-yellow-600'}`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Bolsa Millonaria</span>
              </div>
            </button>
            
            {user ? (
                <>
                    <button 
                        onClick={() => setView(ViewState.DASHBOARD)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === ViewState.DASHBOARD ? 'text-purple-600 bg-purple-50' : 'text-gray-500 hover:text-purple-600'}`}
                    >
                        <div className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="hidden sm:inline">Panel ({user.role})</span>
                        </div>
                    </button>
                    <button 
                        onClick={onLogout}
                        className="px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </>
            ) : (
                <button 
                    onClick={() => setView(ViewState.LOGIN)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === ViewState.LOGIN ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600'}`}
                >
                    <div className="flex items-center gap-2">
                        <LogIn className="w-4 h-4" />
                        <span className="hidden sm:inline">Entrar</span>
                    </div>
                </button>
            )}

            {cartCount > 0 && (
                 <div className="ml-2 flex items-center bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse">
                    {cartCount}
                 </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;