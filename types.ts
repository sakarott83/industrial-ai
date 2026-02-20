
export type EnergyCategory = 'LOW' | 'HIGH';
export type ApiProvider = 'gemini' | 'cerebras';

export interface ApiConfig {
  provider: ApiProvider;
  apiKey: string;
}

export const EnergyCategoryValues = {
  LOW: 'LOW' as EnergyCategory,
  HIGH: 'HIGH' as EnergyCategory
};

export interface Company {
  id: string;
  name: string;
  vatNumber?: string;
  address: string;
  city: string;
  province: string;
  industry: string;
  estimatedConsumptionGWh: number;
  category: EnergyCategory;
  website?: string;
  phone?: string;
  email?: string;
}

export interface SearchFilters {
  province: string;
  city: string;
  industry?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
