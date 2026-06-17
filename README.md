# Asset Management System - Technical User Guide & Handover Document

## 1. Project Overview and Business Purpose
The Asset Management System is a modern, web-based application designed to streamline the lifecycle management of corporate assets. Built to serve both administrative personnel and general employees, the platform centralizes asset inventory, assignment tracking, borrow requests, and incident reporting. 

The primary business goal is to eliminate manual tracking, reduce asset loss, ensure accountability through a transparent chain of custody, and provide actionable insights into hardware utilization and maintenance needs.

---

## 2. Technology Stack

### Frontend
* **Core Framework**: React.js (v18+)
* **Styling & UI**: Tailwind CSS for a modern, responsive, and highly customizable design language.
* **Routing**: React Router v6
* **State Management**: React Context API (`AuthContext` for global auth/permission state) coupled with localized component state.
* **File Processing**: `xlsx` for parsing bulk-upload Excel sheets.

### Backend
* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: MongoDB (NoSQL) accessed via Mongoose ODM.
* **Authentication**: JSON Web Tokens (JWT) & `bcryptjs` for secure password hashing.
* **Emails/Notifications**: Nodemailer for transactional emails (e.g., password resets, request status updates).
* **Uploads**: `multer` for handling file parsing (Excel bulk uploads).

---

## 3. System Architecture Overview

The system follows a standard decoupled Client-Server architecture.
1. **Presentation Layer (Frontend)**: A Single Page Application (SPA) built with React. It communicates with the backend exclusively via RESTful HTTP requests.
2. **Business Logic Layer (Backend API)**: An Express.js server that handles routing, business validations, RBAC (Role-Based Access Control) enforcement, and data transformations.
3. **Data Layer (Database)**: A MongoDB database utilizing soft-deletes and Mongoose virtuals to maintain referential integrity without permanently destroying historical data.

---

## 4. Complete Module Breakdown

### User Management
Handles system access and authentication credentials. Defines the base `User` entity which holds email, password hash, and the assigned role.

### Employee Management
Separates business identity from authentication. The `Employee` module stores department details, official `employeeId`, and links back to the `User` account via reference. 

### Asset Management
The core inventory module. Tracks individual assets with unique `assetId`s, names, categories/types, and current status (`available`, `assigned`, `damaged`, `repair`, `retired`). Supports singular additions and bulk Excel imports.

### Asset Requests
Allows employees to browse the catalog of `available` assets and submit a "Borrow Request" specifying a reason and optional tentative return date. Admins review these in a centralized queue.

### Assignments
The chain-of-custody log. Once a request is approved (or an admin manually assigns an asset), an `Assignment` record is created. It tracks who has the asset, who authorized it, and when it is returned.

### Returns
When an employee no longer needs an asset, or it is recalled, the assignment is marked as returned, releasing the asset back to the `available` pool.

### Reports (Incidents & Maintenance)
Employees can file incident reports (e.g., "Damaged", "Lost") for assets currently assigned to them. Admins review these reports, transition the asset status to `repair`, and eventually mark them as `resolved` to make the asset available again.

### Roles & Permissions
A highly granular, dynamic Role-Based Access Control (RBAC) system. Admins can create custom roles and assign specific permission flags (e.g., `view_asset`, `manage_asset`, `approve_borrow`).

---

## 5. Detailed Feature List
* **Granular RBAC**: UI elements dynamically render based on the logged-in user's permissions (using `<CanAccess>` wrappers).
* **Bulk Asset Upload**: Drag-and-drop Excel file parser with pre-upload validation and error reporting for duplicate IDs.
* **Real-time Search & Filtering**: Debounced search inputs and multi-criteria filtering (by Category, Status) across all data tables.
* **Pagination**: Server-side and client-side pagination implementations to handle large datasets efficiently.
* **Status Badges**: Visual, color-coded indicators for asset health and request states.
* **Soft Deletes**: Deleting an entity flags it as `isDeleted: true` rather than destroying the row, preserving audit trails.
* **Transactional Emails**: Automated email dispatch for Password Reset OTPs and Borrow Request approvals/rejections.
* **Interactive Dashboards**: Role-specific landing pages showing KPIs, recent activities, and actionable pending tasks.
* **Responsive Design**: Mobile-friendly tables, forms, and navigation sidebar.

