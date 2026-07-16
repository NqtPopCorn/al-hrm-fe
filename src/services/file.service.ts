import { api } from '../lib/api';

export const FileService = {
  async upload(file: File, options: { fileType: string; isPrivate: boolean }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', options.fileType);
    formData.append('isPrivate', options.isPrivate.toString());

    const response = await api.post<{ message: string; file: any }>('/files/upload', formData);
    return response; // { message, file }
  },
};
