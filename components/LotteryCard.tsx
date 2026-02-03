
import React from 'react';
import { Lottery } from '../types';
import { Trophy, Calendar, Users, Award, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';

interface LotteryCardProps {
  lottery: Lottery;
  onClick: (lottery: Lottery) => void;
}

const LotteryCard: React.FC<LotteryCardProps> = ({ lottery, onClick }) => {
  const percentSold = Math.round((lottery.soldNumbers.length / lottery.totalNumbers) * 100);
  const isDrawToday = new Date(lottery.drawDate).toDateString() === new Date().toDateString();
  const isCompleted = lottery.status === 'completed';

  return (
    <div 
      className={`group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden cursor-pointer flex flex-col h-full relative ${isCompleted ? 'border-yellow-100' : ''}`}
      onClick={() => onClick(lottery)}
    >
      {/* Winner Overlay */}
      {lottery.winningNumber && (
          <div className="absolute top-0 right-0 z-30 m-4">
              <div className="bg-yellow-400 text-yellow-900 font-black px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-bounce border-2 border-yellow-500">
                  <Award className="w-5 h-5" />
                  <span>GANADOR: #{lottery.winningNumber}</span>
              </div>
          </div>
      )}

      {/* Hero Image Section */}
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent z-10" />
        <img 
          src={lottery.image} 
          alt={lottery.title} 
          className={`w-full h-full object-cover transition-transform duration-1000 ${isCompleted ? 'grayscale-[0.5]' : 'group-hover:scale-110'}`}
        />
        
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
           {isDrawToday && !isCompleted && (
              <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
                <Clock className="w-3 h-3" /> SORTEO HOY
              </span>
           )}
           <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg self-start ${isCompleted ? 'bg-yellow-400 text-yellow-900' : 'bg-blue-600 text-white'}`}>
             {isCompleted ? 'Finalizado' : 'Oficial'}
           </span>
        </div>

        <div className="absolute bottom-6 left-6 z-20 text-white">
          <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-1">Premio Mayor</p>
          <h3 className="text-4xl font-black tracking-tight drop-shadow-2xl">{lottery.prize}</h3>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col">
        <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{lottery.title}</h4>
        
        {isCompleted && lottery.drawNarrative ? (
             <div className="p-3 bg-yellow-50/50 rounded-xl border border-yellow-100 mb-6 animate-fadeIn">
                 <div className="flex items-center gap-2 text-[10px] font-black text-yellow-700 uppercase tracking-widest mb-2">
                     <Sparkles className="w-3 h-3" /> Historia del Sorteo
                 </div>
                 <p className="text-gray-600 text-xs italic line-clamp-3 leading-relaxed">
                     "{lottery.drawNarrative}"
                 </p>
             </div>
        ) : (
            <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">{lottery.description}</p>
        )}
        
        <div className="mt-auto space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-tighter">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>{new Date(lottery.drawDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>{isCompleted ? '100%' : `${percentSold}%`} Vendido</span>
                </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-yellow-400' : 'bg-blue-600'}`} 
                    style={{ width: `${isCompleted ? 100 : percentSold}%` }}
                ></div>
            </div>
            
            <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{isCompleted ? 'Premio de' : 'Desde'}</p>
                  <p className="text-2xl font-black text-gray-900">
                      {isCompleted ? lottery.prize : `${CURRENCY_SYMBOL}${lottery.pricePerNumber}`}
                  </p>
                </div>
                <button className={`px-8 py-3 rounded-xl text-sm font-black transition-all active:scale-95 ${isCompleted ? 'bg-yellow-400 text-yellow-900 hover:shadow-yellow-100' : 'bg-gray-900 text-white hover:bg-blue-600 hover:shadow-blue-200'} hover:shadow-xl`}>
                    {isCompleted ? 'RESULTADOS' : 'JUGAR'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LotteryCard;
