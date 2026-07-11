# Student Course Allocation System

## Overview

The Student Course Allocation System is a full-stack web application that simplifies the process of managing students, courses, and course allocation. The system provides secure authentication, role-based access, real-time communication, and AI-assisted features to improve the overall allocation process.

This project was developed using React for the frontend, Node.js with Express for the backend, and PostgreSQL as the database.

---

## Features

* Secure User Authentication (JWT)
* Password Encryption using bcrypt
* Role-Based Access Control
* Student Management
* Course Management
* Course Allocation
* Real-Time Updates using Socket.IO
* AI Integration using OpenAI API
* PostgreSQL Database Integration
* RESTful API Architecture
* Responsive User Interface

---

## Technology Stack

### Frontend

* React.js

### Backend

* Node.js / Express.js

### Database

* PostgreSQL

## Project Structure

```
Student-Course-Allocation-System
│
├── frontend
│   ├── public
│   ├── src
│   └── package.json
│
├── backend
│   ├── controllers
│   ├── middleware
│   ├── routes
│   ├── models
│   ├── config
│   ├── package.json
│   └── server.js
│
└── README.md
```

---

## Installation

### Clone the Repository

```bash
git clone <repository-url>
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file inside the backend folder.

Example:

```
PORT=5000

DATABASE_URL=your_postgresql_connection_string

JWT_SECRET=your_secret_key

OPENAI_API_KEY=your_openai_api_key
```

---

## Database

Database: PostgreSQL

Create a PostgreSQL database and update the connection details in the `.env` file before starting the backend server.

---

## API Modules

* Authentication APIs
* Student APIs
* Course APIs
* Course Allocation APIs
* AI Integration APIs

---

## Security Features

* JWT Authentication
* Password Hashing using bcrypt
* Environment Variables for Sensitive Data
* Protected API Routes
* Input Validation

---

## AI Integration

The application integrates the OpenAI API to provide AI-powered functionality for users. The AI module is designed to improve user experience by generating intelligent responses based on application requirements.

---

## Real-Time Communication

Socket.IO is used to provide real-time communication and instant updates across connected users.

---

## Future Enhancements

* Email Notifications
* Admin Dashboard Analytics
* File Upload Support
* Performance Reports

---

## Deployment

Frontend:

* Vercel / Netlify

Backend:

* Render / Railway

Database:

* PostgreSQL (Supabase / Neon / Render PostgreSQL)

---

## Author

**Marees Waran**

Full Stack Developer

Technologies:
React • Node.js • Express • PostgreSQL

---

## License

This project was developed as part of a Full Stack Developer technical assessment and is intended for educational and evaluation purposes.
