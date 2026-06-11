import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { API_URL } from '../../config';

const BulkUploadForm = ({ open, onClose, onSuccess, type }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setFile(null);
            setError('');
            setResults(null);
            setUploading(false);
        }
    }, [open]);

    if (!open) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
                setError('Please select a valid Excel file (.xlsx or .xls)');
                setFile(null);
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError('');
            setResults(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        handleFileChange({ target: { files: [droppedFile] } });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const downloadTemplate = () => {
        const wb = XLSX.utils.book_new();

        // Assets Sheet
        const wsAssets = XLSX.utils.json_to_sheet([
            { 'Name': 'ThinkPad T14 Gen 3', 'Type': 'Laptop', 'Asset ID': 'LAP-015', 'Purchase Date': '2023-08-10' },
            { 'Name': 'Dell UltraSharp 27', 'Type': 'Monitor', 'Asset ID': 'MON-042', 'Purchase Date': '2023-09-01' },
        ]);
        XLSX.utils.book_append_sheet(wb, wsAssets, "Assets");

        // Employees Sheet
        const wsEmployees = XLSX.utils.json_to_sheet([
            { 'Name': 'Michael Chen', 'Email': 'michael.chen@company.com', 'Employee ID': '1042', 'Department': 'Engineering', 'Role': 'Senior Developer' },
            { 'Name': 'Sarah Jenkins', 'Email': 's.jenkins@company.com', 'Employee ID': '1043', 'Department': 'Human Resources', 'Role': 'HR Specialist' },
        ]);
        XLSX.utils.book_append_sheet(wb, wsEmployees, "Employees");

        // Roles Sheet
        const wsRoles = XLSX.utils.json_to_sheet([
            { 'Role Name': 'Senior Developer', 'Permissions': 'view_asset, request_asset, borrow_asset, return_asset' },
            { 'Role Name': 'HR Specialist', 'Permissions': 'view_asset, view_reports' },
        ]);
        XLSX.utils.book_append_sheet(wb, wsRoles, "Roles");

        XLSX.writeFile(wb, "Bulk_Upload_Template.xlsx");
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        setUploading(true);
        setError('');
        setResults(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = sessionStorage.getItem("authToken");
            const res = await fetch(`${API_URL}/api/bulk-upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            setResults(data);
            if (onSuccess) onSuccess();

        } catch (err) {
            setError(err.message || 'An error occurred during upload.');
        } finally {
            setUploading(false);
        }
    };

    const renderSummaryItem = (title, sheetData) => {
        if (!sheetData || sheetData.total === 0) return null;
        return (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="font-semibold text-slate-800 capitalize mb-2">{title} ({sheetData.total} processed)</h4>
                <div className="flex gap-4 text-sm mb-3">
                    <span className="text-green-600 font-medium">Created: {sheetData.created || 0}</span>
                    <span className="text-blue-600 font-medium">Updated: {sheetData.updated || 0}</span>
                    <span className="text-amber-600 font-medium">Skipped: {sheetData.skipped || 0}</span>
                    <span className="text-red-600 font-medium">Errors: {sheetData.errors || 0}</span>
                </div>
            </div>
        );
    };

    const renderErrors = (title, detailsList) => {
        if (!detailsList || detailsList.length === 0) return null;
        const errors = detailsList.filter(d => d.status === 'error');
        if (errors.length === 0) return null;

        return (
            <div className="mb-4">
                <h5 className="font-semibold text-sm text-red-600 capitalize mb-2">{title} Errors:</h5>
                <ul className="text-sm space-y-1 text-slate-600 list-disc pl-5 max-h-32 overflow-y-auto">
                    {errors.map((err, idx) => (
                        <li key={idx}>Row {err.row} ({err.name}): {err.message}</li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Bulk Upload</h2>
                    <p className="mt-1 text-sm text-slate-500">Upload multiple {type === 'assets' ? 'Assets' : type === 'employees' ? 'Employees' : 'Records'} via Excel.</p>
                </div>
            </div>

            {!results ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                        <div className="text-sm text-blue-800">
                            <span className="font-semibold block mb-1">Need the correct format?</span>
                            Download the template file with the required columns and example data.
                        </div>
                        <button onClick={downloadTemplate} className="px-4 py-2 bg-white text-blue-600 font-semibold text-sm rounded-xl border border-blue-200 hover:bg-blue-50 transition whitespace-nowrap">
                            Download Template
                        </button>
                    </div>

                    <div 
                        onDrop={handleDrop} 
                        onDragOver={handleDragOver}
                        className={`border-2 border-dashed rounded-3xl p-10 text-center transition ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-yellow-400 bg-slate-50'}`}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".xlsx, .xls" 
                            className="hidden" 
                        />
                        
                        {file ? (
                            <div>
                                <svg className="mx-auto h-12 w-12 text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-medium text-slate-900">{file.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                <button onClick={() => setFile(null)} className="mt-4 text-xs text-red-500 hover:text-red-700 font-medium">Remove File</button>
                            </div>
                        ) : (
                            <div>
                                <svg className="mx-auto h-12 w-12 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm font-medium text-slate-900">Drag and drop your Excel file here</p>
                                <p className="text-xs text-slate-500 mt-1">or</p>
                                <button onClick={() => fileInputRef.current.click()} className="mt-3 px-4 py-2 bg-white text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 hover:bg-slate-50 transition">
                                    Browse Files
                                </button>
                                <p className="text-xs text-slate-400 mt-4">Supports .xlsx and .xls up to 5MB</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button 
                            onClick={handleUpload} 
                            disabled={!file || uploading} 
                            className="rounded-2xl bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-slate-900 hover:bg-yellow-500 disabled:opacity-50 transition flex items-center justify-center min-w-[120px]"
                        >
                            {uploading ? (
                                <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Upload'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="rounded-2xl bg-green-50 p-4 border border-green-100 flex items-start gap-3">
                        <svg className="h-6 w-6 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="font-semibold text-green-800">Upload Processed</h3>
                            <p className="text-sm text-green-700 mt-1">Your file has been processed successfully. Please review the summary below.</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 mb-4">Summary</h4>
                        {renderSummaryItem('Assets', results.summary?.assets)}
                        {renderSummaryItem('Employees', results.summary?.employees)}
                        {renderSummaryItem('Roles', results.summary?.roles)}
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        {renderErrors('Assets', results.details?.assets)}
                        {renderErrors('Employees', results.details?.employees)}
                        {renderErrors('Roles', results.details?.roles)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkUploadForm;
