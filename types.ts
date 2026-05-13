
export type SourceKey = 'spreadsheet' | 'spreadsheet_cards' | 'spreadsheet_banks' | 'apps_script' | 'manual';

export interface SourceConfig {
  id: SourceKey;
  label: string;
  icon: string;
  url: string; /* PODE SER O WEBHOOK OU LINK DA PLANILHA */
  lastSynced?: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  account: string; /* e.g., Nubank, Inter */
  typeTag: string; /* e.g., Pix, Cartão Crédito */
  type: 'income' | 'expense';
  source: SourceKey;
  paymentDate?: string; // Effective date for credit cards
}

export interface CardConfig {
  name: string; // e.g. "Cartão Nubank"
  closingDay: number;
  dueDay: number;
}


export interface AIInsights {
  summary: string;
  topCategories: { category: string; total: number }[];
  savingTips: string[];
  anomalies: string[];
}

export enum AppState {
  EMPTY = 'EMPTY',
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface MonthData {
  monthId: string; // Ex: "2024-03"
  sources: Record<SourceKey, string>;
}
