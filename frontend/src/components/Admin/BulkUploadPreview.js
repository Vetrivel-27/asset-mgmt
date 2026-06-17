import React from 'react';

/**
 * @param {{ title: string, list: Array<Object> }} props
 */
export default function BulkUploadPreview({ title, list }) {
    if (!list || list.length === 0) return null;
    const fields = Object.keys(list[0]);
    return (
        <div className="mb-3">
            <h4 className="text-xs font-semibold text-slate-800 capitalize mb-1">{title} ({list.length} rows found)</h4>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 text-[11px]">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            {fields.map((f, idx) => (
                                <th key={idx} className="px-2.5 py-1.5 text-left font-semibold text-slate-700 bg-slate-50 border-b border-slate-200">{f}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {list.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-slate-50">
                                {fields.map((f, fieldIdx) => (
                                    <td key={fieldIdx} className="px-2.5 py-1.5 text-slate-600 truncate max-w-[120px]">
                                        {String(row[f] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
