import { supabase } from '../lib/supabaseClient';

class DatabaseService {
  // Employee related methods
  static async getEmployeeProfile(employeeId) {
    const { data, error } = await supabase
      .from('employee')
      .select('*')
      .eq('empid', employeeId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateEmployeeProfile(employeeId, updates) {
    const { data, error } = await supabase
      .from('employee')
      .update(updates)
      .eq('empid', employeeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAllEmployees() {
    const { data, error } = await supabase
      .from('employee')
      .select('*')
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;
    return data;
  }

  static async getEmployees({ managerId }) {
    const { data, error } = await supabase
      .from('employee')
      .select('*')
      .eq('managerid', managerId)
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;
    return data;
  }

  // Task related methods
  static async getTasks(employeeId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assignee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Leave related methods
  static async getLeaves({ employeeId }) {
    const { data, error } = await supabase
      .from('employeeleave')
      .select('*')
      .eq('empid', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async applyLeave(leaveData) {
    const { data, error } = await supabase
      .from('employeeleave')
      .insert(leaveData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getLeaveBalance(employeeId) {
    const { data, error } = await supabase
      .from('leavebalance')
      .select('*')
      .eq('empid', employeeId)
      .single();

    if (error) throw error;
    return data;
  }

  // Attendance related methods
  static async getAttendance({ employeeId, month }) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('empid', employeeId)
      .gte('date', `${month}-01`)
      .lte('date', `${month}-31`)
      .order('date', { ascending: true });

    if (error) throw error;
    
    // Calculate summary
    const presentDays = data.filter(record => record.status === 'present').length;
    const absentDays = data.filter(record => record.status === 'absent').length;
    const todayRecord = data.find(record => 
      new Date(record.date).toDateString() === new Date().toDateString()
    );

    return {
      records: data,
      presentDays,
      absentDays,
      todayRecord
    };
  }

  static async markAttendance(attendanceData) {
    const { data, error } = await supabase
      .from('attendance')
      .insert(attendanceData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateAttendance(attendanceId, updates) {
    const { data, error } = await supabase
      .from('attendance')
      .update(updates)
      .eq('attendanceid', attendanceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Salary related methods
  static async getSalaries({ employeeId, month }) {
    const { data, error } = await supabase
      .from('salary')
      .select('*')
      .eq('empid', employeeId)
      .gte('salarydate', `${month}-01`)
      .lte('salarydate', `${month}-31`)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data || {};
  }

  // Loan related methods
  static async getLoans({ employeeId }) {
    const { data, error } = await supabase
      .from('loanrequest')
      .select('*')
      .eq('empid', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async applyLoan(loanData) {
    const { data, error } = await supabase
      .from('loanrequest')
      .insert(loanData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Training related methods
  static async getTrainingRequests({ employeeId }) {
    const { data, error } = await supabase
      .from('training')
      .select('*')
      .eq('empid', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async requestTraining(trainingData) {
    const { data, error } = await supabase
      .from('training')
      .insert(trainingData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // EPF/ETF related methods
  static async getEpfEtfRequests({ employeeId }) {
    const { data, error } = await supabase
      .from('epfnetf')
      .select('*')
      .eq('empid', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async applyEpfEtf(epfData) {
    const { data, error } = await supabase
      .from('epfnetf')
      .insert(epfData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Promotion related methods
  static async getPromotions(employeeId) {
    const { data, error } = await supabase
      .from('promotion_history')
      .select('*')
      .eq('empid', employeeId)
      .order('promotion_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Feedback related methods
  static async getFeedback(employeeId) {
    const { data, error } = await supabase
      .from('employee_feedback')
      .select('*')
      .eq('empid', employeeId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async submitFeedback(feedbackData) {
    const { data, error } = await supabase
      .from('employee_feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export default DatabaseService;