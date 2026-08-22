import React from 'react';
import { Leaf } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', className = '' }) => {
  const iconSizes = {
    sm: 'w-7 h-7 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-14 h-14 p-3',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const subtextSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center ${iconSizes[size]}`}>
        <Leaf className="w-full h-full stroke-[2.2]" />
      </div>
      <div className="flex flex-col text-left">
        <span className={`font-bold tracking-tight text-slate-900 leading-tight ${textSizes[size]}`}>
          Feriani <span className="text-emerald-600">Nutri</span>
        </span>
        <span className={`font-semibold tracking-wider uppercase text-slate-400 ${subtextSizes[size]}`}>
          Gestão Nutricional
        </span>
      </div>
    </div>
  );
};
