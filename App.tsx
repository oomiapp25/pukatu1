
import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, Lottery, PurchaseRequest, User } from './types';
import { PukatuAPI } from './services/api';
import { getLuckyNumbers } from './services/geminiService';
import Navbar from './components/Navbar';
import LotteryCard from './components/LotteryCard';
import NumberGrid from './components/NumberGrid';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
// Added missing Ticket and ShoppingBag icons to the import list below
import { ArrowLeft, CheckCircle, AlertCircle, Wand2, Loader2, Lock, MessageCircle, RefreshCw, HelpCircle, Phone, Globe, ShieldCheck, Zap, Ticket, ShoppingBag } from 'lucide-react';
import { CURRENCY_SYMBOL } from './constants';

function App() {
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
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const currentUser = api.getCurrentUser();
      if (currentUser) {
          setUser(currentUser);
          setUserName(currentUser.name);
          setUserPhone(currentUser.email);
      }
      loadLotteries();
    };
    checkSession();
  }, [api]);

  const loadLotteries = async () => {
    setLoading(true);
    setError('');
    const result = await api.getActiveLotteries();
    if (result.success && result.data) {
      setLotteries(result.data);
    } else {
      setError(result.error || 'Error al conectar con el servidor de Supabase.');
    }
    setLoading(false);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
      setUser(loggedInUser);
      setUserName(loggedInUser.name);
      setUserPhone(loggedInUser.email);
      setCurrentView(ViewState.DASHBOARD);
  };

  const handleLogout = () => {
      api.logout();
      setUser(null);
      setUserName('');
      setUserPhone('');
      setCurrentView(ViewState.HOME);
  };

  const handleSelectLottery = (lottery: Lottery) => {
    setSelectedLottery(lottery);
    setSelectedNumbers([]); 
    setPurchaseResult(null);
    setLastWhatsAppUrl(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView(ViewState.LOTTERY_DETAIL);
  };

  const handleToggleNumber = (num: number) => {
    setSelectedNumbers(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

  const handleAiPick = async () => {
    if (!selectedLottery) return;
    setIsAiThinking(true);
    const allNumbers = Array.from({ length: selectedLottery.totalNumbers }, (_, i) => i + 1);
    const available = allNumbers.filter(n => !selectedLottery.soldNumbers.includes(n));
    const luckyNumbers = await getLuckyNumbers(selectedLottery.title, available, 5);
    setSelectedNumbers(prev => [...new Set([...prev, ...luckyNumbers])].filter(n => !selectedLottery.soldNumbers.includes(n)));
    setIsAiThinking(false);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLottery || selectedNumbers.length === 0) return;

    setPurchasing(true);
    const purchaseRequest: PurchaseRequest = {
      lotteryId: selectedLottery.id,
      buyerName: userName,
      email: userPhone,
      selectedNumbers: selectedNumbers,
      totalAmount: selectedNumbers.length * selectedLottery.pricePerNumber
    };

    const result = await api.submitPurchase(purchaseRequest);
    setPurchasing(false);
    
    if (result.success && result.data) {
      const { purchaseId, contactPhone } = result.data;
      if (contactPhone) {
          const message = `👋 Hola PUKATU, confirmo mi compra:\n🎫 *Sorteo:* ${selectedLottery.title}\n🔢 *Números:* ${selectedNumbers.join(', ')}\n💰 *Total:* ${CURRENCY_SYMBOL}${purchaseRequest.totalAmount}\n🆔 *ID:* ${purchaseId}`;
          const waUrl = `https://wa.me/${contactPhone}?text=${encodeURIComponent(message)}`;
          setLastWhatsAppUrl(waUrl);
          window.open(waUrl, '_blank');
      }
      setPurchaseResult({ success: true, message: '¡Casi listo! Confirma por WhatsApp.' });
      loadLotteries();
      setCurrentView(ViewState.CONFIRMATION);
    } else {
       setPurchaseResult({ success: false, message: result.error || 'Error al procesar compra.' });
    }
  };

  const renderHome = () => (
    <div className="animate-fadeIn">
      {/* Hero Section - TheLotter style */}
      <div className="relative bg-blue-900 overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10">
           <Globe className="w-full h-full text-white" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-6xl tracking-tight">
              La lotería más grande <br/> <span className="text-blue-400">ahora en línea</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-blue-100">
              Compra boletos oficiales de forma segura. PUKATU es tu pasaporte a la fortuna.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-blue-800/50 px-4 py-2 rounded-full text-blue-200 text-sm border border-blue-700">
                <ShieldCheck className="w-4 h-4" /> 100% Seguro
              </div>
              <div className="flex items-center gap-2 bg-blue-800/50 px-4 py-2 rounded-full text-blue-200 text-sm border border-blue-700">
                <Zap className="w-4 h-4" /> Resultados al Instante
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
             <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
             Sorteos Activos
           </h2>
           <button onClick={loadLotteries} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-semibold">
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
           </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[1,2,3].map(i => (
               <div key={i} className="bg-gray-200 animate-pulse h-80 rounded-xl"></div>
             ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8 text-center max-w-lg mx-auto">
             <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-gray-900">Error de Conexión</h3>
             <p className="text-gray-500 mb-6">{error}</p>
             <button onClick={loadLotteries} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">
               Reintentar
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {lotteries.map(lottery => (
              <LotteryCard key={lottery.id} lottery={lottery} onClick={handleSelectLottery} />
            ))}
          </div>
        )}
      </div>
      
      {/* SEO Section Inspiration */}
      <div className="bg-gray-100 py-16 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">¿Cómo funciona PUKATU?</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                  Desde nuestras oficinas locales compramos en su representación el boleto oficial y le enviamos una confirmación instantánea. 
                  Comprar boletos en línea es sencillo, seguro y 100% legal bajo las normativas vigentes de Supabase Cloud.
              </p>
          </div>
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedLottery) return null;
    const totalCost = selectedNumbers.length * selectedLottery.pricePerNumber;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slideUp">
        <button onClick={() => setCurrentView(ViewState.HOME)} className="flex items-center text-blue-600 font-bold mb-6 hover:translate-x-[-4px] transition-transform">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver al Inicio
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
               <div className="h-64 relative">
                  <img src={selectedLottery.image} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                      <div>
                          <h2 className="text-3xl font-bold text-white mb-2">{selectedLottery.title}</h2>
                          <p className="text-blue-200">{selectedLottery.description}</p>
                      </div>
                  </div>
               </div>
               
               <div className="p-8">
                  <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
                     <div className="text-center sm:text-left">
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Premio Mayor</p>
                        <p className="text-4xl font-extrabold text-blue-600">{selectedLottery.prize}</p>
                     </div>
                     <button onClick={handleAiPick} disabled={isAiThinking} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
                        {isAiThinking ? <Loader2 className="w-5 h-5 animate-spin"/> : <Wand2 className="w-5 h-5" />}
                        Números de la Suerte (IA)
                     </button>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-blue-600" />
                    Selecciona tus números disponibles
                  </h3>
                  <NumberGrid 
                    totalNumbers={selectedLottery.totalNumbers}
                    soldNumbers={selectedLottery.soldNumbers}
                    selectedNumbers={selectedNumbers}
                    onToggleNumber={handleToggleNumber}
                  />
               </div>
            </div>
          </div>

          <div className="lg:col-span-1">
             <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Resumen del Pedido</h3>
                
                <div className="space-y-6 mb-8">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Números</span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                          {selectedNumbers.length} seleccionado(s)
                        </span>
                    </div>
                    {selectedNumbers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedNumbers.map(n => (
                                <span key={n} className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full font-bold shadow-sm">
                                    {n}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-between text-2xl font-black pt-6 border-t text-gray-900">
                        <span>Total</span>
                        <span>{CURRENCY_SYMBOL}{totalCost}</span>
                    </div>
                </div>

                <form onSubmit={handlePurchase} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Nombre Completo</label>
                        <input 
                            type="text" 
                            required
                            className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="Ej. Juan Pérez"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            disabled={!!user}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Teléfono (WhatsApp)</label>
                        <div className="relative">
                            <input 
                                type="tel" 
                                required
                                className="w-full bg-gray-50 border-none rounded-xl p-4 pl-12 focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="04121234567"
                                value={userPhone}
                                onChange={(e) => setUserPhone(e.target.value)}
                                disabled={!!user}
                            />
                            <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                        </div>
                    </div>

                    {purchaseResult && !purchaseResult.success && (
                        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-center gap-3 border border-red-100">
                            <AlertCircle className="w-5 h-5" /> {purchaseResult.message}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={selectedNumbers.length === 0 || purchasing}
                        className="w-full bg-green-600 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-green-200 hover:bg-green-700 hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                    >
                        {purchasing ? 'PROCESANDO...' : 'PEDIR POR WHATSAPP'}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-4">
                        Pago 100% Protegido
                    </p>
                </form>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => (
     <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border border-gray-100 animate-scaleIn">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-8">
                <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">¡Pedido Realizado!</h2>
            
            <p className="text-gray-500 mb-8 font-medium">
                Solo un paso más. Por favor, confirma tu pedido enviando el mensaje pre-cargado al administrador.
            </p>

            {lastWhatsAppUrl && (
                <a 
                    href={lastWhatsAppUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-lg hover:bg-green-700 mb-4 flex items-center justify-center gap-3 shadow-xl shadow-green-100 transition-all hover:scale-[1.02]"
                >
                    <MessageCircle className="w-6 h-6" /> ABRIR WHATSAPP
                </a>
            )}

            <button 
                onClick={() => setCurrentView(ViewState.HOME)}
                className="w-full text-gray-400 font-bold hover:text-gray-600 py-2 transition-colors"
            >
                Volver a la tienda
            </button>
        </div>
     </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-blue-100 selection:text-blue-900">
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
             <div className="py-24 text-center">
                 <ShoppingBag className="w-20 h-20 text-yellow-500 mx-auto mb-6 opacity-20" />
                 <h2 className="text-4xl font-black text-gray-900 mb-4">Bolsa Millonaria</h2>
                 <p className="text-gray-500 max-w-sm mx-auto mb-10">Muy pronto, el acumulado más grande de PUKATU estará disponible para todos.</p>
                 <button onClick={() => setCurrentView(ViewState.HOME)} className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold">Volver al Inicio</button>
             </div>
        )}
        {currentView === ViewState.CONFIRMATION && renderConfirmation()}
      </main>

      <footer className="bg-gray-900 text-white border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-gray-800 pb-12 mb-12">
                <div>
                   <h4 className="text-xl font-bold mb-4">PUKATU</h4>
                   <p className="text-gray-400 text-sm">Tu plataforma de confianza para la compra de boletos de lotería oficial. Tecnología de punta para tus sueños de siempre.</p>
                </div>
                <div>
                    <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-blue-400">Legal</h4>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li><a href="#" className="hover:text-white transition-colors">Términos de Uso</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Reglas del Juego</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-blue-400">Soporte</h4>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li><a href="#" className="hover:text-white transition-colors">Preguntas Frecuentes</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">WhatsApp Directo</a></li>
                    </ul>
                </div>
            </div>
            <div className="flex justify-between items-center flex-col sm:flex-row gap-4 opacity-50">
                <p className="text-xs">&copy; 2024 PUKATU & Supabase. Todos los derechos reservados.</p>
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded bg-gray-800"></div>
                    <div className="w-8 h-8 rounded bg-gray-800"></div>
                    <div className="w-8 h-8 rounded bg-gray-800"></div>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
