# Enterprise Asset Management System

## Functional & Technical Design Document (FTDD) and Handover Package

---

# 1. Executive Summary

**System Purpose**
The Enterprise Asset Management System is a centralized, web-based platform designed to track the lifecycle of corporate hardware assets. It manages inventory states, chains of custody, employee borrowing requests, and incident/maintenance reporting.

**Business Problem Solved**
Replaces manual, spreadsheet-based asset tracking. Eliminates ambiguity regarding asset possession, reduces asset loss, enforces accountability via a digital chain of custody, and provides a transparent workflow for hardware requests and damage reporting.

**Target Users**

- **System Administrators / IT Managers**: Manage inventory, process bulk uploads, approve/reject borrow requests, manage users, configure RBAC roles, and oversee maintenance reports.
- **Employees / General Users**: Browse available assets, submit borrow requests, view their active assignments, and report damage/loss.

**High-Level Architecture**
A decoupled Client-Server architecture utilizing a React SPA frontend and an Express/Node.js REST API backend. Data persistence is handled by MongoDB, utilizing soft-deletes to maintain historical referential integrity.

---

# 2. Technology Stack Analysis

## Frontend

- **Framework**: React.js (v18+)
- **Libraries**: `axios` (HTTP client), `xlsx` (Excel parsing), `jwt-decode` (token decoding).
- **State Management**: React Context API (`AuthContext`), component-level `useState`/`useReducer`, custom hooks (`usePagination`, `useTableSort`).
- **UI Libraries**: Tailwind CSS (styling), `lucide-react` / SVG icons (iconography).
- **Routing**: `react-router-dom` v6 (Browser Router).
- **Validation**: Custom controlled-form validations with manual error state handling.

## Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM/ODM**: Mongoose
- **Authentication**: `jsonwebtoken` (JWT), `bcryptjs` (password hashing).
- **Email Services**: `nodemailer` (SMTP).
- **File Upload Libraries**: `multer` (multipart/form-data parsing for Excel).
- **Middleware**: `cors`, `express.json()`, custom `authMiddleware.js`, custom `checkPermissions.js`.

## Database

- **Collections**: `assets`, `users`, `employees`, `roles`, `permissions`, `requests`, `assignments`, `assetreports`.
- **Relationships**: NoSQL document references (`ObjectId` refs) stitched together via Mongoose `populate()` and virtual fields.

## Infrastructure

- **Environment Variables**: Managed via `.env` (`dotenv` in backend).
- **Deployment Assumptions**: Stateless backend designed to scale horizontally; frontend built statically (`npm run build`).

---

# 3. Complete Folder Structure Analysis

```text
frontend/
├── src/
│   ├── api/          # Base Axios configuration and interceptors
│   ├── components/   # Reusable UI architecture
│   │   ├── Admin/    # Admin-specific compound components (Tables, Modals, Forms)
│   │   ├── Employee/ # Employee-specific components (Cards, Forms)
│   │   ├── common/   # Agnostic shared logic (ProtectedRoute, CanAccess, SessionManager)
│   │   ├── layout/   # Structural shells (DashboardLayout, ProfileModal, Icons)
│   │   └── ui/       # Pure UI atoms (Button, Badge, Modal, Input, Pagination)
│   ├── constants/    # Hardcoded system constants (ASSET_STATUS, Roles)
│   ├── context/      # Global state providers (AuthContext)
│   ├── hooks/        # Custom React hooks (usePagination, useTableSort)
│   ├── pages/        # High-level route entry points (AdminDashboard, EmployeeAssets, LogIn)
│   ├── services/     # API bridge classes abstracting Axios calls
│   └── utils/        # Pure helper functions (excelUtils.js)

server/
├── config/           # Database connection logic
├── controllers/      # Route handlers and business logic execution
├── middleware/       # Express request interceptors (auth, permissions, upload)
├── models/           # Mongoose Schema definitions
├── plugins/          # Mongoose plugins (softDelete.js)
├── routes/           # Express router mappings (Controller to URL)
├── utils/            # Shared backend utilities (sendEmail.js, assetUtils.js)
└── validators/       # Request payload validators (assetValidator, employeeValidator)
```

---

# 4. Module Inventory

| Module             | Business Purpose                                           | Primary Users     | Related Database Entities |
| ------------------ | ---------------------------------------------------------- | ----------------- | ------------------------- |
| **Authentication** | Secure system access, session issuance, password recovery. | All Users         | `User`                    |
| **Employees**      | Business profiles linked to auth credentials.              | Admins            | `Employee`, `User`        |
| **Roles & Perms**  | Dynamic Role-Based Access Control configuration.           | Admins            | `Role`, `Permission`      |
| **Assets**         | Core inventory management (singular & bulk).               | Admins            | `Asset`                   |
| **Requests**       | Hardware borrowing workflows and approvals.                | Employees, Admins | `Request`, `Asset`        |
| **Assignments**    | Chain of custody and possession tracking.                  | Admins            | `Assignment`, `Asset`     |
| **Reports**        | Incident/Damage logging and maintenance tracking.          | Employees, Admins | `AssetReport`, `Asset`    |
| **Dashboard**      | Aggregated KPIs and quick-action access.                   | All Users         | All entities              |

