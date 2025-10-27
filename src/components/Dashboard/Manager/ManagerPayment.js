import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Empty
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ManagerTasks = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [taskForm] = Form.useForm();

  useEffect(() => {
    if (profile?.empid) {
      initializeData();
    }
  }, [profile?.empid]);

  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTeamMembers(),
        fetchTeamTasks()
      ]);
    } catch (error) {
      console.error('Error initializing task data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('empid, full_name, role, department')
        .eq('managerid', profile.empid)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  const fetchTeamTasks = async () => {
    try {
      const teamMemberIds = teamMembers.map(member => member.empid).filter(Boolean);
      
      if (teamMemberIds.length === 0) {
        setTeamTasks([]);
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .in('assignee_id', teamMemberIds)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Fetch assignee details
      const assigneeIds = [...new Set(data?.map(task => task.assignee_id).filter(Boolean))];
      let assigneeData = [];

      if (assigneeIds.length > 0) {
        const { data: empData } = await supabase
          .from('employee')
          .select('empid, full_name')
          .in('empid', assigneeIds);
        assigneeData = empData || [];
      }

      const assigneeMap = {};
      assigneeData.forEach(emp => {
        assigneeMap[emp.empid] = emp;
      });

      const tasksWithAssignee = data?.map(task => ({
        ...task,
        assignee: assigneeMap[task.assignee_id] || { full_name: 'Unassigned' }
      }));

      setTeamTasks(tasksWithAssignee || []);
    } catch (error) {
      console.error('Error fetching team tasks:', error);
      setTeamTasks([]);
    }
  };

  const assignTask = async (values) => {
    try {
      if (!values.title || !values.assignee_id) {
        message.error('Task title and assignee are required');
        return;
      }

      if (!values.due_date) {
        message.error('Due date is required');
        return;
      }

      const dueDate = dayjs(values.due_date);
      if (dueDate.isBefore(dayjs(), 'day')) {
        message.error('Due date cannot be in the past');
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: values.title.trim(),
          description: values.description?.trim() || null,
          assignee_id: values.assignee_id,
          created_by: profile.empid,
          due_date: dueDate.format('YYYY-MM-DD HH:mm:ss'),
          priority: values.priority || 'medium',
          status: 'pending',
          created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }])
        .select();

      if (error) throw error;

      // Log the operation
      await supabase
        .from('manager_operations')
        .insert([{
          operation: 'assign_task',
          record_id: data?.[0]?.id,
          manager_id: profile.empid,
          details: {
            task_title: values.title,
            assignee_id: values.assignee_id,
            due_date: dueDate.format('YYYY-MM-DD')
          },
          operation_time: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }]);

      message.success('Task assigned successfully!');
      setIsTaskModalVisible(false);
      taskForm.resetFields();
      fetchTeamTasks();
    } catch (error) {
      console.error('Error assigning task:', error);
      message.error('Failed to assign task');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      message.success('Task deleted successfully!');
      fetchTeamTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      message.error('Failed to delete task');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
        })
        .eq('id', taskId);

      if (error) throw error;
      
      message.success('Task status updated!');
      fetchTeamTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      message.error('Failed to update task status');
    }
  };

  const taskColumns = [
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div><Text strong>{text}</Text></div>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Assignee',
      dataIndex: ['assignee', 'full_name'],
      key: 'assignee',
      render: (text) => text || 'Unassigned'
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={
          priority === 'high' ? 'red' :
          priority === 'medium' ? 'orange' : 'blue'
        }>
          {priority?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select
          value={status}
          onChange={(value) => updateTaskStatus(record.id, value)}
          style={{ width: 120 }}
          size="small"
        >
          <Option value="pending">Pending</Option>
          <Option value="in_progress">In Progress</Option>
          <Option value="completed">Completed</Option>
        </Select>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small">
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this task?"
            onConfirm={() => deleteTask(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (!profile?.empid) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Empty
          description="Manager profile not found. Please contact administrator."
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3}>
              <CalendarOutlined /> Task Management
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsTaskModalVisible(true)}
            >
              Assign New Task
            </Button>
          </Col>
        </Row>

        {loading ? (
          <Table loading={true} columns={taskColumns} dataSource={[]} />
        ) : teamTasks.length === 0 ? (
          <Empty
            description="No tasks found for your team members"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            dataSource={teamTasks}
            columns={taskColumns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} tasks`
            }}
            rowKey="id"
          />
        )}
      </Card>

      {/* Assign Task Modal */}
      <Modal
        title="Assign New Task"
        open={isTaskModalVisible}
        onCancel={() => {
          setIsTaskModalVisible(false);
          taskForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={taskForm} layout="vertical" onFinish={assignTask}>
          <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
            <Input placeholder="Enter task title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter task description" />
          </Form.Item>
          <Form.Item name="assignee_id" label="Assign To" rules={[{ required: true }]}>
            <Select
              placeholder="Select team member"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {teamMembers.map(member => (
                <Option key={member.empid} value={member.empid}>
                  {member.full_name} - {member.role} ({member.department})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="due_date" label="Due Date" rules={[{ required: true }]}>
            <DatePicker 
              style={{ width: '100%' }} 
              showTime 
              format="YYYY-MM-DD HH:mm"
            />
          </Form.Item>
          <Form.Item name="priority" label="Priority" initialValue="medium">
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Assign Task
              </Button>
              <Button onClick={() => {
                setIsTaskModalVisible(false);
                taskForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagerTasks;