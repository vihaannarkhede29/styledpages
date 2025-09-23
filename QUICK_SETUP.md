# Quick API Key Setup Guide

## 🚀 Get Your API Keys in 10 Minutes

### 1. Firebase API Key (2 minutes)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Go to Project Settings (gear icon) → General tab
4. Scroll down to "Your apps" section
5. Click "Add app" → Web app (</> icon)
6. Copy the `apiKey` value from the config object

### 2. Pexels API Key (1 minute)
1. Go to [Pexels API](https://www.pexels.com/api/)
2. Click "Get Started" or "Sign Up"
3. Sign up with email (free)
4. Go to your dashboard
5. Copy your API key

### 3. Google Gemini API Key (2 minutes)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the generated key

### 4. Update Your Files (5 minutes)

#### Option A: Quick Fix (Replace placeholders)
1. Open `firebase-config.js`
2. Replace `YOUR_FIREBASE_API_KEY_HERE` with your Firebase API key
3. Replace other placeholder values with your Firebase project details
4. Open `script.js`
5. Replace `YOUR_PEXELS_API_KEY_HERE` with your Pexels API key
6. Replace `YOUR_GEMINI_API_KEY_HERE` with your Gemini API key

#### Option B: Environment Variables (Recommended)
1. Copy `.env.example` to `.env`
2. Fill in your API keys in the `.env` file
3. Update your code to read from environment variables

### 5. Test Your Setup
1. Run `npm run dev`
2. Open http://localhost:3000
3. Check browser console for any errors
4. Try creating a PDF to test all APIs

## 🔧 Troubleshooting

**Firebase errors?**
- Make sure Authentication is enabled in Firebase Console
- Check that your domain is authorized

**Pexels not working?**
- Verify your API key is correct
- Check your API usage limits

**Gemini not responding?**
- Ensure your API key has proper permissions
- Check Google AI Studio for usage limits

## 📞 Need Help?
- Check the `SECURITY.md` file for detailed instructions
- Review the `README.md` for complete setup guide
- All placeholder values are clearly marked in the code
