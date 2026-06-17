import React, { useState, useRef, useEffect } from 'react';
import { bulkUploadService } from "../../services/bulkUploadService";
import { downloadTemplate, parsePreviewData } from "../../utils/excelUtils";
import Button from '../ui/Button';
import BulkUploadPreview from './BulkUploadPreview';
import BulkUploadSummary from './BulkUploadSummary';
import BulkUploadErrors from './BulkUploadErrors';

const BulkUploadForm = ({ open, onClose, onSuccess, type }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const fileInputRef = useRef(null);

    const hasAnyErrors = results ? (
        (results.summary?.assets?.errors || 0) > 0 ||
        (results.summary?.employees?.errors || 0) > 0 ||
        (results.summary?.roles?.errors || 0) > 0
    ) : false;

    useEffect(() => {
        if (open) {
            setFile(null);
            setError('');
            setResults(null);
            setPreviewData(null);
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
            setPreviewData(null);
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

    const handleParsePreview = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        setError('');
        try {
            const parsed = await parsePreviewData(file);
            setPreviewData(parsed);
        } catch (err) {
            setError(err.message);
        }
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
            const data = await bulkUploadService.upload(formData);
            setResults(data);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.message || 'An error occurred during upload.');
        } finally {
            setUploading(false);
        }
    };


    return (
        <div className="rounded-[32px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Bulk Upload</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Upload multiple {type === 'assets' ? 'Assets' : type === 'employees' ? 'Employees' : 'Records'} via Excel.</p>
                </div>
            </div>

            {!results ? (
                !previewData ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-3 rounded-xl gap-4">
                            <div className="text-xs text-blue-800 leading-relaxed">
                                <span className="font-semibold block mb-0.5">Need the correct format?</span>
                                Download the template file with the required columns and example data.
                            </div>
                            <Button onClick={downloadTemplate} size="sm" variant="subtle" className="!bg-white !text-blue-600 !border-blue-200 hover:!bg-blue-50">
                                Download Template
                            </Button>
                        </div>

                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center transition ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-yellow-400 bg-slate-50'}`}
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
                                    <svg className="mx-auto h-8 w-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-xs font-semibold text-slate-900">{file.name}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                                    <Button size="sm" variant="subtle" onClick={() => setFile(null)} className="mt-2 mx-auto !inline-flex !px-2 !py-1 !bg-transparent !text-red-500 hover:!text-red-700 !border-none">Remove File</Button>
                                </div>
                            ) : (
                                <div>
                                    <svg className="mx-auto h-8 w-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-xs font-semibold text-slate-900">Drag and drop your Excel file here</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">or</p>
                                    <Button size="sm" variant="subtle" onClick={() => fileInputRef.current.click()} className="mt-2 mx-auto !inline-flex !bg-white !text-slate-700 !border-slate-200 hover:!bg-slate-50">
                                        Browse Files
                                    </Button>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                            <Button
                                onClick={handleParsePreview}
                                disabled={!file}
                                size="sm"
                            >
                                Upload
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                            <div className="text-xs text-slate-800">
                                <span className="font-semibold block mb-0.5">Fetched Contents Preview</span>
                                Please review the parsed records below. Click <strong>Confirm Import</strong> to process the import.
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                            <BulkUploadPreview title="Assets" list={previewData.assets} />
                            <BulkUploadPreview title="Employees" list={previewData.employees} />
                            <BulkUploadPreview title="Roles" list={previewData.roles} />
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                            <Button
                                onClick={() => setPreviewData(null)}
                                variant="subtle"
                                size="sm"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                loading={uploading}
                                size="sm"
                            >
                                Confirm Import
                            </Button>
                        </div>
                    </div>
                )
            ) : (
                <div className="space-y-4">
                    <div className="rounded-xl bg-green-50 p-3 border border-green-100 flex items-start gap-2.5">
                        <svg className="h-5 w-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="font-semibold text-sm text-green-800">Upload Processed</h3>
                            <p className="text-xs text-green-700 mt-0.5">Your file has been processed successfully. Please review the summary below.</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Summary</h4>
                        <BulkUploadSummary title="Assets" sheetData={results.summary?.assets} />
                        <BulkUploadSummary title="Employees" sheetData={results.summary?.employees} />
                        <BulkUploadSummary title="Roles" sheetData={results.summary?.roles} />

                        {!(
                            ((results.summary?.assets?.created || 0) > 0) ||
                            ((results.summary?.assets?.updated || 0) > 0) ||
                            ((results.summary?.employees?.created || 0) > 0) ||
                            ((results.summary?.employees?.updated || 0) > 0) ||
                            ((results.summary?.roles?.created || 0) > 0) ||
                            ((results.summary?.roles?.updated || 0) > 0)
                        ) && (
                                <div className="rounded-xl bg-amber-50 p-3 border border-amber-100 text-xs text-amber-800 font-medium">
                                    Import completed, but no new records were created or edited.
                                </div>
                            )}
                    </div>

                    {hasAnyErrors && (
                        <div className="border-t border-slate-100 pt-3">
                            <BulkUploadErrors title="Assets" detailsList={results.details?.assets} />
                            <BulkUploadErrors title="Employees" detailsList={results.details?.employees} />
                            <BulkUploadErrors title="Roles" detailsList={results.details?.roles} />
                        </div>
                    )}

                    <div className="flex justify-end pt-3 border-t border-slate-100">
                        <Button
                            onClick={() => {
                                setFile(null);
                                setError('');
                                setResults(null);
                                setPreviewData(null);
                            }}
                            className="!bg-slate-900 !text-white hover:!bg-slate-800"
                            size="sm"
                        >
                            Upload Another File
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkUploadForm;
