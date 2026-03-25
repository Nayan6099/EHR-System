
export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  organization: string; // MSP (Membership Service Provider) ID
  publicKey: string;
  password?: string; // Optional for backward compatibility but required for new users
}

export interface HealthRecord {
  id: string;
  patientId: string;
  doctorId: string;
  timestamp: number;
  type: 'DIAGNOSIS' | 'PRESCRIPTION' | 'LAB_RESULT' | 'VITAL_SIGNS';
  data: string;
  attachmentUrl?: string;
  hash: string;
}

export interface Transaction {
  txId: string;
  creator: string;
  timestamp: number;
  payload: any; // Allow different transaction types (HealthRecord, AccessGrant, etc.)
  signature: string;
}

export interface Block {
  blockNumber: number;
  previousHash: string;
  currentHash: string;
  transactions: Transaction[];
  timestamp: number;
}

export interface AccessGrant {
  patientId: string;
  doctorId: string;
  grantedAt: number;
}

export interface BlockchainState {
  chain: Block[];
  pendingTransactions: Transaction[];
  worldState: { [patientId: string]: HealthRecord[] };
  accessGrants: AccessGrant[];
  ipfsVault: { [hash: string]: string };
}

export type ViewType = 'DASHBOARD' | 'RECORDS' | 'EXPLORER' | 'IDENTITY' | 'REPORT';
