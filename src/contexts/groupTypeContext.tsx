import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchUserGroupsList } from '../api/accessManagement';
import { getAuthStatus } from '../api/authApi';

export type Group = {
  name: string;
};

export type GroupCategories = {
  read: Group[];
  upload: Group[];
  admin: Group[];
};

export type UserGroupContextType = {
  allGroups: Group[];
  groupCategories: GroupCategories;
  isAdministrator: boolean;
};

const UserGroupContext = createContext<UserGroupContextType | undefined>(undefined);

export const UserGroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [groupCategories, setGroupCategories] = useState<GroupCategories>({
    read: [],
    upload: [],
    admin: [],
  });

  const categorizeGroups = (groups: Group[]): GroupCategories => {
    const categories: GroupCategories = {
      read: [],
      upload: [],
      admin: [],
    };

    groups.forEach(group => {
       if (group.name.endsWith('_Read')) {
        categories.read.push(group);
      } else if (group.name.endsWith('_Upload')) {
        categories.upload.push(group);
      } else if(group.name.endsWith('_Admin')) {
        categories.admin.push(group);
      } 
    });

    return categories;
  };

  const isAdministrator = allGroups.some(group => group.name === 'Administrator');

  const fetchGroups = async () => {
    try {
      const userId = await getAuthStatus();
      if (userId) {
        const groupsData = await fetchUserGroupsList(userId);
        const groups = groupsData.groups ?? [];
        setAllGroups(groups);
        setGroupCategories(categorizeGroups(groups));
      }
    } catch (err) {
      console.error('Error fetching user groups:', err);
    } 
  };

  useEffect(() => {
    fetchGroups();
  }, []);
  return (
    <UserGroupContext.Provider
      value={{
        allGroups,
        groupCategories,
        isAdministrator,
      }}
    >
      {children}
    </UserGroupContext.Provider>
  );
};

export const useUserGroups = () => {
  const context = useContext(UserGroupContext);
  if (!context) {
    throw new Error('useUserGroups must be used within a UserGroupProvider');
  }
  return context;
};

