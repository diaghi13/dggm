import { apiClient } from "./client";

function getGlobalAuthHeader(): Record<string, string> {
  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const token: string | undefined = parsed?.state?.globalToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export interface BackupFile {
  filename: string;
  path: string;
  size_bytes: number;
  size_mb: number;
  created_at: string;
}

export interface TenantBackupInfo {
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  backup_count: number;
  last_backup_at: string | null;
  total_size_mb: number;
  status: "healthy" | "warning" | "missing";
}

export interface BackupStatus {
  central: {
    status: "healthy" | "warning" | "critical" | "no_backup";
    backup_count: number;
    last_backup_at: string | null;
    total_size_mb: number;
    backups: BackupFile[];
  };
  tenants: {
    summary: {
      total_tenants: number;
      tenants_with_backup: number;
      tenants_missing: number;
      last_backup_at: string | null;
      total_size_mb: number;
    };
    pre_deletion_count: number;
    per_tenant: TenantBackupInfo[];
  };
}

export const backupApi = {
  getStatus: async (): Promise<BackupStatus> => {
    const response = await apiClient.get<{ success: boolean; data: BackupStatus }>(
      "/landlord/backup/status",
      { headers: getGlobalAuthHeader() }
    );
    return response.data.data;
  },

  runBackup: async (type: "central" | "tenants" | "all"): Promise<void> => {
    await apiClient.post(
      "/landlord/backup/run",
      { type },
      { headers: getGlobalAuthHeader() }
    );
  },
};
