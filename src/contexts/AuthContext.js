// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Fetch user profile from Supabase ---
  const fetchUserProfile = async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return null;
    }

    try {
      console.log('Fetching profile for user:', authUser.id);

      // Try by auth_user_id
      let { data: profile, error } = await supabase
        .from('employee')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      // Try by email if not found
      if (error || !profile) {
        console.log('Profile not found by auth_user_id, trying email...');
        const { data: profileByEmail, error: emailError } = await supabase
          .from('employee')
          .select('*')
          .eq('email', authUser.email)
          .single();

        if (profileByEmail) {
          profile = profileByEmail;

          // Update auth_user_id for next login
          await supabase
            .from('employee')
            .update({ auth_user_id: authUser.id })
            .eq('empid', profile.empid);
        } else if (emailError) {
          console.error('Error fetching profile by email:', emailError);
        }
      }

      // Found or created profile
      if (profile) {
        console.log('User profile loaded:', profile);
        setProfile(profile);
        return profile;
      } else {
        console.log('No profile found, creating new one...');
        const newProfile = {
          email: authUser.email,
          first_name:
            authUser.user_metadata?.full_name?.split(' ')[0] ||
            authUser.email.split('@')[0],
          last_name:
            authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
            '',
          role: authUser.user_metadata?.role || 'employee',
          department: authUser.user_metadata?.department || 'General',
          status: 'Active',
          auth_user_id: authUser.id,
          created_at: new Date().toISOString(),
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('employee')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return null;
        }

        console.log('New profile created:', createdProfile);
        setProfile(createdProfile);
        return createdProfile;
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  // --- Dashboard route helper ---
  const getDashboardRoute = (role) => {
    switch (role) {
      case 'ceo':
        return '/ceo-dashboard';
      case 'hr':
        return '/hr-dashboard';
      case 'manager':
        return '/manager-dashboard';
      case 'accountant':
        return '/accountant-dashboard';
      case 'employee':
      default:
        return '/employee-dashboard';
    }
  };

  // --- Auth initialization ---
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user ?? null;
        setUser(authUser);

        if (authUser) {
          await fetchUserProfile(authUser);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);

      if (authUser) {
        await fetchUserProfile(authUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Context value ---
  const value = {
    user,
    profile,
    loading,
    signOut: () => supabase.auth.signOut(),
    refreshProfile: () => user && fetchUserProfile(user),
    getDashboardRoute,
  };

  // ✅ Only one return statement here
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
