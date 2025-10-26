import { supabase } from '../services/supabase';

class FileService {
  // Upload employee document
  static async uploadEmployeeDocument(file, employeeId, documentType, documentName) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${employeeId}_${Date.now()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('employee-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Create document record
    const { error: dbError } = await supabase
      .from('employee_documents')
      .insert({
        empid: employeeId,
        document_name: documentName,
        document_type: documentType,
        file_path: filePath,
        file_size: file.size,
        is_verified: false
      });

    if (dbError) throw dbError;
  }

  // List employee files
  static async listEmployeeFiles(employeeId) {
    const { data, error } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('empid', employeeId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Delete employee document
  static async deleteEmployeeDocument(documentId, employeeId) {
    // Get file path first
    const { data: document, error: fetchError } = await supabase
      .from('employee_documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('empid', employeeId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('employee-documents')
      .remove([document.file_path]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('employee_documents')
      .delete()
      .eq('id', documentId)
      .eq('empid', employeeId);

    if (dbError) throw dbError;
  }

  // Get download URL for document
  static async getDocumentDownloadUrl(filePath) {
    const { data, error } = await supabase.storage
      .from('employee-documents')
      .createSignedUrl(filePath, 60); // 60 seconds expiry

    if (error) throw error;
    return data.signedUrl;
  }
}

export default FileService;