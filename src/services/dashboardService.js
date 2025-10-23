import { supabase } from './supabase';

export class DatabaseService {
  // Generic error handler
  static handleError(error, operation) {
    console.error(`Error in ${operation}:`, error);
    throw new Error(`Failed to ${operation}: ${error.message}`);
  }

  // Generic fetch method with error handling
  static async fetchData(table, options = {}) {
    try {
      let query = supabase.from(table).select(options.select || '*');
      
      if (options.filters) {
        options.filters.forEach(filter => {
          if (filter.operator === 'eq') {
            query = query.eq(filter.column, filter.value);
          } else if (filter.operator === 'gte') {
            query = query.gte(filter.column, filter.value);
          } else if (filter.operator === 'lte') {
            query = query.lte(filter.column, filter.value);
          } else if (filter.operator === 'like') {
            query = query.like(filter.column, filter.value);
          }
        });
      }
      
      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending });
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, `fetch data from ${table}`);
      return [];
    }
  }

  // Generic insert method
  static async insertData(table, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert([{ ...data, created_at: new Date().toISOString() }])
        .select();

      if (error) throw error;
      return result?.[0] || null;
    } catch (error) {
      this.handleError(error, `insert data into ${table}`);
      return null;
    }
  }

  // Generic update method
  static async updateData(table, updates, match) {
    try {
      const { data, error } = await supabase
        .from(table)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .match(match)
        .select();

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      this.handleError(error, `update data in ${table}`);
      return null;
    }
  }

  // Generic delete method (soft delete by setting is_active to false)
  static async deleteData(table, match) {
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .match(match);

      if (error) throw error;
      return true;
    } catch (error) {
      this.handleError(error, `delete data from ${table}`);
      return false;
    }
  }

  // Employee specific methods
  static async getEmployees(filters = []) {
    return this.fetchData('employee', {
      filters: [...filters, { column: 'is_active', operator: 'eq', value: true }],
      order: { column: 'first_name', ascending: true }
    });
  }

  static async getEmployeeById(empid) {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .eq('empid', empid)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, `fetch employee ${empid}`);
      return null;
    }
  }

  static async getEmployeesByManager(managerId) {
    return this.fetchData('employee', {
      filters: [
        { column: 'managerid', operator: 'eq', value: managerId },
        { column: 'is_active', operator: 'eq', value: true }
      ]
    });
  }

  // Leave management
  static async getPendingLeaves() {
    return this.fetchData('employeeleave', {
      select: '*, employee:empid(first_name, last_name, email, department, role), leavetype:leavetypeid(leavetype)',
      filters: [{ column: 'leavestatus', operator: 'eq', value: 'pending' }],
      order: { column: 'created_at', ascending: false }
    });
  }

  static async getEmployeeLeaves(empid) {
    return this.fetchData('employeeleave', {
      select: '*, leavetype:leavetypeid(leavetype)',
      filters: [{ column: 'empid', operator: 'eq', value: empid }],
      order: { column: 'created_at', ascending: false }
    });
  }

  // Salary management
  static async getSalaryData(empid = null) {
    const filters = [];
    if (empid) {
      filters.push({ column: 'empid', operator: 'eq', value: empid });
    }
    
    return this.fetchData('salary', {
      select: '*, employee:empid(first_name, last_name, department)',
      filters,
      order: { column: 'salarydate', ascending: false }
    });
  }

  // Attendance management
  static async getAttendance(empid = null, date = null) {
    const filters = [];
    if (empid) {
      filters.push({ column: 'empid', operator: 'eq', value: empid });
    }
    if (date) {
      filters.push({ column: 'date', operator: 'eq', value: date });
    }
    
    return this.fetchData('attendance', {
      select: '*, employee:empid(first_name, last_name)',
      filters,
      order: { column: 'date', ascending: false }
    });
  }

  // Loan management
  static async getLoans(empid = null) {
    const filters = [];
    if (empid) {
      filters.push({ column: 'empid', operator: 'eq', value: empid });
    }
    
    return this.fetchData('loanrequest', {
      select: '*, employee:empid(first_name, last_name), loantype:loantypeid(loantype)',
      filters,
      order: { column: 'created_at', ascending: false }
    });
  }

  // Training management
  static async getTrainings(empid = null) {
    const filters = [];
    if (empid) {
      filters.push({ column: 'empid', operator: 'eq', value: empid });
    }
    
    return this.fetchData('training', {
      select: '*, employee:empid(first_name, last_name)',
      filters,
      order: { column: 'date', ascending: false }
    });
  }

  // KPI management
  static async getKPIs(empid = null) {
    const filters = [];
    if (empid) {
      filters.push({ column: 'empid', operator: 'eq', value: empid });
    }
    
    return this.fetchData('kpi', {
      select: '*, employee:empid(first_name, last_name, department), kpiranking:kpirankingid(kpirank)',
      filters,
      order: { column: 'calculatedate', ascending: false }
    });
  }

  // EPF/ETF management
  static async getEPFContributions(empid = null) {
    const filters = [];
    if (empid) {
      filters.push({ column: 'empid', operator: 'eq', value: empid });
    }
    
    return this.fetchData('epf_contributions', {
      select: '*, employee:empid(first_name, last_name)',
      filters,
      order: { column: 'month', ascending: false }
    });
  }

  // Tasks management
  static async getTasks(assigneeId = null) {
    const filters = [];
    if (assigneeId) {
      filters.push({ column: 'assignee_id', operator: 'eq', value: assigneeId });
    }
    
    return this.fetchData('tasks', {
      select: '*, assignee:assignee_id(first_name, last_name)',
      filters,
      order: { column: 'due_date', ascending: true }
    });
  }

  // Department management
  static async getDepartments() {
    return this.fetchData('department', {
      select: '*, manager:managerid(first_name, last_name)'
    });
  }

  // Leave types
  static async getLeaveTypes() {
    return this.fetchData('leavetype');
  }

  // Loan types
  static async getLoanTypes() {
    return this.fetchData('loantype');
  }
}

export default DatabaseService;