---

## 6. Folder Structure

### Frontend Structure (`/frontend/src/`)
* `/components/`: Reusable UI elements.
  * `/Admin/`: Admin-specific tables, forms (`AddAssetForm.js`), and modals.
  * `/Employee/`: Employee-specific views (`AssetCatalogCard.js`, `BorrowRequestModal.js`).
  * `/common/`: Shared logic like `DeleteConfirmModal.js`, `ProtectedRoute.js`, and `CanAccess.js`.
  * `/ui/`: Pure UI atoms (`Button.js`, `Modal.js`, `Badge.js`).
  * `/layout/`: Structural components (`DashboardLayout.js`, `ProfileModal.js`).
* `/pages/`: High-level route views (e.g., `AdminDashboard.js`, `EmployeeAssets.js`).
* `/services/`: Axios wrapper classes bridging frontend and backend APIs (`assetService.js`, `authService.js`).
* `/context/`: React context providers (`AuthContext.js`).
* `/constants/`: Shared configuration constants (roles, statuses).

### Backend Structure (`/server/`)
* `/controllers/`: Request handlers containing business logic.
* `/models/`: Mongoose schema definitions.
* `/routes/`: Express router definitions mapping URLs to controllers.
* `/middleware/`: Interceptors like `authMiddleware.js` (JWT validation) and `checkPermissions.js` (RBAC).
* `/plugins/`: Mongoose plugins (e.g., `softDelete.js`).
* `/utils/`: Helpers for email dispatching and token generation.

---

## 7. Database Design Overview

### Core Collections
1. **Users**: Authentication records (`email`, `password`, `displayName`, `role`).
2. **Employees**: Business profiles (`employeeId`, `department`, `userId`).
3. **Roles**: RBAC definitions (`name`, array of `permissions`).
4. **Permissions**: Seeded master list of available system actions.
5. **Assets**: Hardware inventory (`name`, `assetId`, `type`, `status`).
6. **Requests**: Pending borrow requests (`assetId`, `userId`, `status`, `reason`).
7. **Assignments**: Active and historical asset possession logs (`assetId`, `userId`, `assignedDate`, `returnedDate`).
8. **AssetReports**: Incident tickets (`assetId`, `employeeId`, `type`, `message`, `status`).

### Key Relationships
* **User ↔ Employee**: 1-to-1 relationship. Linked via `Employee.userId`. Mongoose virtuals stitch them together.
* **Asset ↔ Assignment**: 1-to-Many. An asset has a history of assignments, but only one active (where `returnedDate` is null).
* **Role ↔ Permission**: 1-to-Many. A Role holds references to multiple Permission ObjectIds.

---

## 8. REST API Overview

All endpoints are prefixed with `/api`.

### Authentication (`/api/auth`)
* `POST /login`: Authenticates user, returns JWT and user profile.
* `GET /profile`: Retrieves the current user's profile with populated Employee data.
* `POST /forgot-password` & `POST /reset-password`: OTP-based password recovery flow.

### Assets (`/api/assets`)
* `GET /`: Lists all assets (supports `?limit`, `?page`, `?search`).
* `POST /`: Creates a single asset.
* `POST /bulk-upload`: Accepts multipart/form-data Excel files for batch creation.
* `PUT /:id`: Updates asset details.
* `DELETE /:id`: Soft-deletes an asset.

### Assignments & Requests (`/api/assignments`, `/api/requests`)
* `GET /requests`: Lists pending borrow requests.
* `PUT /requests/:id/status`: Approves or rejects a request (triggers email and creates Assignment if approved).
* `POST /assignments/return`: Logs the return date of an active assignment.

