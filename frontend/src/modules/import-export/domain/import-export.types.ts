export interface ExportData {
  sellers: unknown[];
  users: unknown[];
  clients: unknown[];
  contacts: unknown[];
  deals: unknown[];
  tasks: unknown[];
  activities: unknown[];
  sales: unknown[];
  settings: unknown[];
}

export interface ImportResult {
  success: boolean;
  message: string;
  counts?: Record<string, number>;
}
