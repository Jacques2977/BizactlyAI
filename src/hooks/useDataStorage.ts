import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface StoredDocument {
  id: string;
  type: 'lean-canvas' | 'mvp-plan' | 'idea-validation' | 'personas' | 'pricing' | 'competitor-analysis' | 'launch-plan' | 'conversation';
  title: string;
  data: any;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface UserData {
  documents: StoredDocument[];
  preferences: {
    defaultExportFormat: 'pdf' | 'json' | 'csv';
    autoSave: boolean;
    notifications: boolean;
  };
  usage: {
    documentsCreated: number;
    lastActivity: string;
  };
}

export const useDataStorage = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    documents: [],
    preferences: {
      defaultExportFormat: 'pdf',
      autoSave: true,
      notifications: true
    },
    usage: {
      documentsCreated: 0,
      lastActivity: new Date().toISOString()
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = () => {
    setIsLoading(true);
    
    const savedData = localStorage.getItem(`user_data_${user?.id}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setUserData(parsedData);
      } catch (error) {
        console.error('Failed to load user data:', error);
        initializeUserData();
      }
    } else {
      initializeUserData();
    }
    
    setIsLoading(false);
  };

  const initializeUserData = () => {
    const defaultData: UserData = {
      documents: [],
      preferences: {
        defaultExportFormat: 'pdf',
        autoSave: true,
        notifications: true
      },
      usage: {
        documentsCreated: 0,
        lastActivity: new Date().toISOString()
      }
    };
    
    setUserData(defaultData);
    saveUserData(defaultData);
  };

  const saveUserData = (data: UserData) => {
    if (user) {
      localStorage.setItem(`user_data_${user.id}`, JSON.stringify(data));
    }
  };

  const saveDocument = (type: StoredDocument['type'], title: string, data: any): string => {
    const documentId = Date.now().toString();
    const newDocument: StoredDocument = {
      id: documentId,
      type,
      title,
      data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user?.id || ''
    };

    const updatedUserData = {
      ...userData,
      documents: [...userData.documents, newDocument],
      usage: {
        ...userData.usage,
        documentsCreated: userData.usage.documentsCreated + 1,
        lastActivity: new Date().toISOString()
      }
    };

    setUserData(updatedUserData);
    saveUserData(updatedUserData);
    
    return documentId;
  };

  const updateDocument = (documentId: string, updates: Partial<StoredDocument>) => {
    const updatedUserData = {
      ...userData,
      documents: userData.documents.map(doc => 
        doc.id === documentId 
          ? { ...doc, ...updates, updatedAt: new Date().toISOString() }
          : doc
      ),
      usage: {
        ...userData.usage,
        lastActivity: new Date().toISOString()
      }
    };

    setUserData(updatedUserData);
    saveUserData(updatedUserData);
  };

  const deleteDocument = (documentId: string) => {
    const updatedUserData = {
      ...userData,
      documents: userData.documents.filter(doc => doc.id !== documentId),
      usage: {
        ...userData.usage,
        lastActivity: new Date().toISOString()
      }
    };

    setUserData(updatedUserData);
    saveUserData(updatedUserData);
  };

  const getDocumentsByType = (type: StoredDocument['type']): StoredDocument[] => {
    return userData.documents.filter(doc => doc.type === type);
  };

  const getDocument = (documentId: string): StoredDocument | undefined => {
    return userData.documents.find(doc => doc.id === documentId);
  };

  const updatePreferences = (preferences: Partial<UserData['preferences']>) => {
    const updatedUserData = {
      ...userData,
      preferences: { ...userData.preferences, ...preferences }
    };

    setUserData(updatedUserData);
    saveUserData(updatedUserData);
  };

  const exportAllData = (): string => {
    const exportData = {
      ...userData,
      exportedAt: new Date().toISOString(),
      userId: user?.id,
      userName: user?.name
    };

    return JSON.stringify(exportData, null, 2);
  };

  const importData = (jsonData: string): boolean => {
    try {
      const importedData = JSON.parse(jsonData);
      
      // Validate the data structure
      if (importedData.documents && Array.isArray(importedData.documents)) {
        const updatedUserData = {
          ...userData,
          documents: [...userData.documents, ...importedData.documents],
          usage: {
            ...userData.usage,
            documentsCreated: userData.usage.documentsCreated + importedData.documents.length,
            lastActivity: new Date().toISOString()
          }
        };

        setUserData(updatedUserData);
        saveUserData(updatedUserData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  };

  return {
    userData,
    isLoading,
    saveDocument,
    updateDocument,
    deleteDocument,
    getDocumentsByType,
    getDocument,
    updatePreferences,
    exportAllData,
    importData,
    loadUserData
  };
};