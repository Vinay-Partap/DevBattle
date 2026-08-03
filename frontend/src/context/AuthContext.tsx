import React, { createContext, useContext, useState } from 'react';
import { User, Role } from '../types';
import { mockUsers, mockPendingApprovals } from '../data/mockData';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'mentor';
  collegeId: string;
  collegeName: string;
  branchName: string;
}

interface AuthContextType {
  currentUser: User;
  role: Role;
  switchRole: (role: Role) => void;
  pendingUsers: User[];
  approveUser: (userId: string, role: Role) => void;
  rejectUser: (userId: string) => void;
  updateUserStatus: (userId: string, status: 'active' | 'suspended') => void;
  registerUser: (data: RegisterData) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('student');
  const [pendingUsers, setPendingUsers] = useState<User[]>(mockPendingApprovals);

  const currentUser = mockUsers.find((u) => u.role === role) || mockUsers[0];

  const switchRole = (newRole: Role) => {
    setRole(newRole);
  };

  const registerUser = (data: RegisterData) => {
    const newUser: User = {
      id: `usr-pending-${Date.now()}`,
      name: data.name,
      email: data.email,
      avatar: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80`,
      role: data.role,
      status: 'pending',
      collegeId: data.collegeId,
      collegeName: data.collegeName,
      branchName: data.branchName,
      joinedAt: new Date().toISOString().split('T')[0],
      xp: 0,
      rank: 999,
      streak: 0,
      problemsSolved: 0,
    };

    setPendingUsers((prev) => [...prev, newUser]);
  };

  const approveUser = (userId: string, assignedRole: Role) => {
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const rejectUser = (userId: string) => {
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const updateUserStatus = (userId: string, status: 'active' | 'suspended') => {
    // mock update
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        switchRole,
        pendingUsers,
        approveUser,
        rejectUser,
        updateUserStatus,
        registerUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
