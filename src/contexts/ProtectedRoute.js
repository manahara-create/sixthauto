// components/ProtectedRoute.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Spin } from 'antd';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, redirecting to login');
        navigate('/login');
        return;
      }

      // Verify user exists in employee table
      const { data: profile } = await supabase
        .from('employee')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single();

      if (!profile) {
        console.error('User profile not found in employee table');
        navigate('/login');
        return;
      }

      setAuthenticated(true);
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Checking authentication..." />
      </div>
    );
  }

  return authenticated ? children : null;
};

export default ProtectedRoute;