import React from 'react';

/**
 * @param {{ title: string, detailsList: Array<Object> }} props
 */
export default function BulkUploadErrors({ title, detailsList }) {
    if (!detailsList || detailsList.length === 0) return null;
    const errors = detailsList.filter(d => d.status === 'error');
    if (errors.length === 0) return null;

    return (
        <div className="mb-2.5">
            <h5 className="font-semibold text-xs text-red-600 capitalize mb-1">{title} Errors:</h5>
            <ul className="text-xs space-y-1 text-slate-600 list-disc pl-5 max-h-24 overflow-y-auto">
                {errors.map((err, idx) => (
                    <li key={idx}>Row {err.row} ({err.name}): {err.message}</li>
                ))}
            </ul>
        </div>
    );
}
