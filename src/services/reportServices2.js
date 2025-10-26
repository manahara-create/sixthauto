import { supabase } from '../services/supabase';

class ReportService {
  // Generate Excel report
  static async generateEmployeeExcelReport(reportData) {
    const { employeeId, reportType, startDate, endDate } = reportData;
    
    // Fetch data based on report type
    let data = [];
    switch (reportType) {
      case 'attendance':
        data = await this.getAttendanceData(employeeId, startDate, endDate);
        break;
      case 'leaves':
        data = await this.getLeaveData(employeeId, startDate, endDate);
        break;
      case 'salary':
        data = await this.getSalaryData(employeeId, startDate, endDate);
        break;
      case 'performance':
        data = await this.getPerformanceData(employeeId, startDate, endDate);
        break;
      case 'training':
        data = await this.getTrainingData(employeeId, startDate, endDate);
        break;
      case 'documents':
        data = await this.getDocumentData(employeeId, startDate, endDate);
        break;
    }

    // Generate Excel file
    return this.generateExcelFile(data, reportType);
  }

  // Generate Word report
  static async generateEmployeeWordReport(reportData) {
    const { employeeId, reportType, startDate, endDate } = reportData;
    
    // Fetch data based on report type
    let data = [];
    switch (reportType) {
      case 'attendance':
        data = await this.getAttendanceData(employeeId, startDate, endDate);
        break;
      case 'leaves':
        data = await this.getLeaveData(employeeId, startDate, endDate);
        break;
      case 'salary':
        data = await this.getSalaryData(employeeId, startDate, endDate);
        break;
      case 'performance':
        data = await this.getPerformanceData(employeeId, startDate, endDate);
        break;
      case 'training':
        data = await this.getTrainingData(employeeId, startDate, endDate);
        break;
      case 'documents':
        data = await this.getDocumentData(employeeId, startDate, endDate);
        break;
    }

    // Generate Word file
    return this.generateWordFile(data, reportType);
  }

  // Data fetching methods
  static async getAttendanceData(employeeId, startDate, endDate) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('empid', employeeId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getLeaveData(employeeId, startDate, endDate) {
    const { data, error } = await supabase
      .from('employeeleave')
      .select('*')
      .eq('empid', employeeId)
      .gte('leavefromdate', startDate)
      .lte('leavetodate', endDate)
      .order('leavefromdate', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getSalaryData(employeeId, startDate, endDate) {
    const { data, error } = await supabase
      .from('salary')
      .select('*')
      .eq('empid', employeeId)
      .gte('salarydate', startDate)
      .lte('salarydate', endDate)
      .order('salarydate', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getPerformanceData(employeeId, startDate, endDate) {
    const { data, error } = await supabase
      .from('performance_rating')
      .select('*')
      .eq('empid', employeeId)
      .gte('rating_date', startDate)
      .lte('rating_date', endDate)
      .order('rating_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getTrainingData(employeeId, startDate, endDate) {
    const { data, error } = await supabase
      .from('training_participants')
      .select(`
        *,
        training:trainingid (*)
      `)
      .eq('empid', employeeId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getDocumentData(employeeId, startDate, endDate) {
    const { data, error } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('empid', employeeId)
      .gte('uploaded_at', startDate)
      .lte('uploaded_at', endDate)
      .order('uploaded_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Generate Excel file (simplified - you'll need to implement proper Excel generation)
  static generateExcelFile(data, reportType) {
    // This is a simplified version. You'll need to use a library like xlsx
    // For now, return a mock blob
    const csvContent = this.convertToCSV(data);
    return new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Generate Word file (simplified - you'll need to implement proper Word generation)
  static generateWordFile(data, reportType) {
    // This is a simplified version. You'll need to use a library like docx
    // For now, return a mock blob
    const textContent = this.convertToText(data);
    return new Blob([textContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  static convertToCSV(data) {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  static convertToText(data) {
    if (!data.length) return 'No data available';
    
    let text = 'Report Data\n\n';
    data.forEach((item, index) => {
      text += `Record ${index + 1}:\n`;
      Object.entries(item).forEach(([key, value]) => {
        text += `${key}: ${value}\n`;
      });
      text += '\n';
    });
    
    return text;
  }
}

export default ReportService;