### Reports (`/api/reports`)
* `POST /`: Employee submits a damage/loss report.
* `GET /`: Admin fetches all active and resolved reports.
* `PUT /:id/status`: Admin transitions a report to `in_progress` (marks asset `repair`) or `resolved`.

---

## 9. Error Handling Strategy

* **Frontend**: Axios interceptors catch 401/403 errors to trigger automatic logouts or display "Access Denied". Component-level state (`errorMsg`) captures and displays form validation errors gracefully using UI alerts.
* **Backend**: Controllers wrap logic in `try-catch` blocks. Known errors (e.g., duplicates) return `400 Bad Request` with descriptive JSON messages. Unhandled exceptions log to the console and return `500 Server Error` to avoid leaking stack traces to the client.

---

## 10. Security Features

1. **JWT Authentication**: Stateless, secure sessions using HTTP Bearer tokens.
2. **Password Hashing**: Passwords are never stored in plaintext (uses bcrypt with a secure salt round).
3. **Multi-layer RBAC**: 
   * *Frontend*: Navigation links and buttons are hidden if permissions are lacking. Routes are protected by `<PermissionRoute>`.
   * *Backend*: Endpoints enforce access using `checkPermissions('specific_permission')` middleware, preventing unauthorized direct API calls.
4. **Soft Deletes**: Deleting users or assets merely hides them, preserving historical data integrity in assignments and reports.

---

## 11. Application Workflow Examples

### Workflow: Asset Request Lifecycle
1. **Employee** navigates to "Assets" and clicks "Borrow Asset" on an available item.
2. **Employee** fills out the Request Modal (Reason, Tentative Return Date).
3. **Backend** creates a `Request` record with status `pending`.
4. **Admin** sees a notification badge on the Dashboard, navigates to "Requests".
5. **Admin** approves the request.
6. **Backend** transitions Request to `approved`, creates a new `Assignment` record, marks the `Asset` as `assigned`, and emails the Employee.

### Workflow: Damage Reporting
1. **Employee** discovers a broken laptop and navigates to "Report Damage".
2. **Employee** selects the specific asset from their currently assigned items and submits details.
3. **Backend** creates an `AssetReport` and immediately flags the `Asset` status as `damaged`.
4. **Admin** reviews the report, physically takes the laptop, and marks the report `in_progress`. The asset status transitions to `repair`.
5. Once repaired, **Admin** marks the report `resolved`, and the asset becomes `available` for checkout again.

---

## 12. Installation & Setup Guide

### Prerequisites
* Node.js (v16+)
* MongoDB instance (Local or Atlas)
* Git

### Environment Variables
Create `.env` files in both `/server` and `/frontend`, as given in `/server/.env.example` and `/frontend/.env.example`.

### Running Locally
1. **Database**: Ensure MongoDB is running.
2. **Backend**:
   ```bash
   cd server
   npm install
   npm run dev
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm start
   ```
4. Access the application at `http://localhost:3000`.

---

## 13. Development Standards Followed
* **Component Modularity**: Large files have been refactored into distinct, single-purpose components (e.g., `AssetCatalogCard`, `BorrowRequestModal`).
* **ES6+ Syntax**: Heavy use of destructuring, async/await, and arrow functions.
* **Consistent Naming Conventions**: PascalCase for React components, camelCase for variables/functions.

## 14. Troubleshooting Guide
* **Infinite Redirects on Login**: Ensure `AuthContext` is correctly decoding the JWT and setting user state. Verify the database roles match expected values.
* **Missing Assigned Names (Displays as `—`)**: Check the API payload. The system relies on `userId.displayName` or `employeeProfile.employeeId` being properly populated by Mongoose.
* **Bulk Upload Failing**: Ensure the Excel file contains the exact header columns expected by the backend parser (Name, Category, Asset ID).

---
*End of Document*
