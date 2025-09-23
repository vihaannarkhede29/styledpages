# Security Notice

## ⚠️ API Keys Exposed - Action Required

**CRITICAL**: This repository previously contained exposed API keys that have been removed. If you're using this codebase, you must:

### 1. Replace All API Keys
- **Firebase API Key**: Get from [Firebase Console](https://console.firebase.google.com/)
- **Pexels API Key**: Get from [Pexels API](https://www.pexels.com/api/)
- **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 2. Update Configuration Files
1. Copy `.env.example` to `.env` and fill in your actual API keys
2. Update `firebase-config.js` with your Firebase configuration
3. Update `script.js` with your API keys (or use environment variables)

### 3. Security Best Practices
- ✅ Never commit API keys to version control
- ✅ Use environment variables for sensitive data
- ✅ Add `firebase-config.js` and `.env` to `.gitignore`
- ✅ Rotate API keys if they were previously exposed
- ✅ Monitor API usage for unauthorized access

### 4. If Your Keys Were Exposed
1. **Immediately rotate all exposed API keys**
2. **Check API usage logs** for unauthorized access
3. **Update all services** with new keys
4. **Review security settings** in each service

## Files Modified for Security
- `firebase-config.js` - API keys replaced with placeholders
- `script.js` - Pexels and Gemini API keys replaced with placeholders
- All test files - API keys replaced with placeholders
- `.gitignore` - Added configuration files to prevent future exposure
- `.env.example` - Created template for environment variables

## Next Steps
1. Set up your own API keys following the setup guide in README.md
2. Test the application with your new keys
3. Consider implementing server-side API key management for production
