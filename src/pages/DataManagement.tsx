import React, { useState } from 'react';
import { FileText, Upload, Shield, ArrowLeft } from 'lucide-react';

export default function DataManagement() {
  const [showReport, setShowReport] = useState(false);
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Data Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Export, import, and retention preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center mb-4">
          <FileText className="h-6 w-6 text-indigo-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Generate Report</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Create comprehensive reports of your mental health data and insights.</p>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowReport(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Generate Report
          </button>
          <button className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Email Link
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center mb-4">
          <Upload className="h-6 w-6 text-indigo-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import Data</h3>
        </div>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Drag and drop files here, or click to browse</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Data Retention</h3>
            <select className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option>Never delete</option>
              <option>Delete after 1 year</option>
              <option>Delete after 2 years</option>
              <option>Delete after 5 years</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Generation Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Report Generated</h3>
              <button 
                onClick={() => setShowReport(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Your comprehensive mental health report is ready.</p>
            <div className="flex gap-3 mb-4">
              <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors">
                Download Report
              </button>
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors">
                Open Report
              </button>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setShowReport(false)} 
                className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Data Management
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


