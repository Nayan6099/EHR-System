
import React from 'react';
import { ViewType, UserRole } from '../types';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  role: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, role }) => {
  const menuItems = [
    { id: 'DASHBOARD', label: 'Network Health', icon: 'fa-chart-pie', roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT] },
    { 
      id: 'RECORDS', 
      label: role === UserRole.PATIENT ? 'My Records' : 'Clinical Manager', 
      icon: 'fa-file-medical', 
      roles: [UserRole.DOCTOR, UserRole.PATIENT] 
    },
    { id: 'EXPLORER', label: 'Ledger Explorer', icon: 'fa-cubes', roles: [UserRole.ADMIN, UserRole.DOCTOR] },
    { id: 'IDENTITY', label: 'Identity & CA', icon: 'fa-id-card', roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-950 text-white flex flex-col hidden md:flex shrink-0">
      <div className="p-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <i className="fas fa-link text-lg"></i>
        </div>
        <div>
          <span className="text-xl font-black tracking-tighter">HEALTH<span className="text-blue-500">LEDGER</span></span>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">V2.0 PRO</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-8 space-y-2">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as ViewType)}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              activeView === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-500 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <i className={`fas ${item.icon} w-5 text-sm ${activeView === item.id ? 'text-white' : 'text-slate-600'}`}></i>
            <span className="font-bold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6">
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center space-x-2 text-[10px] text-green-400 font-black mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            <span className="tracking-[0.2em] uppercase">Channel: main-ehr</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mb-1">Active Peer:</p>
          <p className="text-xs font-mono text-slate-300 truncate">peer0.org1.hospital:7051</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
