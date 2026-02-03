
import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, Lottery, PurchaseRequest, User } from './types';
import { PukatuAPI } from './services/api';
import { getLuckyNumbers } from './services/geminiService';
import Navbar from './components/Navbar';
import LotteryCard from './components/LotteryCard';
import NumberGrid from './components/NumberGrid';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { ArrowLeft, CheckCircle, AlertCircle, Wand2, Loader2, MessageCircle, RefreshCw, Phone, Globe, ShieldCheck, Zap, Ticket, ShoppingBag, PlusCircle, CloudOff } from 'lucide-react';
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
      setError(result.error || 'Error al conectar con la base de datos.');
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
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 to-indigo-950 overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <Globe className="w-full h-full text-white" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-5xl font-extrabold text-white sm:text-7xl tracking-tighter mb-8">
              Tu Puerta <span className="text-blue-400">a la Fortuna</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-blue-100 font-medium mb-12">
              Participa en sorteos oficiales de forma segura y transparente. El sistema más robusto de gestión de loterías digitales.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-6 py-3 rounded-2xl text-blue-200 text-sm border border-white/10 shadow-xl">
                <ShieldCheck className="w-5 h-5 text-blue-400" /> 100% Auditado
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-6 py-3 rounded-2xl text-blue-200 text-sm border border-white/10 shadow-xl">
                <Zap className="w-5 h-5 text-yellow-400" /> Pago Instantáneo
              </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-10 relative z-20">
        <div className="flex items-center justify-between mb-10">
           <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
             <div className="w-2.5 h-10 bg-blue-600 rounded-full shadow-lg shadow-blue-200"></div>
             Cartelera Oficial
           </h2>
           <button onClick={loadLotteries} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-black hover:shadow-md transition-all active:scale-95">
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} /> Sincronizar
           </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[1,2,3].map(i => (
               <div key={i} className="bg-gray-100 animate-pulse h-[450px] rounded-3xl border border-gray-200"></div>
             ))}
          </div>
        ) : error && !api.isOffline ? (
          <div className="bg-white rounded-3xl shadow-xl border border-red-50 p-12 text-center max-w-lg mx-auto">
             <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
             </div>
             <h3 className="text-2xl font-black text-gray-900 mb-2">Error de Conexión</h3>
             <p className="text-gray-500 mb-8 font-medium">{error}</p>
             <button onClick={loadLotteries} className="w-full bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
               REINTENTAR AHORA
             </button>
          </div>
        ) : lotteries.length === 0 ? (
          <div className="bg-white rounded-[40px] shadow-2xl border border-gray-50 p-24 text-center max-w-3xl mx-auto">
             <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                {api.isOffline ? <CloudOff className="w-12 h-12 text-amber-500" /> : <Ticket className="w-12 h-12 text-gray-200" />}
             </div>
             <h3 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">Sin Sorteos Activos</h3>
             <p className="text-gray-500 mb-12 font-medium text-lg max-w-md mx-auto leading-relaxed">
                {api.isOffline ? 'Estás en modo local. Inicia sesión como administrador para crear tu primer sorteo de prueba.' : 'Estamos preparando nuevos premios increíbles para ti. ¡Vuelve pronto o inicia sesión si eres administrador!'}
             </p>
             <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <button onClick={() => setCurrentView(ViewState.LOGIN)} className="bg-gray-900 text-white px-10 py-5 rounded-3xl font-black text-sm tracking-widest uppercase hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                    <PlusCircle className="w-5 h-5" /> Iniciar Gestión
                 </button>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {lotteries.map(lottery => (
              <LotteryCard key={lottery.id} lottery={lottery} onClick={handleSelectLottery} />
            ))}
          </div>
        )}
      </div>
      
      {/* Informative Section */}
      <div className="bg-gray-50 py-24 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-6 text-center">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                  <ShieldCheck className="w-3.5 h-3.5" /> Seguridad Total
              </div>
              <h3 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">Transparencia en Cada Selección</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-10 font-medium">
                  PUKATU utiliza infraestructura en la nube para garantizar que cada selección de número sea inalterable y auditable. 
                  Compramos los boletos físicos oficiales en tu representación, brindándote la comodidad de la web con la seguridad del papel.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div className="p-6">
                      <p className="text-3xl font-black text-blue-600 mb-1">100%</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Garantía Legal</p>
                  </div>
                  <div className="p-6">
                      <p className="text-3xl font-black text-blue-600 mb-1">24/7</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Soporte VIP</p>
                  </div>
                  <div className="p-6">
                      <p className="text-3xl font-black text-blue-600 mb-1">HTTPS</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Datos Cifrados</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedLottery) return null;
    const totalCost = selectedNumbers.length * selectedLottery.pricePerNumber;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-slideUp">
        <button onClick={() => setCurrentView(ViewState.HOME)} className="flex items-center text-blue-600 font-black mb-10 hover:translate-x-[-4px] transition-all group">
          <ArrowLeft className="w-6 h-6 mr-3 group-hover:scale-125 transition-transform" /> 
          <span className="text-lg">Explorar otros sorteos</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
               <div className="h-80 relative">
                  <img src={selectedLottery.image} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent flex items-end p-10">
                      <div>
                          <div className="inline-block bg-blue-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest mb-4 shadow-xl">SORTEO OFICIAL</div>
                          <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">{selectedLottery.title}</h2>
                          <p className="text-blue-100 text-lg font-medium max-w-xl">{selectedLottery.description}</p>
                      </div>
                  </div>
               </div>
               
               <div className="p-10">
                  <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8 bg-blue-50/50 p-8 rounded-[32px] border border-blue-100/50">
                     <div className="text-center md:text-left">
                        <p className="text-[10px] text-blue-600/70 font-black uppercase tracking-widest mb-1">PREMIO ESTIMADO</p>
                        <p className="text-5xl font-black text-blue-600 tracking-tighter">{selectedLottery.prize}</p>
                     </div>
                     <button onClick={handleAiPick} disabled={isAiThinking} className="group flex items-center gap-3 bg-white text-blue-600 px-8 py-5 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-600 hover:text-white transition-all active:scale-95 disabled:opacity-50">
                        {isAiThinking ? <Loader2 className="w-6 h-6 animate-spin"/> : <Wand2 className="w-6 h-6 group-hover:rotate-45 transition-transform" />}
                        Sugerencia de la Suerte (IA)
                     </button>
                  </div>

                  <div className="flex items-center gap-3 mb-8">
                    <Ticket className="w-6 h-6 text-blue-600" />
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Elige tus números</h3>
                  </div>
                  
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
             <div className="bg-white rounded-[40px] shadow-2xl p-10 border border-gray-100 sticky top-28">
                <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-6">Carrito de Juego</h3>
                
                <div className="space-y-8 mb-10">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Participaciones</span>
                        <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-xl text-xs font-black">
                          {selectedNumbers.length} TICKETS
                        </span>
                    </div>
                    {selectedNumbers.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5">
                            {selectedNumbers.map(n => (
                                <span key={n} className="w-11 h-11 flex items-center justify-center bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 text-lg animate-scaleIn">
                                    {n}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="py-6 text-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 text-sm font-medium italic">
                            Selecciona números para continuar
                        </div>
                    )}
                    <div className="flex justify-between items-end pt-8 border-t border-gray-100">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total a Pagar</p>
                            <p className="text-4xl font-black text-gray-900 tracking-tighter">{CURRENCY_SYMBOL}{totalCost}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handlePurchase} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre para el Recibo</label>
                        <input 
                            type="text" 
                            required
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="Tu Nombre"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            disabled={!!user}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono (WhatsApp)</label>
                        <div className="relative">
                            <input 
                                type="tel" 
                                required
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 pl-12 font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="0412..."
                                value={userPhone}
                                onChange={(e) => setUserPhone(e.target.value)}
                                disabled={!!user}
                            />
                            <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                        </div>
                    </div>

                    {purchaseResult && !purchaseResult.success && (
                        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl flex items-center gap-3 border border-red-100 font-bold">
                            <AlertCircle className="w-5 h-5" /> {purchaseResult.message}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={selectedNumbers.length === 0 || purchasing}
                        className="w-full bg-green-600 text-white py-5 rounded-[24px] font-black text-xl shadow-xl shadow-green-100 hover:bg-green-700 hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3"
                    >
                        {purchasing ? (
                            <> <Loader2 className="w-6 h-6 animate-spin"/> PROCESANDO... </>
                        ) : (
                            <> <MessageCircle className="w-6 h-6" /> PAGAR POR WHATSAPP </>
                        )}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                        Transacción Segura Protegida
                    </p>
                </form>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => (
     <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-fadeIn">
        <div className="bg-white p-12 rounded-[48px] shadow-2xl max-w-lg w-full text-center border border-gray-100">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-[32px] bg-green-50 mb-10 shadow-inner">
                <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">¡Reserva Exitosa!</h2>
            
            <p className="text-gray-500 mb-12 font-medium text-lg leading-relaxed">
                Tus números han sido reservados. Para completar la compra, haz clic en el botón de WhatsApp para enviar el comprobante y recibir tu ticket digital.
            </p>

            {lastWhatsAppUrl && (
                <a 
                    href={lastWhatsAppUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-green-600 text-white px-8 py-5 rounded-[24px] font-black text-xl hover:bg-green-700 mb-6 flex items-center justify-center gap-4 shadow-xl shadow-green-100 transition-all hover:scale-[1.02] active:scale-100"
                >
                    <MessageCircle className="w-7 h-7" /> ENVIAR POR WHATSAPP
                </a>
            )}

            <button 
                onClick={() => setCurrentView(ViewState.HOME)}
                className="w-full text-gray-400 font-bold hover:text-blue-600 py-2 transition-colors uppercase text-xs tracking-widest"
            >
                Volver a la cartelera
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
        isOffline={api.isOffline}
      />
      
      <main className="flex-grow">
        {currentView === ViewState.HOME && renderHome()}
        {currentView === ViewState.LOTTERY_DETAIL && renderDetail()}
        {currentView === ViewState.LOGIN && <Login api={api} onLoginSuccess={handleLoginSuccess} />}
        {currentView === ViewState.DASHBOARD && user && <Dashboard user={user} api={api} />}
        {currentView === ViewState.MILLIONAIRE_BAG && (
             <div className="py-32 text-center animate-fadeIn">
                 <ShoppingBag className="w-24 h-24 text-yellow-500 mx-auto mb-8 opacity-20" />
                 <h2 className="text-5xl font-black text-gray-900 mb-6 tracking-tighter">Bolsa Millonaria</h2>
                 <p className="text-gray-500 max-w-sm mx-auto mb-12 font-medium text-lg leading-relaxed">Próximamente: El acumulado progresivo más grande de la región. Acumula participaciones y sé parte del gran sorteo.</p>
                 <button onClick={() => setCurrentView(ViewState.HOME)} className="bg-gray-900 text-white px-10 py-4 rounded-3xl font-black text-sm tracking-widest uppercase hover:bg-blue-600 transition-all">Regresar</button>
             </div>
        )}
        {currentView === ViewState.CONFIRMATION && renderConfirmation()}
      </main>

      <footer className="bg-gray-900 text-white border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-20 px-6 sm:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-16 border-b border-gray-800 pb-16 mb-16">
                <div className="col-span-1 md:col-span-2">
                   <h4 className="text-3xl font-black mb-6 tracking-tighter">PUKATU</h4>
                   <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
                      Revolucionando la forma en que juegas a la lotería. Gestión digital auditada con boletos físicos oficiales.
                   </p>
                </div>
                <div>
                    <h4 className="font-black mb-6 uppercase text-[10px] tracking-[0.2em] text-blue-400">Plataforma</h4>
                    <ul className="space-y-4 text-sm text-gray-400 font-bold">
                        <li><a href="#" className="hover:text-white transition-colors">Términos de Uso</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Reglamento</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-black mb-6 uppercase text-[10px] tracking-[0.2em] text-blue-400">Ayuda</h4>
                    <ul className="space-y-4 text-sm text-gray-400 font-bold">
                        <li><a href="#" className="hover:text-white transition-colors">Preguntas Frecuentes</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Soporte Directo</a></li>
                    </ul>
                </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 font-bold text-[10px] tracking-widest uppercase text-center md:text-left">
                <p>&copy; 2025 PUKATU NETWORK. Powered by Supabase & Gemini AI.</p>
                <div className="flex gap-6">
                    <span>Certificado SSL</span>
                    <span>Pagos Seguros</span>
                    <span>Juego Responsable</span>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
