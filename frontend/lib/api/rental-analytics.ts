import apiClient from './client';
import { ApiResponse } from '@/lib/types';

export interface BreakEvenItem {
  product_id: number;
  name: string;
  code: string;
  total_rented_days: number;
  break_even_days: number;
  progress: number;
  remaining_days: number;
}

export interface BuyVsRentItem {
  product_id: number;
  name: string;
  code: string;
  annual_subrental_cost: number;
  estimated_purchase_price: number;
  ratio: number;
  traffic_light: 'green' | 'yellow' | 'red';
}

export interface AssetRoiItem {
  product_id: number;
  name: string;
  code: string;
  total_revenue: number;
  rental_count: number;
  total_days: number;
  avg_duration: number;
  revenue_per_day: number;
}

export interface UnderperformerItem {
  product_id: number;
  name: string;
  code: string;
  last_rental_date: string | null;
  days_since_rental: number | null;
}

export interface ScarcityItem {
  product_id: number;
  name: string;
  code: string;
  total_stock: number;
  available_stock: number;
  quantity_out_on_rental: number;
  availability_ratio: number;
  is_scarce: boolean;
  scarcity_multiplier: number;
}

export interface RentalKpiData {
  break_even_tracker: BreakEvenItem[];
  buy_vs_rent: BuyVsRentItem[];
  asset_roi: AssetRoiItem[];
  underperformers: UnderperformerItem[];
  scarcity_monitor: ScarcityItem[];
}

export const rentalAnalyticsApi = {
  getKpi: async (): Promise<RentalKpiData> => {
    const { data } = await apiClient.get<ApiResponse<RentalKpiData>>('/rental-analytics');
    return data.data;
  },
};
