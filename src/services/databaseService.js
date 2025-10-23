import { supabase } from './supabase';

class DatabaseService {
  
  // Employee Profile Operations
  static async getEmployeeProfile(empid) {
    const { data, error } = await supabase
      .from('employee')
      .select('*')
      .eq('empid', empid)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateEmployeeProfile(empid, updates) {
    const { data, error } = await supabase
      .from('employee')
      .update({
        ...updates,
        last_updated_at: new Date().toISOString()
      })
      .eq('empid', empid)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Leave Operations
  static async getLeaves({ employeeId, status }) {
    let query = supabase
      .from('employeeleave')
      .select(`
        *,
        leavetype:leavetypeid(leavetypeid, leavetype)
      `)
      .eq('empid', employeeId);
    
    if (status) {
      query = query.eq('leavestatus', status);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async applyLeave(leaveData) {
    const { data, error } = await supabase
      .from('employeeleave')
      .insert([leaveData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getLeaveBalance(empid) {
    // Get current year
    const currentYear = new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('leavebalance')
      .select(`
        days,
        leavetype:leavetypeid(leavetype)
      `)
      .eq('empid', empid)
      .eq('year', currentYear);
    
    if (error) throw error;
    
    // Transform data to expected format
    const balance = {};
    data.forEach(item => {
      const type = item.leavetype.leavetype.toLowerCase().replace(/\s+/g, '');
      balance[type] = parseFloat(item.days);
    });
    
    return balance;
  }

  // Attendance Operations
  static async getAttendance({ employeeId, month }) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('empid', employeeId)
      .like('date', `${month}%`)
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    // Calculate summary
    const presentDays = data.filter(record => record.status === 'Present').length;
    const todayRecord = data.find(record => record.date === new Date().toISOString().split('T')[0]);
    
    return {
      records: data,
      monthlyPresent: presentDays,
      todayRecord: todayRecord,
      todayStatus: todayRecord ? todayRecord.status : 'Not Recorded'
    };
  }

  static async markAttendance(attendanceData) {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if record exists for today
    const { data: existingRecord } = await supabase
      .from('attendance')
      .select('*')
      .eq('empid', attendanceData.empid)
      .eq('date', today)
      .single();

    if (existingRecord) {
      // Update out time
      const { data, error } = await supabase
        .from('attendance')
        .update({ 
          outtime: attendanceData.time,
          status: 'Present'
        })
        .eq('attendanceid', existingRecord.attendanceid)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          empid: attendanceData.empid,
          date: today,
          intime: attendanceData.time,
          status: 'Present'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }

  // Task Operations
  static async getTasks(empid) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assignee_id', empid)
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  // Salary Operations
  static async getSalaries({ employeeId, month }) {
    const { data, error } = await supabase
      .from('salary')
      .select('*')
      .eq('empid', employeeId)
      .like('salarydate', `${month}%`)
      .order('salarydate', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data || {};
  }

  // Loan Operations
  static async getLoans({ employeeId }) {
    const { data, error } = await supabase
      .from('loanrequest')
      .select(`
        *,
        loantype:loantypeid(loantypeid, loantype)
      `)
      .eq('empid', employeeId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async applyLoan(loanData) {
    const { data, error } = await supabase
      .from('loanrequest')
      .insert([loanData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Training Operations
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
      .insert([trainingData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // EPF/ETF Operations
  static async getEpfEtfRequests({ employeeId }) {
    const { data, error } = await supabase
      .from('epf_etf_applications')
      .select('*')
      .eq('empid', employeeId)
      .order('applied_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async applyEpfEtf(epfData) {
    const { data, error } = await supabase
      .from('epf_etf_applications')
      .insert([epfData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Promotion History
  static async getPromotions(empid) {
    const { data, error } = await supabase
      .from('promotion_history')
      .select('*')
      .eq('empid', empid)
      .order('promotiondate', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Team Members
  static async getEmployees({ managerId }) {
    const { data, error } = await supabase
      .from('employee')
      .select('empid, first_name, last_name, role, department, avatarurl, email')
      .eq('managerid', managerId)
      .eq('is_active', true);
    
    if (error) throw error;
    return data;
  }

  // Feedback Operations
  static async submitFeedback(feedbackData) {
    const { data, error } = await supabase
      .from('employee_feedback')
      .insert([feedbackData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getFeedback(empid) {
    const { data, error } = await supabase
      .from('employee_feedback')
      .select('*')
      .eq('empid', empid)
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}

export default DatabaseService;