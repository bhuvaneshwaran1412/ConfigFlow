# ConfigFlow

## Software Configuration Management System

ConfigFlow is a web-based Software Configuration Management (SCM) system designed to manage software projects, modules, change requests, approvals, versions, release notes, audit logs, reports, project assignments, and role-based access in a centralized platform.

The system provides different features and permissions for Administrators, Project Managers, and Developers.

---

## Features

### Authentication & Role-Based Access

* Single login system
* Role-based access control
* Administrator, Project Manager, and Developer roles
* Multiple Project Managers and Developers
* Role-specific features and permissions
* Role-based registration using organization email domains

### Project Management

* Create projects
* Edit projects
* Delete projects
* Assign Project Managers
* Assign Developers
* View all projects
* Highlight assigned projects
* Restrict modification based on project assignment

### Module Management

* Create and manage project modules
* Associate modules with projects
* View modules belonging to projects

### Change Request Management

* Submit software change requests
* Select project and module
* Set priority
* Add description
* Upload attachments
* View change request status
* Delete change requests
* Search change requests

### Approval Workflow

* Review pending change requests
* Approve change requests
* Reject change requests
* Add review comments
* Record approval information

### Version Management

* Automatically create a new version after an approved change request
* Associate versions with projects
* Store version descriptions
* Store release dates

### Release Notes

* Create release notes for software versions
* Associate release notes with versions
* Store change descriptions

### Audit Logs

* Record important system activities
* Track users performing actions
* Store action details
* Store timestamps

### Reports

* Change request reports
* Request statistics
* Project reports
* Version reports
* Project-wise request information

### Search

* Search projects
* Search modules
* Search change request titles
* Search request statuses

### CSV Export

* Export relevant project and SCM data to CSV
* Export report information for further analysis

### File Attachments

* Upload files with change requests
* Store attachment information
* Associate attachments with change requests

### Dashboard

* Total projects
* Total developers
* Pending requests
* Approved requests
* Rejected requests
* Latest version
* Recent change requests
* Project summary

---

## User Roles

| Role            | Responsibilities                                                       |
| --------------- | ---------------------------------------------------------------------- |
| Administrator   | Manage users, projects, assign Project Managers and oversee the system |
| Project Manager | Manage assigned projects, assign Developers and review change requests |
| Developer       | Work with assigned projects and submit change requests                 |

The system supports multiple Project Managers and Developers.

All users can view projects available to them, while assigned projects are highlighted. Modification permissions are controlled according to role and project assignment.

---

## Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MySQL

### Tools

* VS Code
* Git
* GitHub

### Additional Technologies

* MySQL2
* Multer
* CORS
* dotenv

---

## Project Workflow

```text
Administrator
      │
      ▼
Create Project
      │
      ▼
Assign Project Manager
      │
      ▼
Project Manager
      │
      ▼
Assign Developer
      │
      ▼
Developer
      │
      ▼
Submit Change Request
      │
      ▼
Review Change Request
      │
      ├───────────────┐
      ▼               ▼
   Approve          Reject
      │
      ▼
Create Version
      │
      ▼
Create Release Note
      │
      ▼
Create Audit Log
      │
      ▼
Update Reports
```

---

## Change Management Process

1. Administrator creates and manages projects.
2. Administrator assigns a Project Manager.
3. Project Manager assigns Developers to projects.
4. Developers work with their assigned projects.
5. Developer submits a change request.
6. Change request can include an attachment.
7. Authorized user reviews the request.
8. Request is approved or rejected.
9. Approved requests automatically create a new software version.
10. Release notes are created for the approved change.
11. The action is recorded in the audit log.
12. Dashboard and reports reflect the updated information.
13. Relevant information can be exported as CSV.

---

## Role-Based Project Access

### Administrator

* Manage projects
* Assign Project Managers
* Manage users
* Oversee system operations

### Project Manager

* View projects
* Identify assigned projects through highlighting
* Modify assigned projects
* Assign Developers
* Review change requests
* Approve or reject requests according to permissions

### Developer

* View projects
* Identify assigned projects through highlighting
* Work with assigned projects
* Submit change requests
* Upload attachments
* Cannot perform administrator-level operations

---

## Audit Trail

ConfigFlow maintains an audit trail for important system activities.

Audit records include:

* User
* Action
* Details
* Timestamp

This provides traceability and accountability for configuration management activities.

---

## Reports & Analytics

The reporting module provides information about:

* Change requests
* Request status
* Projects
* Versions
* Project-wise requests
* Request statistics

Reports can also be exported as CSV for further analysis.

---

## File Management

The system supports file attachments for change requests.

Users can attach relevant files while submitting a change request, allowing supporting documents to be associated with configuration changes.

---

## Project Architecture

```text
┌──────────────────────────────┐
│          Frontend            │
│      HTML / CSS / JS         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       Express.js API         │
│         Node.js              │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│          MySQL               │
│        Database              │
└──────────────────────────────┘
```

---

## Key SCM Workflow

```text
Project
   ↓
Project Assignment
   ↓
Module
   ↓
Change Request
   ↓
Review
   ↓
Approval / Rejection
   ↓
Version
   ↓
Release Note
   ↓
Audit Log
   ↓
Reports
```

---

## Security & Access Control

* Role-based access control
* Project assignment-based permissions
* Restricted modification of unassigned projects
* Protected environment configuration
* Controlled access to administrative features

---

## Future Enhancements

* Email notifications
* Advanced analytics and visual dashboards
* Cloud file storage
* Automated deployment
* Git repository integration
* Advanced permission management

---

## Project Status

**Completed**

ConfigFlow is a functional Software Configuration Management project developed using HTML, CSS, JavaScript, Node.js, Express.js, and MySQL.

---

## Purpose

ConfigFlow demonstrates how Software Configuration Management concepts can be implemented in a practical web-based system.

It provides a centralized workflow for managing software projects and changes from project assignment and change request submission through review, approval, version creation, release documentation, audit tracking, reporting, and data export.

---
