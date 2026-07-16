import { api } from '../lib/api';

export const ContractService = {
  async getAll(): Promise<any[]> {
    return api.get<any[]>('/contracts');
  },

  async getById(id: string): Promise<any> {
    return api.get<any>(`/contracts/${id}`); // { contract, signedUrl }
  },

  async create(contractData: any): Promise<any> {
    return api.post<any>('/contracts', contractData);
  },

  async update(id: string, updateData: any): Promise<any> {
    return api.put<any>(`/contracts/${id}`, updateData);
  },

  async delete(id: string): Promise<any> {
    return api.delete<any>(`/contracts/${id}`);
  },
};