---

# 5. Module Deep Dive

## 5.1 Authentication Module

- **Overview**: Handles login, JWT issuance, session validation, and OTP-based password resets.
- **Frontend Files**:
  - `pages/Auth/LogIn.js`: Login form, sets AuthContext.
  - `pages/Auth/ForgotPassword.js`: 3-step OTP recovery UI.
  - `context/AuthContext.js`: Global state holding JWT and permissions.
  - `components/common/SessionManager.js`: Background token expiration watcher.
- **Backend Files**: `controllers/authController.js`, `routes/authRoutes.js`.
- **Routes**:
  - `POST /api/auth/login`: Validates credentials, issues JWT.
  - `GET /api/auth/profile`: Returns populated user/employee profile.
  - `POST /api/auth/forgot-password`: Generates OTP, emails user.
  - `POST /api/auth/reset-password`: Consumes OTP, hashes new password.
- **Security**: Passwords hashed via `bcryptjs`. JWTs signed via `jsonwebtoken`.

## 5.2 Assets Module

- **Overview**: CRUD operations for hardware. Supports single additions and Excel bulk imports.
- **Frontend Files**:
  - `pages/Admin/AdminAssets.js`: Data table view with filters.
  - `components/Admin/AdminAssetsTable.js`: Sortable display table.
  - `components/Admin/forms/AssetForm.js`: Singular add/edit form.
  - `components/Admin/BulkUploadForm.js`: Drag-and-drop Excel processor.
  - `services/assetService.js`, `services/bulkUploadService.js`.
- **Backend Files**: `controllers/assetController.js`, `controllers/bulkUploadController.js`.
- **Models**: `Asset` (`name`, `type`, `assetId` [Unique], `purchaseDate`, `status`, `createdBy`).
- **Routes**:
  - `GET /api/assets`: Paginated inventory list. Populates active assignment logic.
  - `POST /api/assets`: Creates single asset.
  - `POST /api/assets/bulk-upload`: Parses `multer` file, skips duplicates.
  - `PUT /api/assets/:id`: Updates details.
  - `DELETE /api/assets/:id`: Soft deletes asset.
- **Validation**: Unique `assetId` enforcement. Bulk upload rejects missing mandatory columns.

## 5.3 Requests & Assignments Module

- **Overview**: Employees request assets -> Admin approves -> Assignment generated.
- **Frontend Files**:
  - `pages/Employee/EmployeeAssets.js`: Catalog view.
  - `components/Employee/BorrowRequestModal.js`: Submission form.
  - `pages/Admin/AdminRequests.js`: Approval queue.
  - `components/Admin/modals/RequestModals.js`: Approve/Reject dialogs.
- **Backend Files**: `controllers/requestController.js`, `controllers/assignmentController.js`.
- **Models**:
  - `Request` (`userId`, `assetType`, `requestedAssetId`, `reason`, `status`, `tentativeReturnDate`).
  - `Assignment` (`assetId`, `userId`, `assignedDate`, `returnedDate`).
- **Workflow**:
  1. Employee posts `Request` (`pending`).
  2. Admin calls `PUT /api/requests/:id/status` (`approved`).
  3. Controller creates `Assignment`, updates `Asset.status` to `assigned`, fires Nodemailer notification.

## 5.4 Reports (Maintenance) Module

- **Overview**: Damage logging and repair state management.
- **Frontend Files**:
  - `pages/Employee/EmployeeReport.js`: Submission UI.
  - `pages/Admin/AdminReports.js`: Centralized incident view.
  - `components/Admin/modals/AllReportsModal.js`: Management modal.
- **Backend Files**: `controllers/assetReportController.js`.
- **Models**: `AssetReport` (`assetId`, `employeeId`, `type` [damage/lost/maintenance], `message`, `status` [open/in_progress/resolved]).
- **Workflow**:
  1. Employee posts report. `Asset.status` immediately flags as `damaged`.
  2. Admin reviews, transitions report to `in_progress`. `Asset.status` becomes `repair`. Active `Assignment` is terminated (`returnedDate` set).
  3. Admin transitions report to `resolved`. `Asset.status` becomes `available`.

---

# 6. Frontend Architecture

- **Component Hierarchy**: Follows a strict Atomic Design-inspired pattern. Pages map to Routes. Pages compose Compound Components (`AdminAssetsTable`). Compound Components compose UI Atoms (`Button`, `Badge`, `Modal`).
- **Routing Structure**: `App.js` defines `BrowserRouter`. Routes are protected by `<ProtectedRoute>` (requires auth) and `<PermissionRoute permission="...">` (requires specific RBAC flag).
- **Modal System**: Modals are controlled locally via `isOpen` boolean states in parent components.
- **API Communication Flow**: Components call classes in `services/`. Services utilize a centralized `axios` instance (`api.js`) which injects the `Authorization: Bearer <token>` header automatically via interceptors.

