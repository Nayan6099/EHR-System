
import { Block, Transaction, HealthRecord, BlockchainState, User, AccessGrant } from '../types';

class BlockchainService {
  private state: BlockchainState;
  private readonly STORAGE_KEY = 'healthledger_blockchain_state';

  constructor() {
    const savedState = this.loadFromLocalStorage();
    this.state = savedState || this.initializeGenesis();
    console.log('BlockchainService Initialized. Vault keys:', Object.keys(this.state.ipfsVault || {}));
  }

  private loadFromLocalStorage(): BlockchainState | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      // Migration: Ensure ipfsVault exists for older saved states
      if (!parsed.ipfsVault) {
        parsed.ipfsVault = {};
      }
      console.log('Blockchain: Loaded state from storage. Vault keys:', Object.keys(parsed.ipfsVault));
      return parsed;
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
      return null;
    }
  }

  private persist() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }

  private initializeGenesis(): BlockchainState {
    const genesisRecord: HealthRecord = {
      id: '0',
      patientId: 'SYSTEM',
      doctorId: 'SYSTEM',
      timestamp: Date.now(),
      type: 'DIAGNOSIS',
      data: 'Genesis Block - Network Initialization',
      hash: '0'
    };

    const genesisTx: Transaction = {
      txId: 'tx_0',
      creator: 'NetworkAdmin',
      timestamp: Date.now(),
      payload: genesisRecord,
      signature: 'SIG_GENESIS'
    };

    const genesisBlock: Block = {
      blockNumber: 0,
      previousHash: '0',
      currentHash: this.calculateHash('0' + JSON.stringify(genesisTx)),
      transactions: [genesisTx],
      timestamp: Date.now()
    };

    return {
      chain: [genesisBlock],
      pendingTransactions: [],
      worldState: {
        'SYSTEM': [genesisRecord],
        'PATIENT_001': [
          {
            id: 'REC_INIT_1',
            patientId: 'PATIENT_001',
            doctorId: 'DOC_MITCHELL',
            timestamp: Date.now() - 86400000,
            type: 'DIAGNOSIS',
            data: '[DATA ANCHORED TO IPFS: QmXoyp...]',
            hash: 'QmXoyp'
          }
        ],
        'mukul': [
          {
            id: 'REC_MUKUL_1',
            patientId: 'mukul',
            doctorId: 'DOC_MITCHELL',
            timestamp: Date.now() - 43200000,
            type: 'VITAL_SIGNS',
            data: '[DATA ANCHORED TO IPFS: QmZk8s...]',
            hash: 'QmZk8s'
          }
        ]
      },
      accessGrants: [
        { patientId: 'PATIENT_001', doctorId: 'DOC_MITCHELL', grantedAt: Date.now() },
        { patientId: 'mukul', doctorId: 'DOC_MITCHELL', grantedAt: Date.now() }
      ],
      ipfsVault: {
        'QmXoyp': 'Patient shows signs of early recovery. Vital signs are stable.',
        'QmZk8s': 'Prescribed 500mg Amoxicillin, twice daily for 7 days.',
        'QmGENESIS': 'Genesis Block: HealthLedger Network Initialized'
      }
    };
  }

  public async addToIpfs(data: string): Promise<string> {
    const hash = 'Qm' + Math.random().toString(36).substr(2, 44);
    console.log(`IPFS: Adding data to vault. Hash: ${hash}, Data: ${data}`);
    this.state = {
      ...this.state,
      ipfsVault: { ...this.state.ipfsVault, [hash]: data }
    };
    this.persist();
    return hash;
  }

  private calculateHash(data: string): string {
    // Simple mock hash for demonstration
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }

  public async submitTransaction(record: HealthRecord, user: User): Promise<Transaction> {
    console.log(`Submitting transaction for patient: ${record.patientId} by doctor: ${user.id}`);
    const txId = `tx_${Math.random().toString(36).substr(2, 9)}`;
    const tx: Transaction = {
      txId,
      creator: `${user.organization}:${user.name}`,
      timestamp: Date.now(),
      payload: record,
      signature: `SIG_${txId}`
    };

    this.state = {
      ...this.state,
      pendingTransactions: [...this.state.pendingTransactions, tx]
    };
    
    // In Fabric, endorsement/committing happens. We simulate a block every 1 transaction for immediate feedback.
    this.commitBlock();
    
    return tx;
  }

  private commitBlock() {
    if (this.state.pendingTransactions.length === 0) return;

    const lastBlock = this.state.chain[this.state.chain.length - 1];
    const newBlock: Block = {
      blockNumber: lastBlock.blockNumber + 1,
      previousHash: lastBlock.currentHash,
      transactions: [...this.state.pendingTransactions],
      timestamp: Date.now(),
      currentHash: ''
    };

    newBlock.currentHash = this.calculateHash(newBlock.previousHash + JSON.stringify(newBlock.transactions));
    
    // Update World State immutably
    const newWorldState = { ...this.state.worldState };
    newBlock.transactions.forEach(tx => {
      const pId = tx.payload.patientId;
      console.log(`Blockchain: Committing record for patient ${pId}. Hash: ${tx.payload.hash}`);
      if (!newWorldState[pId]) {
        newWorldState[pId] = [];
      }
      newWorldState[pId] = [...newWorldState[pId], tx.payload];
    });

    this.state = {
      ...this.state,
      chain: [...this.state.chain, newBlock],
      worldState: newWorldState,
      pendingTransactions: []
    };
    
    this.persist();
    console.log(`Block #${newBlock.blockNumber} committed. World state updated.`);
  }

  public async deleteRecord(recordId: string, patientId: string, requester: User) {
    console.log(`Attempting to delete record ${recordId} for patient ${patientId} by ${requester.id}`);
    
    // 1. Permission Check
    const isOwner = requester.role === 'PATIENT' && requester.id === patientId;
    const isGrantedDoctor = requester.role === 'DOCTOR' && this.hasAccess(patientId, requester.id);
    const isAdmin = requester.role === 'ADMIN';

    if (!isOwner && !isGrantedDoctor && !isAdmin) {
      throw new Error('Insufficient permissions to delete this record.');
    }

    // 2. Find the record in World State
    const patientRecords = this.state.worldState[patientId] || [];
    const recordToDelete = patientRecords.find(r => r.id === recordId);
    
    if (!recordToDelete) {
      throw new Error('Record not found in the world state.');
    }

    // 3. Create Deletion Transaction
    const txId = `TX_DELETE_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const tx: Transaction = {
      txId,
      creator: `${requester.organization}:${requester.name}`,
      timestamp: Date.now(),
      payload: { action: 'DELETE', recordId, patientId },
      signature: `SIG_DEL_${txId}`
    };

    // 4. Commit Deletion to Ledger
    const lastBlock = this.state.chain[this.state.chain.length - 1];
    const newBlock: Block = {
      blockNumber: lastBlock.blockNumber + 1,
      previousHash: lastBlock.currentHash,
      transactions: [tx],
      timestamp: Date.now(),
      currentHash: ''
    };
    newBlock.currentHash = this.calculateHash(newBlock.previousHash + JSON.stringify(newBlock.transactions));

    // 5. Update World State (Remove the record)
    const newWorldState = { ...this.state.worldState };
    newWorldState[patientId] = newWorldState[patientId].filter(r => r.id !== recordId);

    this.state = {
      ...this.state,
      chain: [...this.state.chain, newBlock],
      worldState: newWorldState
    };

    this.persist();
    console.log(`Record ${recordId} deleted. Audit trail added to Block #${newBlock.blockNumber}`);
  }

  public getState(): BlockchainState {
    return { ...this.state };
  }

  public getPatientRecords(patientId: string, requester: User): HealthRecord[] {
    console.log(`Retrieving records for patient: ${patientId} requested by: ${requester.id}`);
    // Patients can always see their own records
    if (requester.role === 'PATIENT' && requester.id === patientId) {
      return this.state.worldState[patientId] || [];
    }

    // Doctors must have an access grant
    if (requester.role === 'DOCTOR') {
      const hasAccess = this.state.accessGrants.some(
        g => g.patientId === patientId && g.doctorId === requester.id
      );
      if (hasAccess) {
        return this.state.worldState[patientId] || [];
      }
    }

    // Admins can see everything (simulating network admin)
    if (requester.role === 'ADMIN') {
      return this.state.worldState[patientId] || [];
    }

    return [];
  }

  public hasAccess(patientId: string, doctorId: string): boolean {
    return this.state.accessGrants.some(
      g => g.patientId === patientId && g.doctorId === doctorId
    );
  }

  public async grantAccess(patientId: string, doctorId: string) {
    if (!this.hasAccess(patientId, doctorId)) {
      const grant: AccessGrant = {
        patientId,
        doctorId,
        grantedAt: Date.now()
      };
      this.state.accessGrants.push(grant);

      // Simulate transaction on ledger
      const lastBlock = this.state.chain[this.state.chain.length - 1];
      const block: Block = {
        blockNumber: lastBlock.blockNumber + 1,
        timestamp: Date.now(),
        transactions: [{
          txId: `TX_GRANT_${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          payload: grant,
          signature: 'sig_access_grant',
          creator: patientId,
          timestamp: Date.now()
        }],
        previousHash: lastBlock.currentHash,
        currentHash: ''
      };
      block.currentHash = this.calculateHash(block.previousHash + JSON.stringify(block.transactions));
      this.state.chain.push(block);
      this.persist();
    }
  }

  public async revokeAccess(patientId: string, doctorId: string) {
    this.state.accessGrants = this.state.accessGrants.filter(
      g => !(g.patientId === patientId && g.doctorId === doctorId)
    );

    // Simulate transaction on ledger
    const lastBlock = this.state.chain[this.state.chain.length - 1];
    const block: Block = {
      blockNumber: lastBlock.blockNumber + 1,
      timestamp: Date.now(),
      transactions: [{
        txId: `TX_REVOKE_${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        payload: { patientId, doctorId, action: 'REVOKE' },
        signature: 'sig_access_revoke',
        creator: patientId,
        timestamp: Date.now()
      }],
      previousHash: lastBlock.currentHash,
      currentHash: ''
    };
    block.currentHash = this.calculateHash(block.previousHash + JSON.stringify(block.transactions));
    this.state.chain.push(block);
    this.persist();
  }
}

export const blockchainService = new BlockchainService();
