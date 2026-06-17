import React from 'react';

/**
 * @param {{ title: string, sheetData: Object }} props
 */
export default function BulkUploadSummary({ title, sheetData }) {
    if (!sheetData || sheetData.total === 0) return null;

    const hasChanges = (sheetData.created || 0) > 0 || (sheetData.updated || 0) > 0 || (sheetData.errors || 0) > 0;
    if (!hasChanges) return null;

    return (
        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <h4 className="font-semibold text-xs text-slate-800 capitalize mb-1.5">{title} ({sheetData.total} processed)</h4>
            <div className="flex flex-wrap gap-4 text-xs">
                <span className="text-green-600 font-medium">Created: {sheetData.created || 0}</span>
                <span className="text-blue-600 font-medium">Edited: {sheetData.updated || 0}</span>
                <span className="text-red-600 font-medium">Invalid: {sheetData.errors || 0}</span>
            </div>
        </div>
    );
}
