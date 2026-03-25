
import React, { useState } from 'react';
import { User, UserRole } from '../types';

import { blockchainService } from '../services/blockchainService';

interface IdentityManagementProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  refreshState: () => void;
}

const IdentityManagement: React.FC<IdentityManagementProps> = ({ currentUser, setCurrentUser, refreshState }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [regData, setRegData] = useState({ name: '', org: 'HospitalOrg1.MSP', role: UserRole.PATIENT });
  
  // Simulated Fabric "Identity Wallet"
  const [wallet, setWallet] = useState<User[]>(() => {
    const savedWallet = localStorage.getItem('healthledger_wallet');
    return savedWallet ? JSON.parse(savedWallet) : [
      { id: 'DOC_MITCHELL', name: 'Dr. Sarah Mitchell', role: UserRole.DOCTOR, organization: 'HospitalOrg1.MSP', publicKey: 'cert_771c765' },
      { id: 'PATIENT_001', name: 'John Doe', role: UserRole.PATIENT, organization: 'PatientsOrg.MSP', publicKey: 'cert_992b113' },
      { id: 'ADMIN_ROOT', name: 'Network Admin', role: UserRole.ADMIN, organization: 'OrdererOrg.MSP', publicKey: 'cert_admin_1' }
    ];
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `USR_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const newUser: User = {
      id: newId,
      name: regData.name,
      role: regData.role,
      organization: regData.org,
      publicKey: `cert_${Math.random().toString(36).substr(2, 7)}`
    };
    
    const newWallet = [...wallet, newUser];
    setWallet(newWallet);
    localStorage.setItem('healthledger_wallet', JSON.stringify(newWallet));
    setIsRegistering(false);
    // Auto-switch to newly registered user
    setCurrentUser(newUser);
  };

  const activateIdentity = (user: User) => {
    setCurrentUser(user);
  };

  const handleDeleteIdentity = (id: string) => {
    if (id === currentUser.id) {
      return;
    }
    const newWallet = wallet.filter(u => u.id !== id);
    setWallet(newWallet);
    localStorage.setItem('healthledger_wallet', JSON.stringify(newWallet));
    setDeletingId(null);
  };

  const doctors = wallet.filter(u => u.role === UserRole.DOCTOR);
  const isPatient = currentUser.role === UserRole.PATIENT;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Identity Wallet & MSP</h1>
          <p className="text-slate-500">Manage your Hyperledger Fabric cryptographic credentials</p>
        </div>
        <button 
          onClick={() => setIsRegistering(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center shadow-lg shadow-blue-200"
        >
          <i className="fas fa-user-plus mr-2"></i> Register New Identity
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Identity Detail */}
        <div className="lg:col-span-1 bg-slate-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
          <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-8">Active Session Certificate</h3>
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-2xl ${
              currentUser.role === UserRole.DOCTOR ? 'bg-blue-600' : 'bg-emerald-600'
            }`}>
              <i className={`fas ${currentUser.role === UserRole.DOCTOR ? 'fa-user-md' : 'fa-user'}`}></i>
            </div>
            <h2 className="text-2xl font-bold">{currentUser.name}</h2>
            <p className="text-slate-400 text-sm">{currentUser.organization}</p>
          </div>

          <div className="space-y-4 font-mono text-[10px] bg-black/30 p-4 rounded-2xl border border-white/5">
            <p className="text-slate-500">// X.509 DIGITAL CERTIFICATE</p>
            <p className="text-blue-300">ID: {currentUser.id}</p>
            <p className="text-emerald-300">ROLE: {currentUser.role}</p>
            <p className="text-slate-300 truncate">PUB_KEY: {currentUser.publicKey}</p>
          </div>
        </div>

        {/* Identity Wallet List */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <i className="fas fa-wallet mr-3 text-slate-400"></i> Local Identity Wallet
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wallet.map((user) => (
              <div 
                key={user.id}
                className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                  currentUser.id === user.id ? 'border-blue-500 bg-blue-50/30' : 'border-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm ${
                    user.role === UserRole.DOCTOR ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}>
                    <i className={`fas ${user.role === UserRole.DOCTOR ? 'fa-user-md' : 'fa-user'}`}></i>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none">{user.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">{user.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {currentUser.role === UserRole.ADMIN && currentUser.id !== user.id && (
                    <button 
                      onClick={() => setDeletingId(user.id)}
                      className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                      title="Delete Identity"
                    >
                      <i className="fas fa-trash-alt text-[10px]"></i>
                    </button>
                  )}
                  {currentUser.id === user.id ? (
                    <span className="text-blue-600 text-xs font-black uppercase tracking-widest bg-blue-100 px-2 py-1 rounded">ACTIVE</span>
                  ) : (
                    <button 
                      onClick={() => activateIdentity(user)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-colors"
                    >
                      ACTIVATE
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Access Control Management (For Patients) */}
        {isPatient && (
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <i className="fas fa-user-shield mr-3 text-blue-500"></i> Clinical Access Control
              </h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Smart Contract: AccessControl.go</span>
            </div>
            
            <p className="text-sm text-slate-500 mb-6">
              Grant or revoke cryptographic endorsement permissions to medical professionals. 
              Only endorsed doctors can decrypt and view your health records.
            </p>

            <div className="space-y-4">
              {doctors.map((doctor) => {
                const hasAccess = blockchainService.hasAccess(currentUser.id, doctor.id);
                return (
                  <div key={doctor.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <i className="fas fa-user-md"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{doctor.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">{doctor.organization}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={async () => {
                        if (hasAccess) {
                          await blockchainService.revokeAccess(currentUser.id, doctor.id);
                        } else {
                          await blockchainService.grantAccess(currentUser.id, doctor.id);
                        }
                        refreshState();
                        // Force re-render local state
                        setCurrentUser({...currentUser});
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        hasAccess 
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'
                      }`}
                    >
                      {hasAccess ? 'Revoke Endorsement' : 'Grant Endorsement'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isRegistering && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-scaleIn">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Enroll New Identity</h2>
              <p className="text-slate-500 text-sm">Issue new membership credentials to the Fabric CA.</p>
            </div>
            
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Legal Full Name</label>
                <input 
                  required
                  type="text"
                  value={regData.name}
                  onChange={e => setRegData({...regData, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  placeholder="e.g. Alice Chambers"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRegData({...regData, role: UserRole.DOCTOR, org: 'HospitalOrg1.MSP'})}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${
                    regData.role === UserRole.DOCTOR ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-50 text-slate-400'
                  }`}
                >
                  <i className="fas fa-user-md text-xl mb-2"></i>
                  <span className="text-[10px] font-black uppercase">Doctor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegData({...regData, role: UserRole.PATIENT, org: 'PatientsOrg.MSP'})}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${
                    regData.role === UserRole.PATIENT ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-50 text-slate-400'
                  }`}
                >
                  <i className="fas fa-user text-xl mb-2"></i>
                  <span className="text-[10px] font-black uppercase">Patient</span>
                </button>
              </div>

              <div className="flex space-x-3 pt-6">
                <button type="button" onClick={() => setIsRegistering(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100">Confirm Enrollment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-scaleIn">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Revoke Credentials?</h2>
              <p className="text-slate-500 text-sm mt-2">
                This will permanently remove this identity from the local wallet. 
                This action is irreversible on the simulated ledger.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => setDeletingId(null)} 
                className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteIdentity(deletingId)}
                className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 shadow-xl shadow-rose-100"
              >
                Revoke Identity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentityManagement;
