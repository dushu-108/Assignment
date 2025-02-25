# Resume Analysis API

A Node.js backend application for analyzing resumes using Google's Gemini AI.

## Features
- JWT Authentication
- PDF Text Extraction
- Resume Data Analysis using Google Gemini AI
- MongoDB Integration
- Encrypted Data Storage

## API Endpoints

### 1. Authentication
```
POST /auth/login
```
Request Body:
```json
{
    "username": "naval.ravikant",
    "password": "05111974"
}
```

### 2. Resume Processing
```
POST /resume/process
```
Headers:
- Authorization: Bearer {jwt_token}

Request Body:
```json
{
    "url": "https://www.dhli.in/uploaded_files/resumes/resume_3404.pdf"
}
```

### 3. Resume Search
```
POST /resume/search
```
Headers:
- Authorization: Bearer {jwt_token}

Request Body:
```json
{
    "name": "prabhat bhardwaj"
}
```

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create .env file with:
```
PORT=4000
JWT_SECRET=your-256-bit-secure-jwt-secret-key-2025
GEMINI_API_KEY=your-gemini-api-key
MONGO_URI=your-mongodb-uri
```

3. Start the server:
```bash
npm start
```

## Technologies Used
- Node.js
- Express.js
- MongoDB
- Google Gemini AI
- JWT Authentication
- PDF Parse
- Crypto for data encryption

## Security Features
- JWT-based authentication
- Encrypted storage of sensitive data
- Environment variables for secure configuration
- Bearer token authorization
