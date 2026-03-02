<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
</div>

<h1 align="center">📦 AidTrack</h1>

<p align="center">
  <b>A transparent, scalable relief distribution and inventory management system.</b>
</p>

## About the Project
AidTrack is a full-stack MERN application built to solve the logistical challenges of disaster relief. It allows organizations to securely manage dynamic stock inventory, register affected families (beneficiaries), and keep an immutable, trackable history of every item distributed. 

## Key Features
- **Custom JWT Authentication**: Robust, token-based security protecting sensitive API routes.
- **Role-Based Access Control**: Differentiated dashboard views and permissions for **Admins** and **Volunteers**.
- **Smart Inventory Tracking**: Complete CRUD capabilities for stock. Distributions intelligently deduct from inventory, and edits/deletions automatically restock items.
- **Beneficiary Registry**: A searchable, filterable database to track family IDs, locations, and demographics.
- **CSV Exportting**: One-click data exports for transparent donor reporting and offline auditing.
- **Server-Side Pagination**: Highly optimized data fetching for lightning-fast performance even with thousands of records.

## Tech Stack
* **Frontend:** React.js, Tailwind CSS, Axios, React Router Dom
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas, Mongoose
* **Security:** JSON Web Tokens (JWT), bcryptjs

## Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/aidtrack.git
cd aidtrack
```

### 2. Backend Setup
```bash
cd aidtrack-backend
npm install
```
Create a `.env` file in the `aidtrack-backend` folder and add:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
```
Start the backend server:
```bash
node server.js
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd aidtrack_frontend
npm install
```
Start the frontend development server:
```bash
npm start
```
By default, the frontend runs on `http://localhost:3000` and the backend on `http://localhost:5000`.

---
<p align="center"><i>Developed with ❤️ for efficient and transparent humanitarian aid.</i></p>
