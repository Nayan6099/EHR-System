
import React, { useState } from 'react';
import { Block } from '../types';

interface BlockchainVisualizerProps {
  chain: Block[];
}

const BlockchainVisualizer: React.FC<BlockchainVisualizerProps> = ({ chain }) => {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ledger Explorer</h1>
        <p className="text-slate-500">Real-time view of the blockchain structure and block integrity</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <div className="flex flex-col space-y-6">
            {chain.slice().reverse().map((block) => (
              <div 
                key={block.blockNumber} 
                onClick={() => setSelectedBlock(block)}
                className={`group cursor-pointer bg-white border-2 rounded-2xl p-6 transition-all transform hover:scale-[1.01] ${
                  selectedBlock?.blockNumber === block.blockNumber 
                    ? 'border-blue-500 ring-4 ring-blue-50 shadow-lg' 
                    : 'border-slate-100 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                      #{block.blockNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Block Verified</h4>
                      <p className="text-xs text-slate-500">{new Date(block.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                    <span>Hash: {block.currentHash.substring(0, 16)}...</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Previous Hash</p>
                    <p className="text-xs font-mono text-slate-600 truncate">{block.previousHash}</p>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-xl">
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">Transactions</p>
                    <p className="text-xs font-semibold text-blue-700">{block.transactions.length} record(s) included</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-1">
          {selectedBlock ? (
            <div className="bg-slate-900 text-white rounded-2xl p-6 sticky top-24 shadow-2xl">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <i className="fas fa-search-plus mr-3 text-blue-400"></i>
                Block Data Detail
              </h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Transaction ID</p>
                  <p className="text-sm font-mono text-blue-300 break-all">{selectedBlock.transactions[0].txId}</p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Endorser (MSP)</p>
                  <p className="text-sm text-slate-100">{selectedBlock.transactions[0].creator}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Signature</p>
                  <p className="text-xs font-mono text-emerald-400 break-all">{selectedBlock.transactions[0].signature}</p>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-3">Health Record Payload</p>
                  <div className="bg-slate-800 rounded-lg p-4 font-mono text-[11px] overflow-x-auto">
                    <pre>{JSON.stringify(selectedBlock.transactions[0].payload, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 sticky top-24">
              <i className="fas fa-mouse-pointer text-4xl mb-4 opacity-20"></i>
              <p className="text-sm font-medium">Select a block to inspect its cryptographic proof and payload</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockchainVisualizer;
