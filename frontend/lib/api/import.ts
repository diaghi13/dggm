import { apiClient } from './client';

export interface ImportField {
  key: string;
  label: string;
  required: boolean;
  type: string;
  description: string;
  validation: string;
  options?: string[];
  example: string;
}

export interface ImportModel {
  key: string;
  label: string;
  fields_count: number;
}

export const importApi = {
  getAvailableModels: async () => {
    const response = await apiClient.get('/import/models');
    return response.data.data as ImportModel[];
  },

  getImportableFields: async (model: string) => {
    const response = await apiClient.get(`/import/${model}/fields`);
    return response.data.data as {
      model: string;
      fields: ImportField[];
    };
  },
};