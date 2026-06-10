const XLSX = require('xlsx');
const path = require('path');

// 1. Create assets excel
const assetsData = [
  {
    "Asset Name": "ThinkPad X1 Carbon",
    "Category": "Laptop",
    "Asset ID": "LAP-101",
    "Purchase Date": "2025-02-15",
    "Status": "available"
  },
  {
    "Asset Name": "iPhone 15 Pro Max",
    "Category": "Mobile",
    "Asset ID": "",
    "Purchase Date": "2025-03-10",
    "Status": "available"
  },
  {
    "Asset Name": "Dell 27 Monitor",
    "Category": "Monitor",
    "Asset ID": "MON-404",
    "Purchase Date": "2024-12-01",
    "Status": "available"
  },
  {
    "Asset Name": "Logitech MX Master 3S",
    "Category": "Mouse",
    "Asset ID": "",
    "Purchase Date": "2025-05-18",
    "Status": "available"
  }
];

const assetsWorksheet = XLSX.utils.json_to_sheet(assetsData);
const assetsWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(assetsWorkbook, assetsWorksheet, "Assets");

const assetsPath = path.resolve(__dirname, "../test_assets.xlsx");
XLSX.writeFile(assetsWorkbook, assetsPath);
console.log("test_assets.xlsx generated successfully!");

// 2. Create employees excel
const employeesData = [
  {
    "Name": "Sarah Jenkins",
    "Employee ID": "EMP-301",
    "Department": "Engineering",
    "Email": "sarah.j@test.com"
  },
  {
    "Name": "David Miller",
    "Employee ID": "EMP-302",
    "Department": "Marketing",
    "Email": "david.m@test.com"
  },
  {
    "Name": "Emily Watson",
    "Employee ID": "EMP-303",
    "Department": "Human Resources",
    "Email": "emily.w@test.com"
  },
  {
    "Name": "Michael Chang",
    "Employee ID": "EMP-304",
    "Department": "Engineering",
    "Email": "michael.c@test.com"
  }
];

const employeesWorksheet = XLSX.utils.json_to_sheet(employeesData);
const employeesWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(employeesWorkbook, employeesWorksheet, "Employees");

const employeesPath = path.resolve(__dirname, "../test_employees.xlsx");
XLSX.writeFile(employeesWorkbook, employeesPath);
console.log("test_employees.xlsx generated successfully!");
