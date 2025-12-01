
import React from 'react';
import { Lottery } from '../types';
import { Trophy, Calendar, Users, Award } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';

interface LotteryCardProps {
  lottery: Lottery;
  onClick: (lottery: Lottery) => void;
}

const LotteryCard: React.FC<LotteryCardProps> = ({ lottery, onClick }) => {
  const percentSold = Math.round((lottery.soldNumbers.length / lottery.totalNumbers) * 100);

  return (
    <div 
      className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer flex flex-col h-full relative"
      onClick={() => onClick(lottery)}
    >
      {/* Winner Overlay */}
      {lottery.winningNumber && (
          <div className="absolute top-0 right-0 z-30 m-2">
              <div className="bg-yellow-400 text-yellow-900 font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                  <Award className="w-4 h-4" />
                  <span>#{lottery.winningNumber}</span>
              </div>
          </div>
      )}

      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <img 
          src={lottery.image} 
          alt={lottery.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-4 left-4 z-20 text-white">
          <div className="flex items-center gap-2 mb-1">
             <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
               Gana
             </span>
          </div>
          <h3 className="text-2xl font-bold shadow-black drop-shadow-md">{lottery.prize}</h3>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h4 className="text-lg font-bold text-gray-900 mb-2">{lottery.title}</h4>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{lottery.description}</p>
        
        <div className="mt-auto space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>{new Date(lottery.drawDate).toLocaleDateString('es-ES')}</span>
                </div>
                 <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>{lottery.totalNumbers - lottery.soldNumbers.length} restantes</span>
                </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000" 
                    style={{ width: `${percentSold}%` }}
                ></div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
                <span className="text-lg font-bold text-blue-600">
                    {CURRENCY_SYMBOL}{lottery.pricePerNumber}
                    <span className="text-xs text-gray-400 font-normal ml-1">/ boleto</span>
                </span>
                <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                    {lottery.winningNumber ? 'Ver Resultados' : 'Jugar'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LotteryCard;
