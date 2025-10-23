import { supabase } from './supabase';

class FileService {
  static async listEmployeeFiles(empid) {
    const { data, error } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('empid', empid)
      .order('uploaded_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async uploadEmployeeDocument(file, empid, documentType, documentName) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${empid}_${Date.now()}.${fileExt}`;
    const filePath = `employee-documents/${empid}/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('employee-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('employee-documents')
      .getPublicUrl(filePath);

    // Save document record to database
    const { data, error } = await supabase
      .from('employee_documents')
      .insert([{
        empid: empid,
        document_name: documentName,
        document_type: documentType,
        file_path: publicUrl,
        file_size: file.size,
        uploaded_by: empid
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteEmployeeDocument(documentId, empid) {
    // First get the document to find file path
    const { data: document, error: fetchError } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('id', documentId)
      .eq('empid', empid)
      .single();

    if (fetchError) throw fetchError;

    // Extract file path from URL for storage deletion
    const filePath = document.file_path.split('/').pop();
    const fullPath = `employee-documents/${empid}/${filePath}`;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('employee-documents')
      .remove([fullPath]);

    if (storageError) throw storageError;

    // Delete from database
    const { error } = await supabase
      .from('employee_documents')
      .delete()
      .eq('id', documentId)
      .eq('empid', empid);

    if (error) throw error;
    return { success: true };
  }
}

export default FileService;