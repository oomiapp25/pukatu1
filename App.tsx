
import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, Lottery, PurchaseRequest, User } from './types';
import { PukatuAPI } from './services/api';
import { getLuckyNumbers } from './services/geminiService';
import Navbar from './components/Navbar';
import LotteryCard from './components/LotteryCard';
import NumberGrid from './components/NumberGrid';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { ArrowLeft, CheckCircle, AlertCircle, Wand2, Loader2, Lock, MessageCircle, RefreshCw, HelpCircle, AlertTriangle, Ticket } from 'lucide-react';
import { CURRENCY_SYMBOL } from './constants';

function App() {
  // Initialize API only once
  const api = useMemo(() => new PukatuAPI(), []);

  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [user, setUser] = useState<User | null>(null);
  
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [selectedLottery, setSelectedLottery] = useState<Lottery | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const [purchaseResult, setPurchaseResult] = useState<{success: boolean, message: string} | null>(null);
  
  // User Form State (Autofilled if logged in)
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // AI State
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Check auth on load
  useEffect(() => {
    const currentUser = api.getCurrentUser();
    if (currentUser) {
        setUser(currentUser);
        setUserName(currentUser.name);
        setUserEmail(currentUser.email);
    }
    loadLotteries();
  }, [api]);

  const loadLotteries = async () => {
    setLoading(true);
    setError('');
    const result = await api.getActiveLotteries();
    if (result.success && result.data) {
      setLotteries(result.data);
    } else {
      setError(result.error || 'No se pudieron cargar las loterías.');
    }
    setLoading(false);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
      setUser(loggedInUser);
      setUserName(loggedInUser.name);
      setUserEmail(loggedInUser.email);
      setCurrentView(ViewState.DASHBOARD);
  };

  const handleLogout = () => {
      api.logout();
      setUser(null);
      setUserName('');
      setUserEmail('');
      setCurrentView(ViewState.HOME);
  };

  const handleSelectLottery = (lottery: Lottery) => {
    setSelectedLottery(lottery);
    setSelectedNumbers([]); 
    setPurchaseResult(null);
    setCurrentView(ViewState.LOTTERY_DETAIL);
  };

  const handleToggleNumber = (num: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num);
      } else {
        return [...prev, num];
      }
    });
  };

  const handleAiPick = async () => {
    if (!selectedLottery) return;
    setIsAiThinking(true);
    const allNumbers = Array.from({ length: selectedLottery.totalNumbers }, (_, i) => i + 1);
    const available = allNumbers.filter(n => !selectedLottery.soldNumbers.includes(n));
    const luckyNumbers = await getLuckyNumbers(selectedLottery.title, available, 5);
    const newSelection = [...new Set([...selectedNumbers, ...luckyNumbers])].filter(n => !selectedLottery.soldNumbers.includes(n));
    setSelectedNumbers(newSelection);
    setIsAiThinking(false);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLottery || selectedNumbers.length === 0) return;

    if (!user && !confirm("No has iniciado sesión. Puedes comprar como invitado, pero no verás el historial en tu panel. ¿Continuar?")) {
        return;
    }

    setPurchasing(true);
    
    const purchaseRequest: PurchaseRequest = {
      lotteryId: selectedLottery.id,
      buyerName: userName,
      email: userEmail,
      selectedNumbers: selectedNumbers,
      totalAmount: selectedNumbers.length * selectedLottery.pricePerNumber
    };

    const result = await api.submitPurchase(purchaseRequest);
    setPurchasing(false);
    
    if (result.success && result.data) {
      const { purchaseId, contactPhone } = result.data;

      // Prepare WhatsApp Redirect
      if (contactPhone) {
          const message = `👋 Hola, deseo confirmar mi compra en PUKATU.
🎫 *Sorteo:* ${selectedLottery.title}
🔢 *Números:* ${selectedNumbers.join(', ')}
💰 *Total:* ${CURRENCY_SYMBOL}${purchaseRequest.totalAmount}
🆔 *ID Compra:* ${purchaseId}
          
Espero confirmación. Gracias.`;
          
          const waUrl = `https://wa.me/${contactPhone}?text=${encodeURIComponent(message)}`;
          // Open WhatsApp in new tab
          window.open(waUrl, '_blank');
      }

      setPurchaseResult({ success: true, message: 'Redirigiendo a WhatsApp...' });
      
      // Update local state to reflect sold numbers immediately
      const updatedLottery = {
        ...selectedLottery,
        soldNumbers: [...selectedLottery.soldNumbers, ...selectedNumbers]
      };
      setSelectedLottery(updatedLottery);
      setLotteries(prev => prev.map(l => l.id === updatedLottery.id ? updatedLottery : l));
      setSelectedNumbers([]);
      setTimeout(() => setCurrentView(ViewState.CONFIRMATION), 500);
    } else {
       setPurchaseResult({ success: false, message: result.error || 'Falló.' });
    }
  };

  // --- VIEWS ---

  const renderHome = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Sueña en Grande. <span className="text-blue-600">Gana en Grande.</span>
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
          La plataforma oficial de lotería PUKATU. Transparente, segura y fácil de usar.
        </p>
        {!user && (
            <div className="mt-6">
                <button onClick={() => setCurrentView(ViewState.LOGIN)} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    <Lock className="w-4 h-4 mr-2"/> Acceso Administrativo
                </button>
            </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-red-200">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600"/>
                <h3 className="text-lg font-bold text-red-800">Error de Conexión</h3>
            </div>
            <div className="p-6">
                <p className="text-red-700 font-medium mb-4">{error}</p>
                
                <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700 space-y-3 mb-6">
                    <p className="font-semibold flex items-center gap-2"><HelpCircle className="w-4 h-4 text-blue-500"/> ¿Cómo solucionarlo?</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                        <li>Ve a tu proyecto de Google Apps Script.</li>
                        <li>Clic en <strong>Implementar</strong> {'>'} <strong>Gestionar implementaciones</strong>.</li>
                        <li>Edita la implementación actual (icono de lápiz).</li>
                        <li>En <strong>Versión</strong>, selecciona <strong>"Nueva versión"</strong>.</li>
                        <li>En <strong>Quién tiene acceso</strong>, selecciona <strong>"Cualquiera"</strong>.</li>
                        <li>Clic en <strong>Implementar</strong>.</li>
                    </ol>
                </div>

                <button onClick={loadLotteries} className="w-full flex justify-center items-center gap-2 bg-blue-600 px-4 py-2 rounded-md shadow-sm text-white font-medium hover:bg-blue-700 transition-colors">
                    <RefreshCw className="w-4 h-4"/> Reintentar Conexión
                </button>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {lotteries.map(lottery => (
            <LotteryCard key={lottery.id} lottery={lottery} onClick={handleSelectLottery} />
          ))}
          {lotteries.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                 <Ticket className="w-12 h-12 text-gray-300 mb-2"/>
                 <p className="text-lg font-medium">No hay sorteos activos</p>
                 <p className="text-sm">Vuelve más tarde o accede como Admin para crear uno.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );

  const renderDetail = () => {
    if (!selectedLottery) return null;
    const totalCost = selectedNumbers.length * selectedLottery.pricePerNumber;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button 
          onClick={() => setCurrentView(ViewState.HOME)}
          className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver a Loterías
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h2 className="text-2xl font-bold text-gray-900">{selectedLottery.title}</h2>
                   <p className="text-gray-500">{selectedLottery.description}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Premio</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedLottery.prize}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4 bg-blue-50 p-4 rounded-lg">
                 <div>
                    <h3 className="font-semibold text-blue-900">Elige tus Números</h3>
                    <p className="text-sm text-blue-700">Selecciona los números para añadir a tu boleto.</p>
                 </div>
                 <button 
                   onClick={handleAiPick}
                   disabled={isAiThinking}
                   className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-md text-sm font-medium border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                 >
                   {isAiThinking ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4" />}
                   Pedir a la IA
                 </button>
              </div>

              <NumberGrid 
                totalNumbers={selectedLottery.totalNumbers}
                soldNumbers={selectedLottery.soldNumbers}
                selectedNumbers={selectedNumbers}
                onToggleNumber={handleToggleNumber}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Tu Boleto</h3>
                
                <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Números Seleccionados</span>
                        <span className="font-medium">{selectedNumbers.length}</span>
                    </div>
                    {selectedNumbers.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {selectedNumbers.map(n => (
                                <span key={n} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                                    #{n}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-4 border-t">
                        <span>Total</span>
                        <span>{CURRENCY_SYMBOL}{totalCost}</span>
                    </div>
                </div>

                <form onSubmit={handlePurchase} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                        <input 
                            type="text" 
                            id="name" 
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            placeholder="Juan Pérez"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            disabled={!!user} // Disable editing if logged in
                        />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                        <input 
                            type="email" 
                            id="email" 
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            placeholder="juan@ejemplo.com"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            disabled={!!user}
                        />
                    </div>

                    {purchaseResult && !purchaseResult.success && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {purchaseResult.message}
                        </div>
                    )}

                    <div className="bg-green-50 p-3 rounded-md text-xs text-green-800 border border-green-200 flex gap-2">
                         <MessageCircle className="w-4 h-4 flex-shrink-0" />
                         <p>Al confirmar, se abrirá WhatsApp para enviar tu pedido al organizador.</p>
                    </div>

                    <button 
                        type="submit"
                        disabled={selectedNumbers.length === 0 || purchasing}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all ${purchasing || selectedNumbers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {purchasing ? 'Procesando...' : 'Pedir por WhatsApp'}
                    </button>
                </form>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => (
     <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Registrada!</h2>
            <p className="text-gray-500 mb-6">
                Tus números han sido reservados temporalmente. <br/>
                <strong>Importante:</strong> Debes completar el pago y enviar el mensaje de WhatsApp al organizador para validar tu compra.
            </p>
            <button 
                onClick={() => {
                    setPurchaseResult(null);
                    setCurrentView(user ? ViewState.DASHBOARD : ViewState.HOME);
                }}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
                {user ? 'Ir al Panel' : 'Volver al Inicio'}
            </button>
        </div>
     </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar 
        currentView={currentView} 
        setView={setCurrentView} 
        cartCount={currentView === ViewState.LOTTERY_DETAIL ? selectedNumbers.length : 0} 
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="flex-grow">
        {currentView === ViewState.HOME && renderHome()}
        {currentView === ViewState.LOTTERY_DETAIL && renderDetail()}
        {currentView === ViewState.LOGIN && <Login api={api} onLoginSuccess={handleLoginSuccess} />}
        {currentView === ViewState.DASHBOARD && user && <Dashboard user={user} api={api} />}
        {currentView === ViewState.MILLIONAIRE_BAG && (
             <div className="py-20 text-center">
                 <h2 className="text-3xl font-bold text-gray-900 mb-4">Bolsa Millonaria</h2>
                 <p className="text-gray-500 mb-8">Sorteo especial de alto riesgo próximamente.</p>
                 <button onClick={() => setCurrentView(ViewState.HOME)} className="text-blue-600 hover:underline">Volver</button>
             </div>
        )}
        {currentView === ViewState.CONFIRMATION && renderConfirmation()}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
                <p className="text-gray-400 text-sm">&copy; 2024 PUKATU Sistema de Lotería.</p>
                <div className="flex space-x-6">
                    <a href="#" className="text-gray-400 hover:text-gray-500">Términos</a>
                    <a href="#" className="text-gray-400 hover:text-gray-500">Privacidad</a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
