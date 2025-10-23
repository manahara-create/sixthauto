// src/services/databaseService.js
import { supabase } from './supabase';

export class DatabaseService {
  // Employee Operations
  static async getEmployees(filters = {}) {
    let query = supabase
      .from('employee')
      .select('*')
      .eq('is_active', true);

    if (filters.department) {
      query = query.eq('department', filters.department);
    }
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    if (filters.managerId) {
      query = query.eq('managerid', filters.managerId);
    }

    const { data, error } = await query.order('first_name');
    
    if (error) throw error;
    return data || [];
  }

  static async getEmployeeById(employeeId) {
    const { data, error } = await supabase
      .from('employee')
      .select('*')
      .eq('empid', employeeId)
      .single();

    if (error) throw error;
    return data;
  }

  static async createEmployee(employeeData) {
    const { data, error } = await supabase
      .from('employee')
      .insert([employeeData])
      .select();

    if (error) throw error;
    return data[0];
  }

  static async updateEmployee(employeeId, updates) {
    const { data, error } = await supabase
      .from('employee')
      .update(updates)
      .eq('empid', employeeId)
      .select();

    if (error) throw error;
    return data[0];
  }

  static async deactivateEmployee(employeeId) {
    return this.updateEmployee(employeeId, { is_active: false, status: 'Inactive' });
  }

  // Leave Management
  static async getLeaves(filters = {}) {
    let query = supabase
      .from('employeeleave')
      .select(`
        *,
        employee:empid (first_name, last_name, department, email),
        leavetype:leavetypeid (leavetype)
      `);

    if (filters.employeeId) {
      query = query.eq('empid', filters.employeeId);
    }
    if (filters.status) {
      query = query.eq('leavestatus', filters.status);
    }
    if (filters.startDate && filters.endDate) {
      query = query.gte('leavefromdate', filters.startDate).lte('leavetodate', filters.endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async applyLeave(leaveData) {
    const { data, error } = await supabase
      .from('employeeleave')
      .insert([leaveData])
      .select();

    if (error) throw error;
    return data[0];
  }

  static async updateLeaveStatus(leaveId, status, approvedBy = null) {
    const updates = { leavestatus: status };
    if (approvedBy) updates.approvedby = approvedBy;

    const { data, error } = await supabase
      .from('employeeleave')
      .update(updates)
      .eq('leaveid', leaveId)
      .select();

    if (error) throw error;
    return data[0];
  }

  // Attendance Management
  static async getAttendance(filters = {}) {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        employee:empid (first_name, last_name, department)
      `);

    if (filters.employeeId) {
      query = query.eq('empid', filters.employeeId);
    }
    if (filters.date) {
      query = query.eq('date', filters.date);
    }
    if (filters.startDate && filters.endDate) {
      query = query.gte('date', filters.startDate).lte('date', filters.endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async punchIn(employeeId, punchData) {
    const { data, error } = await supabase
      .from('attendance')
      .insert([{
        empid: employeeId,
        date: new Date().toISOString().split('T')[0],
        intime: new Date().toTimeString().split(' ')[0],
        status: 'Present',
        ...punchData
      }])
      .select();

    if (error) throw error;
    return data[0];
  }

  static async punchOut(attendanceId, outTime) {
    const { data, error } = await supabase
      .from('attendance')
      .update({ outtime: outTime })
      .eq('attendanceid', attendanceId)
      .select();

    if (error) throw error;
    return data[0];
  }

  // Salary Management
  static async getSalaries(filters = {}) {
    let query = supabase
      .from('salary')
      .select(`
        *,
        employee:empid (first_name, last_name, department),
        processed_by_employee:processed_by (first_name, last_name)
      `);

    if (filters.employeeId) {
      query = query.eq('empid', filters.employeeId);
    }
    if (filters.month) {
      query = query.gte('salarydate', `${filters.month}-01`).lte('salarydate', `${filters.month}-31`);
    }

    const { data, error } = await query.order('salarydate', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async processSalary(salaryData) {
    const { data, error } = await supabase
      .from('salary')
      .insert([salaryData])
      .select();

    if (error) throw error;
    return data[0];
  }

  // KPI Management
  static async getKPIs(filters = {}) {
    let query = supabase
      .from('kpi')
      .select(`
        *,
        employee:empid (first_name, last_name, department),
        kpiranking:kpirankingid (kpirank)
      `);

    if (filters.employeeId) {
      query = query.eq('empid', filters.employeeId);
    }

    const { data, error } = await query.order('calculatedate', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async addKPI(kpiData) {
    const { data, error } = await supabase
      .from('kpi')
      .insert([kpiData])
      .select();

    if (error) throw error;
    return data[0];
  }

  // File Upload
  static async uploadFile(file, bucket = 'documents', folder = '') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { filePath, publicUrl, fileName: file.name };
  }

  // Report Generation Data
  static async getReportData(reportType, filters = {}) {
    switch (reportType) {
      case 'salary':
        return this.getSalaries(filters);
      case 'attendance':
        return this.getAttendance(filters);
      case 'leave':
        return this.getLeaves(filters);
      case 'kpi':
        return this.getKPIs(filters);
      case 'employee':
        return this.getEmployees(filters);
      default:
        throw new Error('Unknown report type');
    }
  }
}

export default DatabaseService;