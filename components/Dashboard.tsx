
import React from 'react';
import { BlockchainState, User } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  chainState: BlockchainState;
  currentUser: User;
}

const Dashboard: React.FC<DashboardProps> = ({ chainState, currentUser }) => {
  // Mock data for health trends
  const trendData = [
    { name: 'Mon', value: 72 },
    { name: 'Tue', value: 75 },
    { name: 'Wed', value: 68 },
    { name: 'Thu', value: 80 },
    { name: 'Fri', value: 74 },
    { name: 'Sat', value: 71 },
    { name: 'Sun', value: 73 },
  ];

  const stats = [
    { label: 'Total Records', value: Object.values(chainState.worldState).flat().length, icon: 'fa-folder-open', color: 'bg-blue-500' },
    { label: 'Network Throughput', value: '1,240 TPS', icon: 'fa-bolt', color: 'bg-amber-500' },
    { label: 'Unique Patients', value: Object.keys(chainState.worldState).length, icon: 'fa-user-injured', color: 'bg-emerald-500' },
    { label: 'Avg. Latency', value: '14ms', icon: 'fa-clock', color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Health Monitor</h1>
          <p className="text-slate-500 text-sm">Real-time Hyperledger Fabric Network Performance</p>
        </div>
        <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Network Synchronized</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center text-white`}>
                <i className={`fas ${stat.icon} text-lg`}></i>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-tighter">Live</span>
            </div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-800">Transaction Growth</h3>
              <p className="text-xs text-slate-400">Total ledger transactions across all channels</p>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md">7D</button>
              <button className="px-3 py-1 text-slate-400 text-[10px] font-bold rounded-md hover:bg-slate-50">30D</button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', fontSize: '12px' }}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center">
            <i className="fas fa-microchip mr-2 text-blue-500"></i>
            Node Activity
          </h3>
          <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {chainState.chain.slice(-4).reverse().map((block, i) => (
              <div key={block.blockNumber} className="flex space-x-4 relative">
                {i !== 3 && <div className="absolute left-3 top-8 bottom-[-1.5rem] w-0.5 bg-slate-100"></div>}
                <div className="w-6 h-6 rounded-lg bg-slate-900 text-white shadow-sm flex items-center justify-center z-10 text-[10px] font-black">
                  {block.blockNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Block Commited to Channel</p>
                  <div className="flex items-center space-x-2 mt-1">
                     <span className="text-[10px] font-mono text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">0x{block.currentHash.substring(0, 6)}</span>
                     <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(block.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Active Peers</p>
                <p className="text-sm font-black text-slate-700">4 / 4 Online</p>
              </div>
              <i className="fas fa-server text-slate-300"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
