
import React, { useState, useEffect } from 'react';
import { HealthRecord, User, UserRole, BlockchainState } from '../types';
import { blockchainService } from '../services/blockchainService';
import { analyzeHealthRecords } from '../services/geminiService';

interface PatientRecordsProps {
  refreshState: () => void;
  currentUser: User;
  chainState: BlockchainState;
}

const PatientRecords: React.FC<PatientRecordsProps> = ({ refreshState, currentUser, chainState }) => {
  const isPatient = currentUser.role === UserRole.PATIENT;
  const grantedPatients = chainState.accessGrants
    .filter(g => g.doctorId === currentUser.id)
    .map(g => g.patientId);

  const [selectedPatientId, setSelectedPatientId] = useState(isPatient ? currentUser.id : (grantedPatients[0] || 'mukul' || 'PATIENT_001'));
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'OFF_CHAIN'>('LEDGER');
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [newRecord, setNewRecord] = useState({
    patientId: '',
    type: 'DIAGNOSIS' as HealthRecord['type'],
    data: '',
    file: null as File | null,
  });

  const hasAccess = isPatient || blockchainService.hasAccess(selectedPatientId, currentUser.id) || currentUser.role === UserRole.ADMIN;
  
  // Use the passed chainState to derive records
  const records = hasAccess ? (chainState.worldState[selectedPatientId] || []) : [];

  console.log('PatientRecords Render:', { 
    selectedPatientId, 
    recordsCount: records.length, 
    hasAccess,
    chainLength: chainState.chain.length,
    ipfsVaultKeys: Object.keys(chainState.ipfsVault || {}),
    ipfsVaultSample: chainState.ipfsVault ? Object.entries(chainState.ipfsVault).slice(0, 2) : 'empty'
  });

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPatient = isPatient ? currentUser.id : (newRecord.patientId || selectedPatientId);
    
    console.log('Adding record for:', targetPatient);

    let attachmentUrl = undefined;
    if (newRecord.file) {
      attachmentUrl = URL.createObjectURL(newRecord.file);
    }

    // 1. Simulate IPFS Upload (Off-Chain)
    const ipfsHash = await blockchainService.addToIpfs(newRecord.data);
    console.log(`PatientRecords: IPFS Hash generated: ${ipfsHash}`);

    // 2. Simulate Blockchain Transaction (On-Chain)
    const record: HealthRecord = {
      id: `REC_${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      patientId: targetPatient,
      doctorId: currentUser.id,
      timestamp: Date.now(),
      type: newRecord.type,
      data: `[DATA ANCHORED TO IPFS: ${ipfsHash.substring(0, 10)}...]`, // On-chain placeholder
      attachmentUrl,
      hash: ipfsHash
    };

    console.log('PatientRecords: Submitting record to ledger:', record);

    await blockchainService.submitTransaction(record, currentUser);
    setNewRecord({ patientId: '', type: 'DIAGNOSIS', data: '', file: null });
    setIsAdding(false);
    refreshState();
  };

  const runAiAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeHealthRecords(records, selectedPatientId);
    setAnalysisResult(result || "No analysis available.");
    setIsAnalyzing(false);
  };

  const handleDelete = async (recordId: string) => {
    console.log('handleDelete called for:', recordId);
    try {
      await blockchainService.deleteRecord(recordId, selectedPatientId, currentUser);
      console.log('Record deleted successfully on ledger');
      setConfirmDeleteId(null);
      refreshState();
    } catch (error) {
      console.error('Deletion failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete record.');
      setConfirmDeleteId(null);
    }
  };

  useEffect(() => {
    if (isPatient) {
      setSelectedPatientId(currentUser.id);
    }
  }, [currentUser.id, isPatient]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">
            {isPatient ? 'Personal Health Ledger' : 'Clinical Manager v2.0'}
          </h1>
          <div className="flex items-center mt-1 text-slate-500 text-xs font-semibold">
            <i className="fas fa-fingerprint mr-2 text-blue-500"></i>
            {isPatient ? 'Hybrid Storage Model: Fabric (Metadata) + IPFS (Clinical Files)' : `Managing Records for: ${selectedPatientId}`}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isPatient && (
            <div className="flex items-center space-x-2">
              {grantedPatients.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 w-48 appearance-none transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Patient ID...</option>
                    {grantedPatients.map(pId => (
                      <option key={pId} value={pId}>{pId}</option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
                </div>
              )}
              
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Manual ID Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedPatientId(searchQuery)}
                  className="bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 w-48 transition-all"
                />
                <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"></i>
              </div>
            </div>
          )}
          
          <button 
            onClick={runAiAnalysis}
            disabled={isAnalyzing || records.length === 0 || !hasAccess}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center transition-all shadow-md font-bold text-xs"
          >
            {isAnalyzing ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : <i className="fas fa-brain mr-2"></i>}
            Clinical AI Analysis
          </button>

          <button 
            onClick={() => setIsAdding(true)}
            disabled={!hasAccess && !isPatient}
            className="px-5 py-2.5 bg-slate-900 hover:bg-black disabled:opacity-50 text-white rounded-xl flex items-center transition-all shadow-md font-bold text-xs"
          >
            <i className="fas fa-plus-circle mr-2 text-blue-400"></i> Issue Record
          </button>
        </div>
      </div>

      {!hasAccess ? (
        <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-20 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-lock text-3xl"></i>
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Access Restricted</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
            You do not have the required cryptographic endorsement to view records for <span className="font-bold text-slate-900">{selectedPatientId}</span>. 
            The patient must grant access via their Identity Wallet.
          </p>
          <div className="flex items-center justify-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <i className="fas fa-shield-check text-blue-500"></i>
            <span>Enforced by Smart Contract: AccessControl.go</span>
          </div>
        </div>
      ) : (
        <>
          {analysisResult && (
        <div className="bg-indigo-900 text-white rounded-[2rem] p-8 relative shadow-2xl border-b-8 border-indigo-600">
          <button onClick={() => setAnalysisResult(null)} className="absolute top-4 right-4 text-indigo-400 hover:text-white">
            <i className="fas fa-times-circle text-xl"></i>
          </button>
          <div className="flex items-start space-x-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/30 flex items-center justify-center text-white backdrop-blur-md">
              <i className="fas fa-sparkles text-2xl"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black uppercase tracking-widest mb-4">Gemini-3-Pro Insights</h3>
              <div className="prose prose-invert prose-sm max-w-none text-indigo-100 text-sm whitespace-pre-line leading-relaxed">
                {analysisResult}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex items-center space-x-6">
          <button onClick={() => setActiveTab('LEDGER')} className={`text-[10px] font-black uppercase tracking-[0.2em] pb-1 border-b-2 transition-all ${activeTab === 'LEDGER' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>On-Chain Transactions</button>
          <button onClick={() => setActiveTab('OFF_CHAIN')} className={`text-[10px] font-black uppercase tracking-[0.2em] pb-1 border-b-2 transition-all ${activeTab === 'OFF_CHAIN' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>IPFS Data Vault</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Metadata</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Data</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">IPFS CID / Proof</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-slate-300 font-black uppercase tracking-widest text-xs">No records committed to ledger</p>
                  </td>
                </tr>
              ) : (
                records.slice().reverse().map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="text-[11px] font-black text-slate-900">{new Date(record.timestamp).toLocaleDateString()}</div>
                      <div className="text-[9px] font-mono text-slate-400 mt-1 uppercase">TXID: {record.id.substring(0, 8)}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                        record.type === 'DIAGNOSIS' ? 'bg-blue-600 text-white' :
                        record.type === 'PRESCRIPTION' ? 'bg-indigo-600 text-white' :
                        'bg-slate-900 text-white'
                      }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {(() => {
                        const vaultData = chainState.ipfsVault?.[record.hash];
                        console.log(`Row Render: Hash=${record.hash}, FoundData=${!!vaultData}`);
                        return (
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed max-w-xs truncate">
                            {activeTab === 'LEDGER' ? record.data : (vaultData || 'Data Fetching...')}
                          </p>
                        );
                      })()}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <i className={`fab fa-hubspot ${activeTab === 'OFF_CHAIN' ? 'text-blue-600' : 'text-amber-500'}`}></i>
                          <span className="text-[10px] font-mono text-slate-400 truncate w-24">{record.hash || 'N/A'}</span>
                        </div>
                        {record.attachmentUrl && (
                          <button 
                            onClick={() => setViewingAttachment(record.attachmentUrl!)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View Attachment"
                          >
                            <i className="fas fa-file-medical text-[10px]"></i>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                        <i className="fas fa-check-circle mr-1.5"></i> Verifiable
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => setConfirmDeleteId(record.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete Record"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

  {isAdding && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-scaleIn">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Create Clinical Asset</h2>
                  <p className="text-xs text-slate-500 font-medium">New transaction proposal for Channel: main-ehr</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                  <i className="fas fa-times-circle text-2xl"></i>
                </button>
              </div>
              
              <form onSubmit={handleAddRecord} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Patient MSP ID</label>
                    <input 
                      required
                      disabled={isPatient}
                      type="text"
                      value={isPatient ? currentUser.id : (newRecord.patientId || selectedPatientId)}
                      onChange={e => setNewRecord({...newRecord, patientId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Record Category</label>
                    <select 
                      value={newRecord.type}
                      onChange={(e) => setNewRecord({...newRecord, type: e.target.value as HealthRecord['type']})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold outline-none"
                    >
                      <option value="DIAGNOSIS">Diagnosis</option>
                      <option value="PRESCRIPTION">Prescription</option>
                      <option value="LAB_RESULT">Lab Result</option>
                      <option value="VITAL_SIGNS">Vital Signs</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Findings (Encrypted Payload)</label>
                  <textarea 
                    required
                    value={newRecord.data}
                    onChange={(e) => setNewRecord({...newRecord, data: e.target.value})}
                    placeholder="Enter detailed clinical notes for off-chain IPFS storage..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-medium h-24 resize-none focus:ring-2 focus:ring-blue-100 outline-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Upload Medical Document (PDF/Image)</label>
                  <div className="relative group">
                    <input 
                      type="file"
                      onChange={(e) => setNewRecord({...newRecord, file: e.target.files?.[0] || null})}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 group-hover:border-blue-300 rounded-xl px-4 py-6 flex flex-col items-center justify-center transition-all">
                      <i className={`fas ${newRecord.file ? 'fa-file-check text-emerald-500' : 'fa-cloud-upload text-slate-300'} text-2xl mb-2`}></i>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {newRecord.file ? newRecord.file.name : 'Drag & drop or click to upload'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg">
                    <i className="fas fa-key"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-blue-700 font-black uppercase tracking-widest leading-none mb-1">ECDSA Endorsement</p>
                    <p className="text-[10px] text-slate-500 font-bold font-mono">Signing Identity: {currentUser.publicKey.substring(0, 20)}...</p>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg active:scale-95">
                  Propose & Commit to Ledger
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-100 animate-scaleIn">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 text-center mb-2 uppercase italic">Confirm Ledger Deletion</h3>
            <p className="text-slate-500 text-center text-sm font-medium mb-8 leading-relaxed">
              Are you sure you want to delete this record? This action will be permanently recorded as a "DELETE" transaction on the blockchain ledger for audit purposes.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all uppercase text-xs tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition-all uppercase text-xs tracking-widest"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingAttachment && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 md:p-12">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full h-full max-w-5xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Clinical Asset Viewer</h3>
              <button 
                onClick={() => setViewingAttachment(null)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="flex-1 bg-slate-50 p-4 md:p-8 overflow-auto flex items-center justify-center">
              <img 
                src={viewingAttachment} 
                alt="Medical Record" 
                className="max-w-full max-h-full rounded-xl shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
              <a 
                href={viewingAttachment} 
                download="medical-record"
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
              >
                Download Original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecords;
