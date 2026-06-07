export interface ExportData {
  sellers: any[];
  users: any[];
  clients: any[];
  contacts: any[];
  deals: any[];
  tasks: any[];
  activities: any[];
  sales: any[];
  settings: any[];
}

export interface ImportResult {
  success: boolean;
  message: string;
  counts?: Record<string, number>;
}
