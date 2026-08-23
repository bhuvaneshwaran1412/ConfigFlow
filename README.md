# ConfigFlow

## Software Configuration Management System

ConfigFlow is a web-based Software Configuration Management (SCM) system designed to manage software projects, modules, change requests, approvals, versions, release notes, audit logs, reports, and project assignments in a centralized platform.

The system provides role-based access for Administrators, Project Managers, and Developers, allowing each role to perform specific operations according to their responsibilities.

---

## Features

### Authentication & Role-Based Access

- Single login system
- Role-based access control
- Administrator, Project Manager, and Developer roles
- Multiple Project Managers and Developers
- Role-specific features and permissions
- Registration based on organization email domains

### Project Management

- Create projects
- Update projects
- Delete projects
- Assign Project Managers
- Assign Developers to projects
- View all projects
- Highlight assigned projects
- Restrict modification access based on project assignment

### Module Management

- Create and manage project modules
- Associate modules with projects
- View modules belonging to projects

### Change Request Management

- Submit software change requests
- Select project and module
- Set priority
- Add description
- Upload attachments
- View change request status
- Delete change requests
- Search change requests

### Approval Workflow

- Review pending change requests
- Approve change requests
- Reject change requests
- Add administrator/manager comments
- Record approval information

### Version Management

- Automatically create a new version after an approved change request
- Associate versions with projects
- Store version descriptions
- Store release dates

### Release Notes

- Generate release notes from approved changes
- Associate release notes with software versions

### Audit Logs

- Record important system activities
- Track users performing actions
- Store action details
- Store timestamps for activities

### Reports

- Change request reports
- Request statistics
- Project reports
- Version reports
- Project-wise request information

### Search

- Search projects
- Search modules
- Search change request titles
- Search request statuses

### Data Export

- Export project/report data to CSV

### File Attachments

- Upload files with change requests
- Store uploaded attachment information

### Dashboard

- Total projects
- Total developers
- Pending change requests
- Approved change requests
- Rejected change requests
- Latest version
- Recent change requests
- Project summary

---

## User Roles

| Role | Main Responsibilities |
|------|------------------------|
| Administrator | Manage projects, assign managers, manage users and oversee the system |
| Project Manager | Manage assigned projects, assign developers and review change requests |
| Developer | Work with assigned projects and submit change requests |

The system supports multiple Project Managers and Developers.

Assigned projects are highlighted, and users can modify or delete projects only when they have the required permissions.

---

## Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- Express.js

### Database

- MySQL

### Additional Technologies

- Multer for file uploads
- CORS
- dotenv
- Git
- GitHub

---

## Project Structure

```text
ConfigFlow/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   ├── projectController.js
│   ├── moduleController.js
│   ├── changeRequestController.js
│   ├── approvalController.js
│   ├── dashboardController.js
│   ├── reportController.js
│   ├── searchController.js
│   ├── versionController.js
│   ├── releaseNoteController.js
│   └── auditLogController.js
│
├── routes/
│   ├── authRoutes.js
│   ├── projectRoutes.js
│   ├── moduleRoutes.js
│   ├── changeRequestRoutes.js
│   ├── approvalRoutes.js
│   ├── dashboardRoutes.js
│   ├── reportRoutes.js
│   ├── searchRoutes.js
│   ├── versionRoutes.js
│   ├── releaseNoteRoutes.js
│   └── auditLogRoutes.js
│
├── public/
│   ├── html/
│   ├── css/
│   └── js/
│
├── uploads/
│
├── .env
├── .gitignore
├── app.js
├── package.json
├── package-lock.json
└── README.md
