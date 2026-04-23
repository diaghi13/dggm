import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';
import type {
  RentalReturnInspection,
  RentalReturnInspectionItem,
  CompleteInspectionItemInput,
} from '@/lib/types';

export const inspectionsApi = {
  start: async (ddtId: number): Promise<RentalReturnInspection> => {
    const response = await apiClient.post<ApiResponse<RentalReturnInspection>>(
      `/ddts/${ddtId}/inspection`
    );
    return response.data.data;
  },

  getByDdt: async (ddtId: number): Promise<RentalReturnInspection> => {
    const response = await apiClient.get<ApiResponse<RentalReturnInspection>>(
      `/ddts/${ddtId}/inspection`
    );
    return response.data.data;
  },

  completeItem: async (
    itemId: number,
    data: CompleteInspectionItemInput
  ): Promise<RentalReturnInspectionItem> => {
    const response = await apiClient.patch<ApiResponse<RentalReturnInspectionItem>>(
      `/inspection-items/${itemId}`,
      data
    );
    return response.data.data;
  },

  finalize: async (inspectionId: number): Promise<RentalReturnInspection> => {
    const response = await apiClient.post<ApiResponse<RentalReturnInspection>>(
      `/inspections/${inspectionId}/finalize`
    );
    return response.data.data;
  },

  getPending: async (): Promise<RentalReturnInspection[]> => {
    const response = await apiClient.get<ApiResponse<RentalReturnInspection[]>>(
      `/inspections/pending`
    );
    return response.data.data;
  },
};
