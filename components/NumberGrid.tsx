import React from 'react';

interface NumberGridProps {
  totalNumbers: number;
  soldNumbers: number[];
  selectedNumbers: number[];
  onToggleNumber: (num: number) => void;
}

const NumberGrid: React.FC<NumberGridProps> = ({ 
  totalNumbers, 
  soldNumbers, 
  selectedNumbers, 
  onToggleNumber 
}) => {
  
  // Generate array of numbers from 1 to totalNumbers
  const numbers = Array.from({ length: totalNumbers }, (_, i) => i + 1);

  return (
    <div className="w-full">
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 p-2 max-h-[400px] overflow-y-auto custom-scrollbar bg-gray-50 rounded-lg border border-gray-200">
        {numbers.map((num) => {
          const isSold = soldNumbers.includes(num);
          const isSelected = selectedNumbers.includes(num);
          
          let baseClass = "h-10 w-full rounded-md flex items-center justify-center text-sm font-semibold transition-all duration-200";
          let stateClass = "";

          if (isSold) {
            stateClass = "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50";
          } else if (isSelected) {
            stateClass = "bg-blue-600 text-white shadow-md transform scale-105";
          } else {
            stateClass = "bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 cursor-pointer border border-gray-200";
          }

          return (
            <button
              key={num}
              onClick={() => !isSold && onToggleNumber(num)}
              disabled={isSold}
              className={`${baseClass} ${stateClass}`}
              aria-label={`Seleccionar número ${num}`}
            >
              {num}
            </button>
          );
        })}
      </div>
      
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div> Disponible
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-600 rounded"></div> Seleccionado
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-300 rounded"></div> Vendido
        </div>
      </div>
    </div>
  );
};

export default NumberGrid;