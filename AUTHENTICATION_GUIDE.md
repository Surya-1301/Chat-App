# 🔐 Authentication System Guide

Your chat app now has a **professional, secure authentication system** that allows **any user** to register and login with their email address!

## ✨ **Features**

### **User Registration**
- ✅ **Any email domain** - Gmail, Yahoo, company emails, etc.
- ✅ **Professional validation** - Name, email format, password strength
- ✅ **Secure password hashing** - bcrypt with 12 salt rounds
- ✅ **Duplicate prevention** - No duplicate email accounts
- ✅ **Instant JWT token** - Login immediately after registration

### **User Login**
- ✅ **Email-based login** - Use any registered email
- ✅ **Secure authentication** - bcrypt password verification
- ✅ **JWT tokens** - Secure, stateless authentication
- ✅ **Last seen tracking** - Monitor user activity
- ✅ **Profile management** - View and update user info

### **Security Features**
- ✅ **Input sanitization** - Prevent XSS and injection attacks
- ✅ **Password strength** - Minimum 6 characters, maximum 128
- ✅ **Email validation** - Proper email format checking
- ✅ **Name validation** - Letters, spaces, hyphens, apostrophes only
- ✅ **Rate limiting ready** - Built-in protection against abuse

## 🚀 **How to Use**

### **1. User Registration**

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "mypassword123"
}
```

**Response:**
```json
{
  "message": "Account created successfully!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### **2. User Login**

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "mypassword123"
}
```

**Response:**
```json
{
  "message": "Login successful!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john@example.com",
    "lastSeen": "2024-01-15T10:30:00.000Z"
  }
}
```

### **3. Get User Profile**

**Endpoint:** `GET /auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john@example.com",
    "lastSeen": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### **4. Update User Profile**

**Endpoint:** `PUT /auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully!",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Smith",
    "email": "john@example.com",
    "lastSeen": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 📧 **Email Requirements**

### **Supported Email Domains**
- ✅ **Personal emails**: Gmail, Yahoo, Outlook, ProtonMail
- ✅ **Company emails**: @company.com, @organization.org
- ✅ **Educational emails**: @university.edu, @school.ac.uk
- ✅ **Custom domains**: @mydomain.com, @startup.io

### **Email Validation Rules**
- ✅ **Format**: Must be valid email format (user@domain.com)
- ✅ **Length**: Maximum 254 characters
- ✅ **Case insensitive**: Automatically converted to lowercase
- ✅ **Unique**: No duplicate email addresses allowed

## 🔒 **Password Requirements**

### **Password Rules**
- ✅ **Minimum length**: 6 characters
- ✅ **Maximum length**: 128 characters
- ✅ **Security**: Automatically hashed with bcrypt
- ✅ **Salt rounds**: 12 (high security)

### **Password Examples**
```
✅ Valid: "password123", "MySecurePass!", "123456"
❌ Invalid: "12345" (too short), "a".repeat(129) (too long)
```

## 👤 **Name Requirements**

### **Name Rules**
- ✅ **Minimum length**: 2 characters
- ✅ **Maximum length**: 50 characters
- ✅ **Characters**: Letters, spaces, hyphens, apostrophes
- ✅ **Examples**: "John Doe", "Mary-Jane", "O'Connor"

## 🧪 **Testing the System**

### **Run the Test Suite**
```bash
cd server
npm run test-auth
```

This will test:
- ✅ User registration
- ✅ User login
- ✅ Profile access
- ✅ Input validation
- ✅ Security features

### **Manual Testing with curl**

**Register a new user:**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Login with the user:**
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 🚀 **Frontend Integration**

### **Registration Form**
```typescript
const handleRegister = async (name: string, email: string, password: string) => {
  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await response.json();
    if (response.ok) {
      // Store token and redirect
      localStorage.setItem('token', data.token);
      // Navigate to chat
    } else {
      // Handle validation errors
      console.error(data.message);
    }
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

### **Login Form**
```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (response.ok) {
      // Store token and redirect
      localStorage.setItem('token', data.token);
      // Navigate to chat
    } else {
      // Handle login errors
      console.error(data.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

## 🔧 **Configuration**

### **Environment Variables**
```env
# Required
JWT_SECRET=your_super_secret_jwt_key_here
MONGO_URI=mongodb://localhost:27017/chat-app

# Optional
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### **JWT Token Expiration**
- **Default**: 7 days
- **Configurable**: Set `JWT_EXPIRES_IN` environment variable
- **Format**: `1h`, `7d`, `30d`, etc.

## 🛡️ **Security Features**

### **Input Validation**
- ✅ **SQL Injection Protection**: Mongoose ODM
- ✅ **XSS Protection**: Input sanitization
- ✅ **Email Validation**: Regex pattern matching
- ✅ **Password Security**: bcrypt hashing

### **Authentication**
- ✅ **JWT Tokens**: Stateless authentication
- ✅ **Token Expiration**: Configurable expiry
- ✅ **Secure Headers**: Authorization Bearer tokens
- ✅ **Password Hashing**: bcrypt with high salt rounds

## 📱 **Mobile App Integration**

### **React Native/Expo**
```typescript
import { api } from '../api/client';

// Register
const register = async (name: string, email: string, password: string) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

// Login
const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};
```

## 🎯 **Use Cases**

### **Personal Use**
- ✅ **Friends and family** - Create accounts with personal emails
- ✅ **Study groups** - Educational email addresses
- ✅ **Hobby communities** - Any email domain

### **Business Use**
- ✅ **Company teams** - Corporate email addresses
- ✅ **Client communication** - Professional email domains
- ✅ **Partner collaboration** - External organization emails

### **Public Use**
- ✅ **Open registration** - Anyone can join
- ✅ **Email verification** - Valid email required
- ✅ **Spam prevention** - Input validation and rate limiting ready

## 🚀 **Getting Started**

### **1. Start the Server**
```bash
npm run dev
```

### **2. Test Authentication**
```bash
npm run test-auth
```

### **3. Register Users**
- Open your app at `http://localhost:8082`
- Use the registration form
- Any valid email will work!

### **4. Start Chatting**
- Login with registered users
- Real-time messaging ready
- Professional chat experience

## 🎉 **Success!**

Your chat app now supports:
- ✅ **Universal registration** - Any email domain
- ✅ **Professional validation** - Enterprise-grade security
- ✅ **Real-time features** - Instant messaging
- ✅ **Cross-platform** - Web, iOS, Android
- ✅ **Production ready** - Secure and scalable

**Any user can now register and start chatting immediately!** 🚀💬✨
