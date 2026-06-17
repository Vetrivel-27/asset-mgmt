import * as XLSX from 'xlsx';

/**
 * Generates and downloads a predefined template for bulk uploading assets, employees, and roles.
 */
export const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Assets Sheet
    const wsAssets = XLSX.utils.json_to_sheet([
        { 'Name': 'ThinkPad T14 Gen 3', 'Type': 'Laptop', 'Asset ID': 'LAP-0015', 'Purchase Date': '2023-08-10' },
        { 'Name': 'Dell UltraSharp 27', 'Type': 'Monitor', 'Asset ID': 'MON-0042', 'Purchase Date': '2023-09-01' },
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

/**
 * Parses an Excel file and extracts the structured JSON data for previewing.
 * @param {File} file - The file object from the input.
 * @returns {Promise<{assets: Array, employees: Array, roles: Array}>} A promise resolving to the parsed data.
 */
export const parsePreviewData = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const parsed = {
                    assets: [],
                    employees: [],
                    roles: []
                };

                if (workbook.SheetNames.includes('Assets')) {
                    const sheet = workbook.Sheets['Assets'];
                    parsed.assets = XLSX.utils.sheet_to_json(sheet);
                }
                if (workbook.SheetNames.includes('Employees')) {
                    const sheet = workbook.Sheets['Employees'];
                    parsed.employees = XLSX.utils.sheet_to_json(sheet);
                }
                if (workbook.SheetNames.includes('Roles')) {
                    const sheet = workbook.Sheets['Roles'];
                    parsed.roles = XLSX.utils.sheet_to_json(sheet);
                }

                const totalRecords = parsed.assets.length + parsed.employees.length + parsed.roles.length;
                if (totalRecords === 0) {
                    throw new Error("No data found in 'Assets', 'Employees', or 'Roles' sheets.");
                }

                resolve(parsed);
            } catch (err) {
                reject(new Error(err.message || 'Failed to parse Excel file preview.'));
            }
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file.'));
        };
        reader.readAsArrayBuffer(file);
    });
};
