
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  currentUser: User;
  chainLength: number;
}

const Header: React.FC<HeaderProps> = ({ currentUser, chainLength }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-slate-700 md:hidden">HealthLedger</h2>
        <div className="hidden md:flex items-center bg-slate-100 rounded-full px-3 py-1 text-xs text-slate-500 font-medium">
          <i className="fas fa-link mr-2 text-blue-500"></i>
          Ledger Height: {chainLength}
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-none">{currentUser.name}</p>
            <p className="text-xs text-slate-500 mt-1">{currentUser.organization}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
            {currentUser.name.charAt(0)}
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
          <i className="fas fa-bell text-xl"></i>
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