---

# 7. Backend Architecture

- **Request Lifecycle**: Client Request -> Express Router -> Auth Middleware (Validates JWT) -> RBAC Middleware (Checks permission flag) -> Controller (Business Logic) -> Mongoose Model -> DB.
- **Soft Deletes**: Deleting a record updates `isDeleted: true` and `deletedAt: Date`. The `softDelete.js` Mongoose plugin automatically intercepts `.find()` and `.findOne()` queries to exclude `isDeleted: true` records, ensuring historical referential integrity is never broken for assignments or reports.
- **Error Handling Strategy**: Controllers wrap logic in `try-catch`. Validations throw 400s. Exceptions throw 500s.

---

# 8. Database Documentation

- **Users**: Stores auth. Soft-deleted. Unique constraint on `email`.
- **Employees**: Stores business identity. Soft-deleted. Virtual `userId` reference to Users.
- **Roles**: Array of `Permission` ObjectIds. Determines system access.
- **Assets**: Unique index on `assetId` (partial index ignoring deleted docs). Enum restricted statuses.
- **Assignments**: Tracks custody. A `null` `returnedDate` implies an active assignment.
- **AssetReports**: Tracks incidents. Enum restricted statuses (`open`, `in_progress`, `resolved`).

---

# 9. API Documentation Overview

_Note: All endpoints require JWT authentication unless specified._

- `POST /api/auth/login` (Public): Expects `{email, password}`. Returns Token.
- `GET /api/assets`: Supports `?search`, `?status`, `?page`, `?limit`. Returns `{ assets, pagination }`. Requires `view_assets` permission.
- `POST /api/assets/bulk-upload`: Consumes `multipart/form-data` containing `file`. Requires `manage_asset` permission.
- `PUT /api/requests/:id/status`: Expects `{ status: 'approved'|'rejected', assignedAssetId }`. Triggers email.
- `POST /api/reports`: Expects `{ assetId, type, message }`. Creates incident.
- `PUT /api/reports/:id/status`: Expects `{ status }`. Transitions asset states.

---

# 10. Security Documentation

- **Authentication**: Stateless JWTs stored in `localStorage` on the client. `SessionManager.js` proactively monitors expiration.
- **Password Storage**: `bcryptjs` encryption. Raw passwords are never logged or stored.
- **Authorization (RBAC)**: Custom `checkPermissions(...requiredPermissions)` Express middleware validates the requested action against the user's populated Role array directly in the backend, preventing Postman/Curl bypasses.
- **Input Validation**: Backend explicitly destructures expected payload fields, discarding unmapped injected JSON keys.

---

# 11. Environment Configuration

### Backend (`/server/.env`)

- `PORT`: Server port (e.g., 5000).
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: Cryptographic key for token signing.
- `EMAIL_USER`: SMTP authenticated email address for Nodemailer.
- `EMAIL_PASS`: SMTP app password.
- `FRONTEND_URL`: CORS origin definition.

### Frontend (`/frontend/.env`)

- `REACT_APP_API_URL`: Backend REST API URL (e.g., `http://localhost:5000/api`).

---

# 12. Known Technical Debt

1. **Client-Side Data Joining**: In some instances, the frontend maps/merges data arrays instead of utilizing robust MongoDB `$lookup` aggregation pipelines.
2. **Context Bloat**: `AuthContext` handles session logic, but standardizing it with a tool like Zustand or Redux could simplify dependency arrays.
3. **Missing Pagination**: The `Assignments` and `Requests` fetching mechanisms currently lack robust server-side pagination compared to the `Assets` module.

---

# 15. File-by-File Responsibility Matrix (Core)

| File                                              | Module      | Purpose                                                              |
| ------------------------------------------------- | ----------- | -------------------------------------------------------------------- |
| `server/controllers/assetController.js`           | Assets      | Handles Asset CRUD and mapping active assignments to asset payloads. |
| `server/controllers/assignmentController.js`      | Assignments | Creates and terminates chain of custody records.                     |
| `server/controllers/requestController.js`         | Requests    | Manages borrow workflows and triggers assignment generation.         |
| `server/models/Asset.js`                          | Assets      | Schema definition and unique indexing for hardware.                  |
| `server/middleware/checkPermissions.js`           | Security    | Express middleware blocking unauthorized API access.                 |
| `frontend/src/pages/Admin/AdminAssets.js`         | Assets      | Primary UI container for inventory management.                       |
| `frontend/src/components/Admin/BulkUploadForm.js` | Assets      | UI and logic for parsing Excel files via `xlsx`.                     |
| `frontend/src/services/api.js`                    | Global      | Central Axios instance handling JWT injection and interceptors.      |
| `frontend/src/context/AuthContext.js`             | Security    | React Provider maintaining global auth state.                        |
| `frontend/src/components/common/CanAccess.js`     | Security    | Component wrapper that hides children if permissions fail.           |

---
