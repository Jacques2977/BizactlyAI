import React, { useState } from 'react';
import { Download, Upload, Trash2, FileText, Calendar, User, Settings } from 'lucide-react';
import { useDataStorage } from '../hooks/useDataStorage';

interface DataManagerProps {
  onClose: () => void;
}

export const DataManager: React.FC<DataManagerProps> = ({ onClose }) => {
  const { 
    userData, 
    deleteDocument, 
    exportAllData, 
    importData, 
    updatePreferences,
    getDocumentsByType 
  } = useDataStorage();
  
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);

  const documentTypes = [
    { type: 'lean-canvas', name: 'Lean Canvases', icon: '📋', color: 'bg-blue-100 text-blue-800' },
    { type: 'mvp-plan', name: 'MVP Plans', icon: '🚀', color: 'bg-purple-100 text-purple-800' },
    { type: 'idea-validation', name: 'Idea Validations', icon: '🔍', color: 'bg-green-100 text-green-800' },
    { type: 'personas', name: 'User Personas', icon: '👥', color: 'bg-pink-100 text-pink-800' },
    { type: 'pricing', name: 'Pricing Strategies', icon: '💰', color: 'bg-yellow-100 text-yellow-800' },
    { type: 'competitor-analysis', name: 'Competitor Analyses', icon: '📊', color: 'bg-red-100 text-red-800' },
    { type: 'launch-plan', name: 'Launch Plans', icon: '🎯', color: 'bg-orange-100 text-orange-800' },
    { type: 'conversation', name: 'Conversations', icon: '💬', color: 'bg-indigo-100 text-indigo-800' },
  ] as const;

  const handleExportAll = () => {
    const exportData = exportAllData();
    const dataBlob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bizactly_data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    try {
      const fileContent = await importFile.text();
      const success = importData(fileContent);
      
      if (success) {
        alert('Data imported successfully!');
        setImportFile(null);
      } else {
        alert('Failed to import data. Please check the file format.');
      }
    } catch (error) {
      alert('Error reading file. Please try again.');
    }
  };

  const handleDeleteSelected = () => {
    if (selectedDocuments.size === 0) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete ${selectedDocuments.size} document(s)?`);
    if (confirmDelete) {
      selectedDocuments.forEach(docId => deleteDocument(docId));
      setSelectedDocuments(new Set());
    }
  };

  const toggleDocumentSelection = (docId: string) => {
    const newSelection = new Set(selectedDocuments);
    if (newSelection.has(docId)) {
      newSelection.delete(docId);
    } else {
      newSelection.add(docId);
    }
    setSelectedDocuments(newSelection);
  };

  const selectAllDocuments = () => {
    const allDocIds = userData.documents.map(doc => doc.id);
    setSelectedDocuments(new Set(allDocIds));
  };

  const clearSelection = () => {
    setSelectedDocuments(new Set());
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-gray-700 to-gray-800">
        <div className="flex items-center space-x-3">
          <FileText className="w-8 h-8 text-white" />
          <div>
            <h3 className="text-xl font-bold text-white">Data Manager</h3>
            <p className="text-gray-300 text-sm">Manage your documents and data</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors text-xl"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-white">{userData.documents.length}</p>
                <p className="text-gray-400 text-sm">Total Documents</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-white">{userData.usage.documentsCreated}</p>
                <p className="text-gray-400 text-sm">Created</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-lg font-bold text-white">{userData.preferences.defaultExportFormat.toUpperCase()}</p>
                <p className="text-gray-400 text-sm">Default Format</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-lg font-bold text-white">{userData.preferences.autoSave ? 'ON' : 'OFF'}</p>
                <p className="text-gray-400 text-sm">Auto Save</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleExportAll}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export All Data</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
            </label>
            {importFile && (
              <button
                onClick={handleImport}
                className="bg-green-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-800 transition-colors"
              >
                Upload
              </button>
            )}
          </div>
          
          {selectedDocuments.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedDocuments.size})</span>
            </button>
          )}
          
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Preferences</span>
          </button>
        </div>

        {/* Preferences Panel */}
        {showPreferences && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-bold text-white mb-4">Preferences</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default Export Format
                </label>
                <select
                  value={userData.preferences.defaultExportFormat}
                  onChange={(e) => updatePreferences({ defaultExportFormat: e.target.value as any })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="pdf">PDF</option>
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={userData.preferences.autoSave}
                    onChange={(e) => updatePreferences({ autoSave: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-gray-300">Auto Save</span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={userData.preferences.notifications}
                    onChange={(e) => updatePreferences({ notifications: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-gray-300">Notifications</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Document Types */}
        <div className="space-y-6">
          {documentTypes.map(({ type, name, icon, color }) => {
            const documents = getDocumentsByType(type as any);
            if (documents.length === 0) return null;

            return (
              <div key={type} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{icon}</span>
                    <h4 className="text-lg font-bold text-white">{name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                      {documents.length}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const typeDocIds = documents.map(doc => doc.id);
                        setSelectedDocuments(new Set([...selectedDocuments, ...typeDocIds]));
                      }}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Select All
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between p-3 rounded border transition-colors ${
                        selectedDocuments.has(doc.id)
                          ? 'bg-blue-900/30 border-blue-700/50'
                          : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.has(doc.id)}
                          onChange={() => toggleDocumentSelection(doc.id)}
                          className="rounded"
                        />
                        <div>
                          <p className="text-white font-medium">{doc.title}</p>
                          <p className="text-gray-400 text-sm">
                            Created: {new Date(doc.createdAt).toLocaleDateString()} • 
                            Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const dataStr = JSON.stringify(doc.data, null, 2);
                            navigator.clipboard.writeText(dataStr);
                          }}
                          className="text-green-400 hover:text-green-300 text-sm"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {userData.documents.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Documents Yet</h3>
            <p className="text-gray-400">Start using the tools to create and save your startup documents.</p>
          </div>
        )}
      </div>
    </div>
  );
};