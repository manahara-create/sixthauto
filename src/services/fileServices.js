import { supabase } from './supabase';

export class FileService {
  static async uploadFile(file, folder = 'documents') {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('user_details')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user_details')
        .getPublicUrl(filePath);

      return {
        success: true,
        filePath,
        publicUrl,
        fileName: file.name
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async uploadAvatar(file, employeeId) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${employeeId}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data, error } = await supabase.storage
        .from('user_details')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user_details')
        .getPublicUrl(filePath);

      return {
        success: true,
        filePath,
        publicUrl
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from('user_details')
        .remove([filePath]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
  }

  static async getFileUrl(filePath) {
    try {
      const { data: { publicUrl } } = supabase.storage
        .from('user_details')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  }
}

export default FileService;