# StyledPages - PDF Generator with Freemium Model

A professional PDF generator with authentication, usage tracking, and freemium features.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open in Browser
Go to: http://localhost:3000

## 🔥 Firebase Setup

The Firebase configuration is already set up in `firebase-config.js`. Make sure you have:

### Authentication Methods Enabled:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `styledpages-ace17`
3. Go to **Authentication** → **Sign-in method**
4. Enable:
   - ✅ **Email/Password**
   - ✅ **Google** (add your domain to authorized domains)

### Firestore Database:
1. Go to **Firestore Database**
2. Create database in **production mode**
3. Set up security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 Testing

Open browser console and run:

```javascript
// Check Firebase status
styledPagesTesting.auth.checkFirebase()

// Test authentication
styledPagesTesting.auth.getCurrentUser()

// Test word count limits
styledPagesTesting.testWordCount()

// Test PDF download limits
styledPagesTesting.simulateDownload()
```

## 📁 Project Structure

```
StyledPages/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles
├── script.js           # Main JavaScript application
├── server.js           # Express server for localhost
├── firebase-config.js  # Firebase configuration
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## 🎯 Features

- ✅ **Real Firebase Authentication** (Email/Password + Google)
- ✅ **Usage Tracking** (3 PDFs for free users)
- ✅ **Word Count Limits** (1000 words max for free)
- ✅ **Device Fingerprinting** (Prevents abuse)
- ✅ **Progressive Account Requirements**
- ✅ **Professional UI/UX**

## 🚀 Deployment

For production deployment, you can use:
- **Vercel**: `vercel --prod`
- **Netlify**: Connect your GitHub repo
- **Firebase Hosting**: `firebase deploy`

## 🔧 Development

- **Start server**: `npm start`
- **Development mode**: `npm run dev` (with auto-reload)
- **Generate PDF**: `npm run generate-pdf`