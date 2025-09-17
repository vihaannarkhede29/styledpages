// Analytics Helper
function trackEvent(eventName, properties = {}) {
    if (window.va) {
        window.va('track', eventName, properties);
    }
    console.log('Analytics Event:', eventName, properties);
}

// Authentication System
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userData = null; // Additional user data from Firestore
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeFirebaseAuth();
    }

    async initializeFirebaseAuth() {
        // Wait for Firebase to be available
        const checkFirebase = () => {
            if (window.firebaseAuth && window.firebaseOnAuthStateChanged) {
                console.log('Firebase Auth available, setting up auth state listener');
                this.setupAuthStateListener();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }

    setupAuthStateListener() {
        window.firebaseOnAuthStateChanged(window.firebaseAuth, async (user) => {
            if (user) {
                console.log('User signed in:', user);
                this.currentUser = user;
                await this.loadUserData(user.uid);
                this.updateUI();
                
                // Refresh usage tracker with new user tier
                if (window.styledPages && window.styledPages.usageTracker) {
                    window.styledPages.usageTracker.refreshUserTier();
                }
            } else {
                console.log('User signed out');
                this.currentUser = null;
                this.userData = null;
                this.updateUI();
                
                // Refresh usage tracker with anonymous tier
                if (window.styledPages && window.styledPages.usageTracker) {
                    window.styledPages.usageTracker.refreshUserTier();
                }
            }
        });
    }

    async loadUserData(uid) {
        try {
            const userDoc = await window.firebaseGetDoc(window.firebaseDoc(window.firebaseDb, 'users', uid));
            if (userDoc.exists()) {
                this.userData = userDoc.data();
                console.log('User data loaded:', this.userData);
            } else {
                // Create new user document
                this.userData = {
                    tier: 'free',
                    downloadsThisMonth: 0,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };
                await this.saveUserData(uid);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Fallback to default user data
            this.userData = {
                tier: 'free',
                downloadsThisMonth: 0,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
        }
    }

    async saveUserData(uid) {
        try {
            await window.firebaseSetDoc(window.firebaseDoc(window.firebaseDb, 'users', uid), this.userData);
            console.log('User data saved');
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    bindEvents() {
        // Account button
        const accountBtn = document.getElementById('accountBtn');
        if (accountBtn) {
            accountBtn.addEventListener('click', () => this.toggleAccountModal());
        }

        // Modal close button
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideAccountModal());
        }

        // Form switching
        const switchToLogin = document.getElementById('switchToLogin');
        const switchToSignup = document.getElementById('switchToSignup');
        
        if (switchToLogin) {
            switchToLogin.addEventListener('click', () => this.showLoginForm());
        }
        if (switchToSignup) {
            switchToSignup.addEventListener('click', () => this.showSignupForm());
        }

        // Form submissions
        const submitAccount = document.getElementById('submitAccount');
        const submitLogin = document.getElementById('submitLogin');
        
        if (submitAccount) {
            submitAccount.addEventListener('click', () => this.handleSignup());
        }
        if (submitLogin) {
            submitLogin.addEventListener('click', () => this.handleLogin());
        }

        // Google Sign-In button
        const googleSignIn = document.getElementById('googleSignIn');
        if (googleSignIn) {
            googleSignIn.addEventListener('click', () => this.handleGoogleSignIn());
        }

        // Close modal on outside click
        const modal = document.getElementById('accountModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAccountModal();
                }
            });
        }

        // Initialize Google Sign-In when Google library loads
        this.initializeGoogleSignIn();
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getUserTier() {
        return this.userData ? this.userData.tier : 'anonymous_free';
    }

    toggleAccountModal() {
        if (this.isLoggedIn()) {
            this.showAccountMenu();
        } else {
            this.showAccountModal();
        }
    }

    showAccountModal() {
        const modal = document.getElementById('accountModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.showSignupForm();
        }
    }

    hideAccountModal() {
        const modal = document.getElementById('accountModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            this.clearForms();
        }
    }

    showSignupForm() {
        document.getElementById('accountForm').style.display = 'block';
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('submitAccount').style.display = 'block';
        document.getElementById('submitLogin').style.display = 'none';
        document.getElementById('switchToLogin').style.display = 'block';
        document.getElementById('switchToSignup').style.display = 'none';
        document.getElementById('modalTitle').textContent = 'Create Free Account';
    }

    showLoginForm() {
        document.getElementById('accountForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('submitAccount').style.display = 'none';
        document.getElementById('submitLogin').style.display = 'block';
        document.getElementById('switchToLogin').style.display = 'none';
        document.getElementById('switchToSignup').style.display = 'block';
        document.getElementById('modalTitle').textContent = 'Sign In';
    }

    clearForms() {
        // Clear all form inputs
        const inputs = document.querySelectorAll('#accountModal input');
        inputs.forEach(input => {
            input.value = '';
            input.classList.remove('error');
        });

        // Clear error messages
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.style.display = 'none');
    }

    async handleSignup() {
        const email = document.getElementById('userEmailInput').value;
        const password = document.getElementById('userPasswordInput').value;
        const confirmPassword = document.getElementById('confirmPasswordInput').value;
        const acceptTerms = document.getElementById('acceptTerms').checked;

        // Validation
        if (!this.validateSignupForm(email, password, confirmPassword, acceptTerms)) {
            return;
        }

        // Show loading state
        const submitBtn = document.getElementById('submitAccount');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating Account...';
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            // Create user with Firebase Auth
            const userCredential = await window.firebaseSignUp(window.firebaseAuth, email, password);
            const user = userCredential.user;
            
            console.log('User created:', user);

            // Create user document in Firestore
            this.userData = {
                tier: 'free',
                downloadsThisMonth: 0,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                email: user.email,
                displayName: user.displayName || null
            };

            await this.saveUserData(user.uid);

            // Update UI
            this.updateUI();
            this.hideAccountModal();

            // Show success message
            alert('Account created successfully! You now have 3 free PDFs this month.');

        } catch (error) {
            console.error('Signup error:', error);
            let errorMessage = 'Error creating account. Please try again.';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists. Please sign in instead.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please choose a stronger password.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            }
            
            alert(errorMessage);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmailInput').value;
        const password = document.getElementById('loginPasswordInput').value;

        // Basic validation
        if (!email || !password) {
            alert('Please fill in all fields.');
            return;
        }

        // Show loading state
        const submitBtn = document.getElementById('submitLogin');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing In...';
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            // Sign in with Firebase Auth
            const userCredential = await window.firebaseSignIn(window.firebaseAuth, email, password);
            const user = userCredential.user;
            
            console.log('User signed in:', user);

            // Update last login time
            this.userData.lastLogin = new Date().toISOString();
            await this.saveUserData(user.uid);

            // Update UI
            this.updateUI();
            this.hideAccountModal();

            alert('Welcome back!');

        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Invalid email or password. Please try again.';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email. Please sign up instead.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            }
            
            alert(errorMessage);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    validateSignupForm(email, password, confirmPassword, acceptTerms) {
        let isValid = true;

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            this.showFieldError('userEmailInput', 'Please enter a valid email address.');
            isValid = false;
        }

        // Password validation
        if (!password || password.length < 6) {
            this.showFieldError('userPasswordInput', 'Password must be at least 6 characters.');
            isValid = false;
        }

        // Confirm password validation
        if (password !== confirmPassword) {
            this.showFieldError('confirmPasswordInput', 'Passwords do not match.');
            isValid = false;
        }

        // Terms acceptance
        if (!acceptTerms) {
            alert('Please accept the Terms of Service and Privacy Policy.');
            isValid = false;
        }

        return isValid;
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form-group');
        
        formGroup.classList.add('error');
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        formGroup.appendChild(errorDiv);
    }

    showAccountMenu() {
        // For now, just show logout option
        const action = confirm(`Logged in as: ${this.currentUser.email}\n\nClick OK to logout, Cancel to stay logged in.`);
        if (action) {
            this.logout();
        }
    }

    async logout() {
        try {
            await window.firebaseSignOut(window.firebaseAuth);
            console.log('User logged out');
        } catch (error) {
            console.error('Logout error:', error);
            // Still update UI even if logout fails
            this.currentUser = null;
            this.userData = null;
            this.updateUI();
        }
    }

    updateUI() {
        const userEmail = document.getElementById('userEmail');
        const accountBtn = document.getElementById('accountBtn');
        
        if (this.isLoggedIn()) {
            if (userEmail) {
                userEmail.textContent = this.currentUser.email;
                userEmail.style.display = 'block';
            }
            if (accountBtn) {
                accountBtn.textContent = 'Logout';
            }
        } else {
            if (userEmail) {
                userEmail.style.display = 'none';
            }
            if (accountBtn) {
                accountBtn.textContent = 'Account';
            }
        }
    }

    initializeGoogleSignIn() {
        // Wait for Google library to load
        const checkGoogle = () => {
            if (typeof google !== 'undefined' && google.accounts) {
                console.log('Google Sign-In library loaded');
                this.setupGoogleSignIn();
            } else {
                setTimeout(checkGoogle, 100);
            }
        };
        checkGoogle();
    }

    setupGoogleSignIn() {
        try {
            // Initialize Google Sign-In
            google.accounts.id.initialize({
                client_id: 'YOUR_GOOGLE_CLIENT_ID', // You'll need to replace this
                callback: (response) => this.handleGoogleCallback(response)
            });
            console.log('Google Sign-In initialized');
        } catch (error) {
            console.error('Error initializing Google Sign-In:', error);
        }
    }

    async handleGoogleSignIn() {
        try {
            // Show loading state
            const googleBtn = document.getElementById('googleSignIn');
            const originalText = googleBtn.innerHTML;
            googleBtn.innerHTML = '<span class="loading"></span> Signing in...';
            googleBtn.disabled = true;

            // Sign in with Google using Firebase
            const result = await window.firebaseSignInWithPopup(window.firebaseAuth, window.firebaseGoogleProvider);
            const user = result.user;
            
            console.log('Google Sign-In successful:', user);

            // Create or update user document
            this.userData = {
                tier: 'free',
                downloadsThisMonth: 0,
                createdAt: this.userData?.createdAt || new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                provider: 'google'
            };

            await this.saveUserData(user.uid);

            // Update UI
            this.updateUI();
            this.hideAccountModal();

            alert(`Welcome ${user.displayName || user.email}! You're now signed in with Google.`);

        } catch (error) {
            console.error('Google Sign-In error:', error);
            let errorMessage = 'Google Sign-In failed. Please try again.';
            
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign-in was cancelled. Please try again.';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'Popup was blocked. Please allow popups and try again.';
            }
            
            alert(errorMessage);
        } finally {
            // Reset button
            const googleBtn = document.getElementById('googleSignIn');
            googleBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
            `;
            googleBtn.disabled = false;
        }
    }

    async handleGoogleCallback(response) {
        try {
            console.log('Google Sign-In response:', response);

            // In production, you would decode the JWT token here
            // For demo, we'll create a mock user
            const mockUser = {
                email: 'user@gmail.com',
                name: 'Google User',
                picture: 'https://via.placeholder.com/40',
                sub: 'google_user_123'
            };

            // Create user account
            const userAccount = {
                email: mockUser.email,
                name: mockUser.name,
                picture: mockUser.picture,
                provider: 'google',
                tier: 'free',
                createdAt: new Date().toISOString(),
                downloadsThisMonth: 0
            };

            // Store user data
            localStorage.setItem('userAccount', JSON.stringify(userAccount));
            this.currentUser = userAccount;

            // Update UI
            this.updateUI();
            this.hideAccountModal();

            // Refresh usage tracker with new user tier
            if (window.styledPages && window.styledPages.usageTracker) {
                window.styledPages.usageTracker.refreshUserTier();
            }

            // Show success message
            alert(`Welcome ${mockUser.name}! You're now signed in with Google.`);

            console.log('Google Sign-In successful:', userAccount);

        } catch (error) {
            console.error('Error processing Google Sign-In:', error);
            alert('Error processing Google Sign-In. Please try again.');
        } finally {
            // Reset button
            const googleBtn = document.getElementById('googleSignIn');
            googleBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
            `;
            googleBtn.disabled = false;
        }
    }
}

// Usage Tracking System
class UsageTracker {
    constructor() {
        this.deviceId = this.getOrCreateDeviceId();
        this.monthlyKey = `usage_${new Date().getMonth()}_${new Date().getFullYear()}`;
        this.userTier = this.getUserTier();
        this.init();
    }

    init() {
        console.log('UsageTracker initialized:', {
            deviceId: this.deviceId,
            monthlyKey: this.monthlyKey,
            userTier: this.userTier,
            currentUsage: this.getMonthlyUsage()
        });
        this.updateUsageDisplay();
    }

    getOrCreateDeviceId() {
        // Try to get existing device ID from multiple sources
        let deviceId = localStorage.getItem('deviceId') || 
                      sessionStorage.getItem('deviceId') || 
                      this.getCookie('deviceId');
        
        if (!deviceId) {
            deviceId = this.generateDeviceFingerprint();
            // Store in multiple places for persistence
            localStorage.setItem('deviceId', deviceId);
            sessionStorage.setItem('deviceId', deviceId);
            this.setCookie('deviceId', deviceId, 365); // 1 year
        }
        return deviceId;
    }

    generateDeviceFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('StyledPages Device ID', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL(),
            navigator.platform,
            navigator.cookieEnabled ? '1' : '0'
        ].join('|');
        
        // Create a shorter, more stable ID
        return btoa(fingerprint).substring(0, 16);
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    getUserTier() {
        // Check if user is logged in via Firebase
        if (window.styledPages && window.styledPages.authManager) {
            return window.styledPages.authManager.getUserTier();
        }
        return 'anonymous_free';
    }

    // Method to refresh user tier (called when auth state changes)
    refreshUserTier() {
        this.userTier = this.getUserTier();
        this.updateUsageDisplay();
        console.log('User tier refreshed:', this.userTier);
    }

    getMaxDownloads() {
        const tiers = {
            'anonymous_free': 3,
            'free': 3,
            'pro': -1, // unlimited
            'enterprise': -1
        };
        return tiers[this.userTier] || 3;
    }

    getMonthlyUsage() {
        const usage = localStorage.getItem(this.monthlyKey);
        return usage ? parseInt(usage) : 0;
    }

    canDownloadPDF() {
        // Get usage from Firebase user data if available, otherwise fallback to localStorage
        let monthlyUsage;
        if (window.styledPages && window.styledPages.authManager && window.styledPages.authManager.userData) {
            monthlyUsage = window.styledPages.authManager.userData.downloadsThisMonth || 0;
        } else {
            monthlyUsage = this.getMonthlyUsage();
        }
        
        const maxDownloads = this.getMaxDownloads();
        
        console.log('PDF download check:', {
            usage: monthlyUsage,
            max: maxDownloads,
            canDownload: monthlyUsage < maxDownloads || maxDownloads === -1,
            userTier: this.userTier,
            hasAccount: this.hasAccount()
        });
        
        // Check word count limit for free users (max 1000 words)
        if (this.userTier === 'free' || this.userTier === 'anonymous_free') {
            const wordCount = this.getCurrentWordCount();
            
            if (wordCount > 1000) {
                this.showWordCountPrompt();
                return false;
            }
        }
        
        if (monthlyUsage >= maxDownloads - 1 && !this.hasAccount()) {
            this.showAccountPrompt();
            return false;
        }
        
        if (monthlyUsage >= maxDownloads) {
            this.showUpgradePrompt();
            return false;
        }
        
        return true;
    }

    async trackDownload() {
        if (!this.canDownloadPDF()) {
            console.log('Download blocked - limit reached');
            return false;
        }
        
        // Update Firebase user data if available
        if (window.styledPages && window.styledPages.authManager && window.styledPages.authManager.userData) {
            const current = window.styledPages.authManager.userData.downloadsThisMonth || 0;
            const newUsage = current + 1;
            
            // Update the user data in memory
            window.styledPages.authManager.userData.downloadsThisMonth = newUsage;
            
            // Save to Firebase
            try {
                await window.styledPages.authManager.saveUserData(window.styledPages.authManager.currentUser.uid);
                console.log('PDF download tracked in Firebase:', {
                    previous: current,
                    current: newUsage,
                    max: this.getMaxDownloads()
                });
            } catch (error) {
                console.error('Error saving download count to Firebase:', error);
                // Fallback to localStorage
                const currentLocal = this.getMonthlyUsage();
                const newUsageLocal = currentLocal + 1;
                localStorage.setItem(this.monthlyKey, newUsageLocal);
            }
        } else {
            // Fallback to localStorage for anonymous users
            const current = this.getMonthlyUsage();
            const newUsage = current + 1;
            localStorage.setItem(this.monthlyKey, newUsage);
            
            console.log('PDF download tracked in localStorage:', {
                previous: current,
                current: newUsage,
                max: this.getMaxDownloads()
            });
        }
        
        this.updateUsageDisplay();
        return true;
    }

    hasAccount() {
        // Check if user is authenticated with Firebase
        if (window.styledPages && window.styledPages.authManager && window.styledPages.authManager.currentUser) {
            return true;
        }
        // Fallback to localStorage check
        return localStorage.getItem('userAccount') !== null;
    }

    showAccountPrompt() {
        console.log('Showing account creation prompt');
        // For now, just log - we'll add UI later
        alert('You\'ve used 2 of your 3 free PDFs this month. Create a free account to get 1 more PDF, or upgrade to Pro for unlimited downloads.');
    }

    showUpgradePrompt() {
        console.log('Showing upgrade prompt');
        // For now, just log - we'll add UI later
        alert('You\'ve reached your monthly limit of 3 PDFs. Upgrade to Pro for unlimited downloads starting at $9.99/month.');
    }

    getCurrentWordCount() {
        const contentInput = document.getElementById('contentInput');
        if (!contentInput) return 0;
        
        const content = contentInput.value.trim();
        if (!content) return 0;
        
        // Count words (split by whitespace and filter out empty strings)
        const words = content.split(/\s+/).filter(word => word.length > 0);
        return words.length;
    }

    showWordCountPrompt() {
        const wordCount = this.getCurrentWordCount();
        const overLimit = wordCount - 1000;
        
        console.log('Showing word count prompt');
        alert(`Free plan allows PDFs up to 1000 words. Your document has ${wordCount} words (${overLimit} over the limit). Upgrade to Pro to create PDFs of any length.`);
    }

    updateUsageDisplay() {
        const usage = this.getMonthlyUsage();
        const max = this.getMaxDownloads();
        const displayText = max === -1 ? 
            `Pro Plan: ${usage} PDFs downloaded this month` : 
            `Free Plan: ${usage}/${max} PDFs this month`;
        
        console.log('Usage display updated:', displayText);
        
        // Update UI if elements exist
        const usageText = document.getElementById('usageText');
        const usageBar = document.getElementById('usageStatusBar');
        
        if (usageText) {
            usageText.textContent = displayText;
        }
        
        // Show/hide usage bar based on usage
        if (usageBar) {
            if (usage > 0 || this.userTier !== 'anonymous_free') {
                usageBar.style.display = 'flex';
                document.body.classList.add('has-usage-bar');
            } else {
                usageBar.style.display = 'none';
                document.body.classList.remove('has-usage-bar');
            }
        }
    }

    resetMonthlyUsage() {
        localStorage.removeItem(this.monthlyKey);
        this.updateUsageDisplay();
        console.log('Monthly usage reset');
    }

    // Method to manually set user tier for testing
    setUserTier(tier) {
        const account = {
            tier: tier,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('userAccount', JSON.stringify(account));
        this.userTier = tier;
        this.updateUsageDisplay();
        console.log('User tier set to:', tier);
    }
}

// StyledPages - Content to PDF Converter
class StyledPages {
    constructor() {
        this.currentTheme = 'professional';
        this.titleFont = 'Inter';
        this.headerFont = 'Inter';
        this.bodyFont = 'Inter';
        this.titleColor = '#1e293b';
        this.headerColor = '#1e293b';
        this.bodyColor = '#1e293b';
        this.accentColor = '#3b82f6';
        this.titleSize = 32;
        this.headerSize = 24;
        this.bodySize = 14;
        this.marginTop = 1;
        this.marginBottom = 1;
        this.marginLeft = 1;
        this.marginRight = 1;
        console.log('Initial margins:', { top: this.marginTop, bottom: this.marginBottom, left: this.marginLeft, right: this.marginRight });
        this.textAlignment = 'left';
        this.titleAlignment = 'left';
        this.headerAlignment = 'left';
        this.bodyAlignment = 'left';
        
        // Detection patterns
        this.detectionPatterns = {
            title: "contains '–' or '—', starts with capital, length 5-100",
            header: "starts with number., short descriptive text, length 5-100",
            subheader: "short descriptive, no numbers, length 5-80",
            list: "starts with -, •, *, or indented"
        };
        this.lineSpacing = 1.5;
        this.pageSize = 'letter';
        this.sectionPageBreak = true;
        this.subsectionPageBreak = true;
        this.showPageNumbers = true;
        this.inputMode = 'markdown'; // 'plain' or 'markdown'
        this.geminiApiKey = 'AIzaSyDlYQ4Qi9OyazHxWm8WTdWV3bw6or09ry8';
        
        // Initialize authentication and usage tracking
        this.authManager = new AuthManager();
        this.usageTracker = new UsageTracker();
        
        this.init();
    }

    async init() {
        this.bindEvents();
        this.applyThemePreset('professional');
        this.updateInputPlaceholder();
        this.syncInputModeRadio();
        this.testMarginFunctionality();
        
        // Automatically load demo content with custom styling
        const contentInput = document.getElementById('contentInput');
        if (contentInput) {
            // Set custom font and colors for demo
            this.titleFont = 'Inter';
            this.headerFont = 'Inter';
            this.bodyFont = 'Inter';
            this.titleColor = '#1e293b';
            this.headerColor = '#1e293b';
            this.bodyColor = '#1e293b';
            this.accentColor = '#3b82f6';
            
            // Load demo content automatically
            await this.loadDemoContent();
            console.log('Demo content loaded automatically with custom styling');
        }
        
        // Delay preview update to ensure DOM is ready
        setTimeout(async () => {
            this.updatePreview();
            this.updateInputStats();
        }, 100);
    }
    
    testMarginFunctionality() {
        console.log('Testing margin functionality...');
        console.log('Current margins:', { top: this.marginTop, bottom: this.marginBottom, left: this.marginLeft, right: this.marginRight });
        console.log('Preview element:', document.getElementById('pdfPreview'));
    }
    
    createDraggableMarginLines() {
        const preview = document.getElementById('pdfPreview');
        if (!preview) return;
        
        // Remove existing margin lines
        const existingLines = preview.querySelectorAll('.margin-line');
        existingLines.forEach(line => line.remove());
        
        // Create draggable margin lines
        const topLine = document.createElement('div');
        topLine.className = 'margin-line top';
        topLine.setAttribute('data-side', 'top');
        
        const bottomLine = document.createElement('div');
        bottomLine.className = 'margin-line bottom';
        bottomLine.setAttribute('data-side', 'bottom');
        
        const leftLine = document.createElement('div');
        leftLine.className = 'margin-line left';
        leftLine.setAttribute('data-side', 'left');
        
        const rightLine = document.createElement('div');
        rightLine.className = 'margin-line right';
        rightLine.setAttribute('data-side', 'right');
        
        preview.appendChild(topLine);
        preview.appendChild(bottomLine);
        preview.appendChild(leftLine);
        preview.appendChild(rightLine);
        
        // Add drag functionality
        this.addDragFunctionality(topLine, 'top');
        this.addDragFunctionality(bottomLine, 'bottom');
        this.addDragFunctionality(leftLine, 'left');
        this.addDragFunctionality(rightLine, 'right');
    }
    
    addDragFunctionality(line, side) {
        let isDragging = false;
        let startY = 0;
        let startX = 0;
        let startMargin = 0;
        
        const handleMouseDown = (e) => {
            isDragging = true;
            line.classList.add('dragging');
            startY = e.clientY;
            startX = e.clientX;
            
            if (side === 'top') startMargin = this.marginTop;
            else if (side === 'bottom') startMargin = this.marginBottom;
            else if (side === 'left') startMargin = this.marginLeft;
            else if (side === 'right') startMargin = this.marginRight;
            
            e.preventDefault();
        };
        
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            const preview = document.getElementById('pdfPreview');
            const rect = preview.getBoundingClientRect();
            const scaleX = rect.width / (8.5 * 96); // Convert inches to pixels
            const scaleY = rect.height / (11 * 96);
            
            let deltaY = 0;
            let deltaX = 0;
            
            if (side === 'top' || side === 'bottom') {
                deltaY = (e.clientY - startY) / scaleY;
            } else {
                deltaX = (e.clientX - startX) / scaleX;
            }
            
            let newMargin = 0;
            if (side === 'top') {
                newMargin = Math.max(0, Math.min(2, startMargin + deltaY));
                this.marginTop = newMargin;
            } else if (side === 'bottom') {
                newMargin = Math.max(0, Math.min(2, startMargin - deltaY));
                this.marginBottom = newMargin;
            } else if (side === 'left') {
                newMargin = Math.max(0, Math.min(2, startMargin + deltaX));
                this.marginLeft = newMargin;
            } else if (side === 'right') {
                newMargin = Math.max(0, Math.min(2, startMargin - deltaX));
                this.marginRight = newMargin;
            }
            
            // Update input fields
            const topInput = document.getElementById('marginTop');
            const bottomInput = document.getElementById('marginBottom');
            const leftInput = document.getElementById('marginLeft');
            const rightInput = document.getElementById('marginRight');
            
            if (topInput) topInput.value = this.marginTop.toFixed(1);
            if (bottomInput) bottomInput.value = this.marginBottom.toFixed(1);
            if (leftInput) leftInput.value = this.marginLeft.toFixed(1);
            if (rightInput) rightInput.value = this.marginRight.toFixed(1);
            
            this.updatePreview();
        };
        
        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                line.classList.remove('dragging');
            }
        };
        
        line.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Touch support
        line.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleMouseDown(e.touches[0]);
        });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            handleMouseMove(e.touches[0]);
        });
        
        document.addEventListener('touchend', handleMouseUp);
    }

    bindEvents() {
        const contentInput = document.getElementById('contentInput');
        const themeSelect = document.getElementById('theme');
        const titleFontSelect = document.getElementById('titleFont');
        const headerFontSelect = document.getElementById('headerFont');
        const bodyFontSelect = document.getElementById('bodyFont');
        const titleColorSelect = document.getElementById('titleColor');
        const headerColorSelect = document.getElementById('headerColor');
        const bodyColorSelect = document.getElementById('bodyColor');
        const accentColorSelect = document.getElementById('accentColor');
        const titleSizeSelect = document.getElementById('titleSize');
        const headerSizeSelect = document.getElementById('headerSize');
        const bodySizeSelect = document.getElementById('bodySize');
        const pageSizeSelect = document.getElementById('pageSize');
        const marginTopInput = document.getElementById('marginTop');
        const marginBottomInput = document.getElementById('marginBottom');
        const marginLeftInput = document.getElementById('marginLeft');
        const marginRightInput = document.getElementById('marginRight');
        const marginPresetSelect = document.getElementById('marginPreset');
        const lineSpacingSelect = document.getElementById('lineSpacing');
        const alignmentRadios = document.querySelectorAll('input[name="textAlignment"]');
        const alignmentPresetSelect = document.getElementById('alignmentPreset');
        const titlePatternsInput = document.getElementById('titlePatterns');
        const headerPatternsInput = document.getElementById('headerPatterns');
        const subheaderPatternsInput = document.getElementById('subheaderPatterns');
        const listPatternsInput = document.getElementById('listPatterns');
        const applyPatternsBtn = document.getElementById('applyPatterns');
        const resetPatternsBtn = document.getElementById('resetPatterns');
        const learnFromContentBtn = document.getElementById('learnFromContent');
        const sectionPageBreakCheck = document.getElementById('sectionPageBreak');
        const subsectionPageBreakCheck = document.getElementById('subsectionPageBreak');
        const showPageNumbersCheck = document.getElementById('showPageNumbers');
        const loadDemoBtn = document.getElementById('loadDemo');
        const exportPdfBtn = document.getElementById('exportPdf');
        const refreshBtn = document.getElementById('refreshPreview');
        const clearContentBtn = document.getElementById('clearContent');
        const inputModeRadios = document.querySelectorAll('input[name="inputMode"]');

        contentInput.addEventListener('input', async () => {
            console.log('Content input changed, updating preview...');
            this.updatePreview();
            this.updateInputStats();
        });
        themeSelect.addEventListener('change', async (e) => {
            this.currentTheme = e.target.value;
            this.applyThemePreset(this.currentTheme);
            this.updatePreview();
            
            // Track theme change
            trackEvent('theme_changed', { theme: this.currentTheme });
        });
        titleFontSelect.addEventListener('change', async (e) => {
            this.titleFont = e.target.value;
            this.updatePreview();
        });
        headerFontSelect.addEventListener('change', async (e) => {
            this.headerFont = e.target.value;
            this.updatePreview();
        });
        bodyFontSelect.addEventListener('change', async (e) => {
            this.bodyFont = e.target.value;
            this.updatePreview();
        });
        titleColorSelect.addEventListener('change', async (e) => {
            this.titleColor = e.target.value;
            this.updatePreview();
        });
        headerColorSelect.addEventListener('change', async (e) => {
            this.headerColor = e.target.value;
            this.updatePreview();
        });
        bodyColorSelect.addEventListener('change', async (e) => {
            this.bodyColor = e.target.value;
            this.updatePreview();
        });
        accentColorSelect.addEventListener('change', async (e) => {
            this.accentColor = e.target.value;
            this.updatePreview();
        });
        titleSizeSelect.addEventListener('input', async (e) => {
            this.titleSize = parseInt(e.target.value);
            document.getElementById('titleSizeValue').textContent = this.titleSize + 'px';
            this.updatePreview();
        });
        headerSizeSelect.addEventListener('input', async (e) => {
            this.headerSize = parseInt(e.target.value);
            document.getElementById('headerSizeValue').textContent = this.headerSize + 'px';
            this.updatePreview();
        });
        bodySizeSelect.addEventListener('input', async (e) => {
            this.bodySize = parseInt(e.target.value);
            document.getElementById('bodySizeValue').textContent = this.bodySize + 'px';
            this.updatePreview();
        });
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', async (e) => {
                this.pageSize = e.target.value;
                console.log('Page size changed to:', this.pageSize);
                this.updatePreview();
            });
        } else {
            console.error('Page size select element not found');
        }
        // Individual margin controls
        if (marginTopInput) {
            marginTopInput.addEventListener('input', async (e) => {
                this.marginTop = parseFloat(e.target.value) || 0;
                console.log('Margin top changed to:', this.marginTop);
                this.updatePreview();
            });
        }
        
        if (marginBottomInput) {
            marginBottomInput.addEventListener('input', async (e) => {
                this.marginBottom = parseFloat(e.target.value) || 0;
                console.log('Margin bottom changed to:', this.marginBottom);
                this.updatePreview();
            });
        }
        
        if (marginLeftInput) {
            marginLeftInput.addEventListener('input', async (e) => {
                this.marginLeft = parseFloat(e.target.value) || 0;
                console.log('Margin left changed to:', this.marginLeft);
                this.updatePreview();
            });
        }
        
        if (marginRightInput) {
            marginRightInput.addEventListener('input', async (e) => {
                this.marginRight = parseFloat(e.target.value) || 0;
                console.log('Margin right changed to:', this.marginRight);
                this.updatePreview();
            });
        }
        
        // Margin preset selector
        if (marginPresetSelect) {
            marginPresetSelect.addEventListener('change', async (e) => {
                const presetValue = parseFloat(e.target.value);
                this.marginTop = presetValue;
                this.marginBottom = presetValue;
                this.marginLeft = presetValue;
                this.marginRight = presetValue;
                
                // Update input fields
                if (marginTopInput) marginTopInput.value = presetValue;
                if (marginBottomInput) marginBottomInput.value = presetValue;
                if (marginLeftInput) marginLeftInput.value = presetValue;
                if (marginRightInput) marginRightInput.value = presetValue;
                
                console.log('Margin preset changed to:', presetValue, 'for all sides');
                this.updatePreview();
            });
        }
        if (lineSpacingSelect) {
            lineSpacingSelect.addEventListener('change', async (e) => {
                this.lineSpacing = parseFloat(e.target.value);
                console.log('Line spacing changed to:', this.lineSpacing);
                this.updatePreview();
            });
        } else {
            console.error('Line spacing select element not found');
        }
        
        // Text alignment controls
        alignmentRadios.forEach(radio => {
            radio.addEventListener('change', async (e) => {
                this.textAlignment = e.target.value;
                this.titleAlignment = e.target.value;
                this.headerAlignment = e.target.value;
                this.bodyAlignment = e.target.value;
                console.log('Text alignment changed to:', this.textAlignment);
                this.updatePreview();
            });
        });
        
        if (alignmentPresetSelect) {
            alignmentPresetSelect.addEventListener('change', async (e) => {
                const preset = e.target.value;
                if (preset === 'left') {
                    this.textAlignment = 'left';
                    this.titleAlignment = 'left';
                    this.headerAlignment = 'left';
                    this.bodyAlignment = 'left';
                } else if (preset === 'center') {
                    this.textAlignment = 'center';
                    this.titleAlignment = 'center';
                    this.headerAlignment = 'center';
                    this.bodyAlignment = 'center';
                } else if (preset === 'justify') {
                    this.textAlignment = 'justify';
                    this.titleAlignment = 'left';
                    this.headerAlignment = 'left';
                    this.bodyAlignment = 'justify';
                } else if (preset === 'mixed') {
                    this.textAlignment = 'left';
                    this.titleAlignment = 'left';
                    this.headerAlignment = 'left';
                    this.bodyAlignment = 'justify';
                }
                
                // Update radio buttons
                const selectedRadio = document.querySelector(`input[name="textAlignment"][value="${this.textAlignment}"]`);
                if (selectedRadio) selectedRadio.checked = true;
                
                console.log('Alignment preset changed to:', preset, { text: this.textAlignment, title: this.titleAlignment, header: this.headerAlignment, body: this.bodyAlignment });
                this.updatePreview();
            });
        }
        
        // Detection pattern controls
        if (applyPatternsBtn) {
            applyPatternsBtn.addEventListener('click', async () => {
                this.applyDetectionPatterns();
            });
        }
        
        if (resetPatternsBtn) {
            resetPatternsBtn.addEventListener('click', async () => {
                this.resetDetectionPatterns();
            });
        }
        
        if (learnFromContentBtn) {
            learnFromContentBtn.addEventListener('click', async () => {
                this.learnFromCurrentContent();
            });
        }
        sectionPageBreakCheck.addEventListener('change', async (e) => {
            this.sectionPageBreak = e.target.checked;
            this.updatePreview();
        });
        subsectionPageBreakCheck.addEventListener('change', async (e) => {
            this.subsectionPageBreak = e.target.checked;
            this.updatePreview();
        });
        showPageNumbersCheck.addEventListener('change', async (e) => {
            this.showPageNumbers = e.target.checked;
            this.updatePreview();
        });
        loadDemoBtn.addEventListener('click', () => this.loadDemoContent());
        exportPdfBtn.addEventListener('click', () => this.exportToPDF());
        refreshBtn.addEventListener('click', async () => {
            console.log('Refresh button clicked');
            this.updatePreview();
        });

        // Theme preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const theme = e.target.dataset.theme;
                this.applyThemePreset(theme);
                this.updatePreview();
            });
        });

        // Input mode
        clearContentBtn.addEventListener('click', () => this.clearContent());
        
        inputModeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                // Prevent switching to plain text mode (disabled)
                if (e.target.value === 'plain') {
                    e.preventDefault();
                    return;
                }
                this.inputMode = e.target.value;
                this.updateInputPlaceholder();
                this.syncInputModeRadio();
            });
        });

        // Scroll to top functionality
        const scrollToTopBtn = document.getElementById('scrollToTop');
        if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener('click', () => {
                document.querySelector('.main-content').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        }

        // Testing functionality - add to window for easy access
        window.styledPagesTesting = {
            // Test different user tiers
            setTier: (tier) => this.usageTracker.setUserTier(tier),
            
            // Reset usage for testing
            resetUsage: () => this.usageTracker.resetMonthlyUsage(),
            
            // Get current usage info
            getUsage: () => ({
                current: this.usageTracker.getMonthlyUsage(),
                max: this.usageTracker.getMaxDownloads(),
                tier: this.usageTracker.getUserTier(),
                deviceId: this.usageTracker.deviceId
            }),
            
            // Simulate downloads for testing
            simulateDownload: async () => {
                console.log('Simulating PDF download...');
                if (await this.usageTracker.trackDownload()) {
                    console.log('✅ Download tracked successfully');
                } else {
                    console.log('❌ Download blocked - limit reached');
                }
            },

            // Test word count functionality
            testWordCount: () => {
                const wordCount = this.usageTracker.getCurrentWordCount();
                const isFreeUser = this.usageTracker.userTier === 'free' || this.usageTracker.userTier === 'anonymous_free';
                
                console.log('Word count test:', {
                    currentWords: wordCount,
                    isFreeUser: isFreeUser,
                    exceeds1000Words: wordCount > 1000,
                    canDownload: this.usageTracker.canDownloadPDF()
                });
            },

            // Authentication testing
            auth: {
                // Get current user
                getCurrentUser: () => {
                    console.log('Current user:', this.authManager.getCurrentUser());
                    console.log('User data:', this.authManager.userData);
                    return this.authManager.getCurrentUser();
                },
                
                // Test Google Sign-In
                testGoogleSignIn: () => {
                    console.log('Testing Google Sign-In...');
                    this.authManager.handleGoogleSignIn();
                },
                
                // Logout
                logout: () => {
                    this.authManager.logout();
                    console.log('✅ Logged out');
                },
                
                // Check Firebase status
                checkFirebase: () => {
                    console.log('Firebase Auth available:', !!window.firebaseAuth);
                    console.log('Firebase DB available:', !!window.firebaseDb);
                    console.log('Current user:', this.authManager.getCurrentUser());
                    console.log('User tier:', this.authManager.getUserTier());
                }
            }
        };

        // Make instances available globally for testing
        window.styledPages = this;

        // Add upgrade button functionality
        const upgradeBtn = document.getElementById('upgradeBtn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                console.log('Upgrade button clicked');
                // For now, just show an alert
                alert('Upgrade functionality coming soon! This will integrate with Gumroad.');
            });
        }
    }

    async loadDemoContent() {
        const demoContent = `# Enterprise Document Automation Platform

## Streamline Your Business Documentation Workflow

In today's competitive business environment, organizations require efficient, professional document generation capabilities that scale with enterprise needs. **StyledPages** delivers enterprise-grade document automation, transforming unstructured content into publication-ready materials with enterprise-level reliability and security.

### Enterprise Features

- **Advanced Content Intelligence**: AI-powered structure detection and formatting optimization
- **Corporate Brand Management**: Centralized control over fonts, colors, and styling standards
- **Multi-Format Export**: Generate PDFs, Word documents, and web-ready formats
- **Enterprise Security**: SOC 2 compliant with role-based access controls

## Technical Architecture

Our enterprise platform is built on a robust, scalable infrastructure designed for high-volume document processing:

1. **Content Analysis Engine**: Proprietary algorithms that understand document hierarchy and context
2. **Template Management System**: Centralized repository for corporate templates and brand guidelines
3. **Quality Assurance Framework**: Automated validation ensuring consistent output quality
4. **Integration Capabilities**: RESTful APIs and webhook support for seamless system integration

### Target Enterprise Use Cases

- **Financial Services**: Regulatory reports, client presentations, and compliance documentation
- **Legal Firms**: Case briefs, contract templates, and court filing preparation
- **Consulting Organizations**: Client deliverables, proposal generation, and knowledge management
- **Healthcare Systems**: Patient reports, policy documentation, and regulatory submissions

## Business Impact Analysis

### Operational Efficiency Gains
Organizations report 75% reduction in document preparation time, enabling teams to focus on high-value activities rather than formatting tasks.

### Cost Optimization
Eliminate the need for dedicated design resources while maintaining professional output standards across all business units.

### Compliance and Consistency
Ensure all corporate communications meet brand guidelines and regulatory requirements through automated validation and approval workflows.

### Scalability and Performance
Handle enterprise-scale document volumes with 99.9% uptime guarantee and sub-second processing times for standard document types.

## Implementation Roadmap

Contact our enterprise solutions team to discuss your organization's specific requirements and develop a customized implementation plan.

*Transform your document workflow with enterprise-grade automation. Schedule a consultation today.*`;

        document.getElementById('contentInput').value = demoContent;
        await this.updatePreview();
    }

    async updatePreview() {
        const content = document.getElementById('contentInput').value;
        const preview = document.getElementById('pdfPreview');
        
        console.log('=== UPDATE PREVIEW DEBUG ===');
        console.log('Content input value:', content);
        console.log('Content length:', content.length);
        console.log('Input mode:', this.inputMode);
        console.log('Is content formatted:', this.isContentFormatted());
        console.log('Preview element:', preview);
        
        // Add visual feedback that preview is updating
        preview.style.opacity = '0.7';
        preview.style.transform = 'scale(0.98)';
        
        if (!content.trim()) {
            preview.innerHTML = '<div class="preview-placeholder"><p>Enter content above to see the live preview</p></div>';
            preview.style.opacity = '1';
            preview.style.transform = 'scale(1)';
            return;
        }

        let formattedContent;
        
        // Always use markdown parsing (plain text mode disabled)
            console.log('Using markdown parsing...');
            formattedContent = this.parseContentWithPageBreaks(content);
        
        console.log('Formatted content:', formattedContent);
        
        // Fallback if parsing fails
        if (!formattedContent || formattedContent.trim() === '') {
            console.log('Using fallback parsing...');
            formattedContent = this.parseContent(content);
        }
        
        preview.innerHTML = formattedContent;
        preview.className = `pdf-preview theme-${this.currentTheme} page-size-${this.pageSize}`;
        
        // Apply all formatting variables
        preview.style.setProperty('--title-font', this.titleFont);
        preview.style.setProperty('--header-font', this.headerFont);
        preview.style.setProperty('--body-font', this.bodyFont);
        preview.style.setProperty('--title-color', this.titleColor);
        preview.style.setProperty('--header-color', this.headerColor);
        preview.style.setProperty('--body-color', this.bodyColor);
        preview.style.setProperty('--accent-color', this.accentColor);
        preview.style.setProperty('--title-size', this.titleSize + 'px');
        preview.style.setProperty('--header-size', this.headerSize + 'px');
        preview.style.setProperty('--body-size', this.bodySize + 'px');
        preview.style.setProperty('--margin-top', this.marginTop + 'in');
        preview.style.setProperty('--margin-bottom', this.marginBottom + 'in');
        preview.style.setProperty('--margin-left', this.marginLeft + 'in');
        preview.style.setProperty('--margin-right', this.marginRight + 'in');
        console.log('Setting margins to:', { top: this.marginTop, bottom: this.marginBottom, left: this.marginLeft, right: this.marginRight });
        
        // Apply text alignment
        preview.style.setProperty('--text-alignment', this.textAlignment);
        preview.style.setProperty('--title-alignment', this.titleAlignment);
        preview.style.setProperty('--header-alignment', this.headerAlignment);
        preview.style.setProperty('--body-alignment', this.bodyAlignment);
        console.log('Setting text alignment:', { text: this.textAlignment, title: this.titleAlignment, header: this.headerAlignment, body: this.bodyAlignment });
        preview.style.setProperty('--line-spacing', this.lineSpacing);
        
        // Apply page size dimensions
        const pageDimensions = this.getPageDimensions();
        preview.style.setProperty('--page-width', pageDimensions.width);
        preview.style.setProperty('--page-height', pageDimensions.height);
        console.log('Setting page dimensions:', pageDimensions);
        
        // Create draggable margin lines
        this.createDraggableMarginLines();
        
        // Restore full opacity and scale
        setTimeout(() => {
            preview.style.opacity = '1';
            preview.style.transform = 'scale(1)';
        }, 100);
    }

    parseContent(content) {
        // Split content into lines for better processing
        const lines = content.split('\n');
        let html = '';
        let inList = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('# ')) {
                // Main header
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const headerText = this.processInlineFormatting(line.substring(2));
                html += `<h1>${headerText}</h1>`;
            } else if (line.startsWith('## ')) {
                // Subheader
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const headerText = this.processInlineFormatting(line.substring(3));
                html += `<h2>${headerText}</h2>`;
            } else if (line.startsWith('### ')) {
                // Small header
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const headerText = this.processInlineFormatting(line.substring(4));
                html += `<h3>${headerText}</h3>`;
            } else if (line.startsWith('- ')) {
                // List item
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                const listText = this.processInlineFormatting(line.substring(2));
                html += `<li>${listText}</li>`;
            } else if (line.length > 0) {
                // Regular paragraph
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const paragraphText = this.processInlineFormatting(line);
                html += `<p>${paragraphText}</p>`;
            } else {
                // Empty line
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                // Add spacing for empty lines
                if (html && !html.endsWith('</p>') && !html.endsWith('</h1>') && !html.endsWith('</h2>') && !html.endsWith('</h3>')) {
                    html += '<br>';
                }
            }
        }
        
        // Close any remaining list
        if (inList) {
            html += '</ul>';
        }
        
        return html;
    }

    processInlineFormatting(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    parseContentWithPageBreaks(content) {
        const lines = content.split('\n');
        let html = '';
        let inList = false;
        let lastWasHeader = false;
        let lineCount = 0;
        let firstH2Found = false; // Track if we've seen the first H2
        const maxLinesPerPage = 30; // Approximate lines per page
        
        // Add initial page break to ensure content starts on a new page
        html += '<div class="page-break initial-page"></div>';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('# ')) {
                // Main header - check user preference for page breaks
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                
                // Add page break before H1 headers if user has enabled it
                if (html.length > 0 && this.sectionPageBreak) {
                    html += '<div class="page-break section-break"></div>';
                    lineCount = 0;
                }
                
                const headerText = this.processInlineFormatting(line.substring(2));
                html += `<h1>${headerText}</h1>`;
                lastWasHeader = true;
                lineCount += 3; // Headers take more space
            } else if (line.startsWith('## ')) {
                // Subheader - check user preference for page breaks
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                
                // Add page break before H2 headers if:
                // 1. User has enabled it AND it's not the first H2, OR
                // 2. Content would overflow to next page (regardless of user preference)
                const shouldAddPageBreak = (html.length > 0 && this.subsectionPageBreak && firstH2Found) || 
                                         (lineCount > maxLinesPerPage - 2); // H2 takes 2 lines, so check if adding it would overflow
                
                if (shouldAddPageBreak) {
                    html += '<div class="page-break subsection-break"></div>';
                    lineCount = 0;
                }
                
                // Mark that we've found the first H2
                firstH2Found = true;
                
                const headerText = this.processInlineFormatting(line.substring(3));
                html += `<h2>${headerText}</h2>`;
                lastWasHeader = true;
                lineCount += 2; // Subheaders take moderate space
            } else if (line.startsWith('### ')) {
                // Small header
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                
                // Add page break before H3 headers if content would overflow to next page
                if (lineCount > maxLinesPerPage - 2) { // H3 takes 2 lines, so check if adding it would overflow
                    html += '<div class="page-break subsection-break"></div>';
                    lineCount = 0;
                }
                
                const headerText = this.processInlineFormatting(line.substring(4));
                html += `<h3>${headerText}</h3>`;
                lastWasHeader = true;
                lineCount += 2;
            } else if (line.startsWith('- ')) {
                // List item
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                const listText = this.processInlineFormatting(line.substring(2));
                html += `<li>${listText}</li>`;
                lastWasHeader = false;
                lineCount += 1;
            } else if (line.length > 0) {
                // Regular paragraph
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const paragraphText = this.processInlineFormatting(line);
                html += `<p>${paragraphText}</p>`;
                lastWasHeader = false;
                lineCount += 1;
            } else {
                // Empty line
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                if (html && !html.endsWith('</p>') && !html.endsWith('</h1>') && !html.endsWith('</h2>') && !html.endsWith('</h3>')) {
                    html += '<br>';
                }
                lastWasHeader = false;
                lineCount += 0.5; // Empty lines take minimal space
            }
            
            // Add page break if we've exceeded the maximum lines per page
            if (lineCount >= maxLinesPerPage) {
                html += '<div class="page-break"></div>';
                lineCount = 0;
            }
        }
        
        // Close any remaining list
        if (inList) {
            html += '</ul>';
        }
        
        return html;
    }

    getPageDimensions() {
        const dimensions = {
            letter: { width: '8.5in', height: '11in' },
            a4: { width: '210mm', height: '297mm' },
            legal: { width: '8.5in', height: '14in' },
            tabloid: { width: '11in', height: '17in' }
        };
        return dimensions[this.pageSize] || dimensions.letter;
    }

    getPageSizeForPrint(pageSize) {
        const pageSizes = {
            letter: 'Letter',
            a4: 'A4',
            legal: 'Legal',
            tabloid: 'Tabloid'
        };
        return pageSizes[pageSize] || 'Letter';
    }


    applyThemePreset(theme) {
        const presets = {
            professional: {
                titleColor: '#1e293b',
                headerColor: '#1e293b',
                bodyColor: '#1e293b',
                accentColor: '#3b82f6'
            },
            creative: {
                titleColor: '#1e40af',
                headerColor: '#3b82f6',
                bodyColor: '#475569',
                accentColor: '#60a5fa'
            },
            minimal: {
                titleColor: '#1e40af',
                headerColor: '#3b82f6',
                bodyColor: '#475569',
                accentColor: '#60a5fa'
            },
            academic: {
                titleColor: '#1f2937',
                headerColor: '#4b5563',
                bodyColor: '#1f2937',
                accentColor: '#3b82f6'
            }
        };

        const preset = presets[theme];
        if (preset) {
            this.titleColor = preset.titleColor;
            this.headerColor = preset.headerColor;
            this.bodyColor = preset.bodyColor;
            this.accentColor = preset.accentColor;

            // Update color pickers
            document.getElementById('titleColor').value = this.titleColor;
            document.getElementById('headerColor').value = this.headerColor;
            document.getElementById('bodyColor').value = this.bodyColor;
            document.getElementById('accentColor').value = this.accentColor;

            // Update active preset button
            document.querySelectorAll('.preset-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
        }
    }


    async exportToPDF() {
        const exportBtn = document.getElementById('exportPdf');
        const originalText = exportBtn.textContent;
        
        // Track PDF export attempt
        trackEvent('pdf_export_attempted', {
            theme: this.currentTheme,
            pageSize: this.pageSize,
            contentLength: document.getElementById('contentInput').value.length
        });
        
        // Check usage limits before proceeding
        if (!this.usageTracker.canDownloadPDF()) {
            console.log('PDF download blocked by usage limits');
            trackEvent('pdf_export_blocked', { reason: 'usage_limit' });
            return;
        }
        
        // Show loading state
        exportBtn.innerHTML = '<span class="loading"></span> Generating PDF...';
        exportBtn.disabled = true;
        
        try {
            // Check if there's content to export
            const content = document.getElementById('contentInput').value;
            if (!content.trim()) {
                throw new Error('No content to export');
            }
            
            // Track the download attempt
            if (!(await this.usageTracker.trackDownload())) {
                console.log('Download tracking failed - limit reached');
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;
                return;
            }
            
            // Get the preview content
            const preview = document.getElementById('pdfPreview');
            if (!preview) {
                throw new Error('Preview element not found');
            }
            
            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            
            // Set the window size based on the selected page size
            const pageDimensions = this.getPageDimensions();
            const width = pageDimensions.width === '210mm' ? '794px' : '816px'; // Convert to pixels
            const height = pageDimensions.height === '297mm' ? '1123px' : 
                          pageDimensions.height === '14in' ? '1344px' :
                          pageDimensions.height === '17in' ? '1632px' : '1056px';
            
            printWindow.resizeTo(parseInt(width) + 100, parseInt(height) + 200); // Add some padding
            
            // Get the current page size and margins
            const pageSize = this.pageSize;
            const marginTop = this.marginTop;
            const marginBottom = this.marginBottom;
            const marginLeft = this.marginLeft;
            const marginRight = this.marginRight;
            
            // Create the HTML content for printing
            const printHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>StyledPages Document</title>
    <style>
        @page {
            size: ${this.getPageSizeForPrint(pageSize)};
            margin: ${marginTop}in ${marginRight}in ${marginBottom}in ${marginLeft}in;
        }
        
        body {
            margin: 0;
            padding: 0;
            font-family: ${this.bodyFont}, sans-serif;
            font-size: ${this.bodySize}px;
            line-height: ${this.lineSpacing};
            color: ${this.bodyColor};
            background: white;
        }
        
        .pdf-content {
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 0;
            min-height: 100vh;
        }
        
        /* Ensure content adapts to page size */
        @media print {
            body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
            }
            
            .pdf-content {
                width: 100%;
                height: 100%;
            }
        }
        
        h1 {
            font-family: ${this.titleFont}, sans-serif;
            font-size: ${this.titleSize}px;
            color: ${this.titleColor};
            font-weight: bold;
            margin: 0 0 0.5em 0;
            text-align: ${this.titleAlignment};
            border-bottom: 2px solid ${this.accentColor};
            padding-bottom: 0.2em;
        }
        
        h2 {
            font-family: ${this.headerFont}, sans-serif;
            font-size: ${this.headerSize}px;
            color: ${this.headerColor};
            font-weight: bold;
            margin: 1.5em 0 0.5em 0;
            text-align: ${this.headerAlignment};
        }
        
        h3 {
            font-family: ${this.headerFont}, sans-serif;
            font-size: ${this.headerSize - 4}px;
            color: ${this.headerColor};
            font-weight: bold;
            margin: 1.2em 0 0.3em 0;
            text-align: ${this.headerAlignment};
        }
        
        p {
            margin: 0 0 1em 0;
            text-align: ${this.bodyAlignment};
        }
        
        ul, ol {
            margin: 0 0 1em 0;
            padding-left: 1.5em;
        }
        
        li {
            margin: 0.3em 0;
        }
        
        strong {
            font-weight: bold;
        }
        
        em {
            font-style: italic;
        }
        
        hr {
            border: none;
            border-top: 1px solid ${this.accentColor};
            margin: 2em 0;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="pdf-content">
        ${preview.innerHTML}
    </div>
</body>
</html>`;
            
            // Write the content to the new window
            printWindow.document.write(printHTML);
            printWindow.document.close();
            
            // Wait for the content to load, then trigger print
            printWindow.onload = () => {
                setTimeout(() => {
                    // Add CSS to hint that this should be saved as PDF
                    const pdfHintCSS = `
                        <style>
                            @media print {
                                /* Hint to browsers that this should be saved as PDF */
                                body::before {
                                    content: "PDF_DOCUMENT";
                                    display: none;
                                }
                            }
                        </style>
                    `;
                    
                    // Add a script that tries to auto-select PDF destination
                    const autoSelectScript = `
                        <script>
                            // Function to try to auto-select "Save as PDF"
                            function tryAutoSelectPDF() {
                                // Wait for print dialog to be ready
                                setTimeout(() => {
                                    // Try different approaches based on browser
                                    if (window.chrome) {
                                        // Chrome-specific approach
                                        const printPreview = document.querySelector('print-preview-app');
                                        if (printPreview) {
                                            const destinationSelect = printPreview.querySelector('select[aria-label*="Destination"], select[aria-label*="destination"]');
                                            if (destinationSelect) {
                                                // Look for PDF option
                                                for (let option of destinationSelect.options) {
                                                    if (option.textContent.toLowerCase().includes('pdf') || 
                                                        option.value.toLowerCase().includes('pdf')) {
                                                        destinationSelect.value = option.value;
                                                        destinationSelect.dispatchEvent(new Event('change', { bubbles: true }));
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }, 300);
                            }
                            
                            // Try to auto-select PDF when print dialog opens
                            window.addEventListener('beforeprint', tryAutoSelectPDF);
                            
                            // Also try after a delay
                            setTimeout(tryAutoSelectPDF, 500);
                        </script>
                    `;
                    
                    // Add the CSS and script to the print window
                    printWindow.document.head.insertAdjacentHTML('beforeend', pdfHintCSS);
                    printWindow.document.head.insertAdjacentHTML('beforeend', autoSelectScript);
                    
                    // Trigger print
                    printWindow.print();
                    printWindow.close();
            
            // Show success state
                    exportBtn.innerHTML = '✓ PDF Downloaded!';
            exportBtn.classList.add('success');
            
            // Track successful PDF export
            trackEvent('pdf_export_success', {
                theme: this.currentTheme,
                pageSize: this.pageSize,
                contentLength: document.getElementById('contentInput').value.length
            });
            
            setTimeout(() => {
                exportBtn.textContent = originalText;
                exportBtn.classList.remove('success');
                exportBtn.disabled = false;
            }, 2000);
                }, 500);
            };
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            console.error('Error details:', error.message, error.stack);
            exportBtn.innerHTML = `Error: ${error.message}`;
            exportBtn.disabled = false;
            
            setTimeout(() => {
                exportBtn.textContent = originalText;
            }, 3000);
        }
    }

    processTextFormatting(text) {
        // Process text formatting for PDF
        // Note: jsPDF has limited formatting support, so we'll handle basic cases
        return text
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers for now
            .replace(/\*(.*?)\*/g, '$1'); // Remove italic markers for now
    }
    
    processTextWithFormatting(doc, text, x, y, options = {}) {
        // Process text with basic formatting support
        const lines = text.split('\n');
        let currentY = y;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Handle bold text (simple approach)
            if (line.includes('**')) {
                const parts = line.split(/(\*\*.*?\*\*)/g);
                let currentX = x;
                
                for (let j = 0; j < parts.length; j++) {
                    const part = parts[j];
                    if (part.startsWith('**') && part.endsWith('**')) {
                        // Bold text
                        const boldText = part.slice(2, -2);
                        doc.setFont(this.bodyFont, 'bold');
                        doc.text(boldText, currentX, currentY, options);
                        currentX += doc.getTextWidth(boldText);
                    } else if (part.trim()) {
                        // Regular text
                        doc.setFont(this.bodyFont, 'normal');
                        doc.text(part, currentX, currentY, options);
                        currentX += doc.getTextWidth(part);
                    }
                }
            } else {
                // Regular text
                doc.setFont(this.bodyFont, 'normal');
                doc.text(line, x, currentY, options);
            }
            
            currentY += 0.15; // Line height
        }
        
        return currentY;
    }

    addPageNumber(doc, pageNumber, pageWidth, marginTop, marginRight) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(pageNumber.toString(), pageWidth - marginRight - 0.1, marginTop - 0.1);
        console.log('Added page number:', pageNumber, 'at position:', pageWidth - marginRight - 0.1, marginTop - 0.1);
    }

    async processWithAI() {
        const contentInput = document.getElementById('contentInput');
        if (!contentInput) {
            console.error('Content input element not found');
            return;
        }
        
        const content = contentInput.value.trim();
        if (!content) {
            alert('Please enter some content to process with AI.');
            return;
        }

        this.showAIStatus(true);
        
        try {
            console.log('Processing content with AI...');
            const processedContent = await this.callGeminiAPI(content);
            if (processedContent && processedContent.trim()) {
                console.log('AI processing successful, updating content...');
                contentInput.value = processedContent;
                // Switch to markdown mode after AI processing
                this.inputMode = 'markdown';
                this.updateInputPlaceholder();
                await this.updatePreview();
            } else {
                throw new Error('AI returned empty content');
            }
        } catch (error) {
            console.error('AI processing failed:', error);
            // Show a more helpful error message
            const errorMessage = error.message.includes('API request failed') 
                ? 'AI service is temporarily unavailable. The content will be processed using the built-in parser instead.'
                : 'AI processing failed. The content will be processed using the built-in parser instead.';
            
            alert(errorMessage);
            
            // Fallback to plain text parsing
            console.log('Falling back to plain text parsing...');
            await this.updatePreview();
        } finally {
            this.showAIStatus(false);
        }
    }

    async callGeminiAPI(content) {
        // Check if API key is available
        if (!this.geminiApiKey || this.geminiApiKey === '') {
            throw new Error('API key not configured');
        }

        const prompt = `You are a professional document formatter. Convert this plain text into properly structured markdown.

CRITICAL RULES:
1. **MAIN TITLE**: Use # for the most important heading (usually the first line or one with "–" or "—")
2. **SECTION HEADERS**: Use ## for major sections like "Key Features", "How It Works", "Why Choose", etc.
3. **SUBSECTION HEADERS**: Use ### for smaller sections like "Time-Saving", "Professional Results", etc.
4. **LISTS**: Use - for bullet points, 1. 2. 3. for numbered lists
5. **EMPHASIS**: Use **bold** for important terms, *italic* for subtle emphasis
6. **PRESERVE**: Keep all original content, only add markdown formatting

DETECTION PATTERNS:
- Lines that are short, prominent, and standalone = headers
- Lines starting with numbers followed by periods = section headers (##)
- Lines that are descriptive but shorter = subsection headers (###)
- Lines with bullet points or dashes = list items
- Lines that are longer and descriptive = paragraphs

Example:
Input: "Key Features
Automatic Formatting: Detects headers
Professional Templates: Multiple themes"

Output: "## Key Features
- **Automatic Formatting**: Detects headers
- **Professional Templates**: Multiple themes"

Now format this content:
${content}

Return only the formatted markdown:`;

        try {
            console.log('Sending request to Gemini API...');
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            console.log('API response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API response data:', data);
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
                console.error('Invalid API response format:', data);
                throw new Error('Invalid API response format');
            }
            
            const result = data.candidates[0].content.parts[0].text;
            console.log('AI processing result:', result);
            return result;
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new Error(`AI processing failed: ${error.message}`);
        }
    }

    showAIStatus(show) {
        const statusElement = document.getElementById('aiStatus');
        if (statusElement) {
            if (show) {
                statusElement.style.display = 'block';
            } else {
                statusElement.style.display = 'none';
            }
        }
    }

    async clearContent() {
        const contentInput = document.getElementById('contentInput');
        if (contentInput) {
            contentInput.value = '';
            this.updatePreview();
            this.updateInputStats();
        }
    }

    updateInputStats() {
        const contentInput = document.getElementById('contentInput');
        const charCountEl = document.getElementById('charCount');
        const wordCountEl = document.getElementById('wordCount');
        const wordLimitEl = document.getElementById('wordLimit');
        
        if (!contentInput || !charCountEl || !wordCountEl) return;
        
        const content = contentInput.value;
        const charCount = content.length;
        const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
        
        charCountEl.textContent = `${charCount.toLocaleString()} characters`;
        wordCountEl.textContent = `${wordCount.toLocaleString()} words`;
        
        // Show word limit indicator for free users (max 1000 words)
        if (wordLimitEl) {
            const isFreeUser = this.usageTracker.userTier === 'free' || this.usageTracker.userTier === 'anonymous_free';
            
            if (isFreeUser && wordCount > 1000) {
                wordLimitEl.style.display = 'inline-block';
                wordLimitEl.textContent = `${wordCount - 1000} words over free limit (1000 max)`;
            } else {
                wordLimitEl.style.display = 'none';
            }
        }
        
        // Update progress bar based on content length
        this.updateProgressBar(charCount);
    }

    updateProgressBar(charCount) {
        const progressBar = document.getElementById('headerProgress');
        if (!progressBar) return;
        
        // Calculate progress based on content length (max at 2000 characters)
        const maxChars = 2000;
        const progress = Math.min((charCount / maxChars) * 100, 100);
        progressBar.style.width = `${progress}%`;
    }

    syncInputModeRadio() {
        // Sync the radio button state with the current input mode
        const plainRadio = document.querySelector('input[name="inputMode"][value="plain"]');
        const markdownRadio = document.querySelector('input[name="inputMode"][value="markdown"]');
        
        if (plainRadio && markdownRadio) {
            if (this.inputMode === 'plain') {
                plainRadio.checked = true;
                markdownRadio.checked = false;
            } else {
                plainRadio.checked = false;
                markdownRadio.checked = true;
            }
        }
    }

    updateInputPlaceholder() {
        const textarea = document.getElementById('contentInput');
        if (!textarea) return;
        
        if (this.inputMode === 'plain') {
            textarea.placeholder = `Enter your content here... AI will automatically detect headers, subheaders, and formatting:

StyledPages – Full Project Description

1. Project Overview

StyledPages is a revolutionary web platform designed to automatically transform plain text into beautifully formatted, professional PDFs.

2. The Problem

Despite the proliferation of digital content, professionals face several challenges:

Time-Consuming Manual Formatting
Creating visually appealing PDFs requires careful attention to fonts, spacing, headers, and lists.

Lack of Design Skills
Many educators, coaches, and small business owners have valuable content but lack design expertise.

3. The Solution

StyledPages offers a fully automated, all-in-one PDF creation platform:

Automatic Content Detection
The platform scans the user's text and identifies structural elements like titles, headers, subheaders, lists, and paragraphs.

Predefined Professional Templates
Users can choose from multiple templates: Minimalist, Creative, Academic, and Modern.

Instant PDF Export
Generate and download formatted PDFs in seconds.

This is how your content will look when transformed into a beautiful PDF with AI-powered formatting.`;
        } else {
            textarea.placeholder = `Enter your content here using markdown formatting:

# Main Header
## Subheader
### Smaller Header

- Bullet point 1
- Bullet point 2
  - Nested point

**Bold text** and *italic text*

Regular paragraph text goes here. The system will automatically detect the structure and apply professional styling.

## Another Section

This is how your content will look when transformed into a beautiful PDF.`;
        }
    }

    isContentFormatted() {
        const contentInput = document.getElementById('contentInput');
        if (!contentInput) return false;
        
        const content = contentInput.value;
        // Check if content has markdown formatting
        return content.includes('#') || content.includes('**') || content.includes('*') || content.includes('- ');
    }

    parsePlainText(content) {
        // Enhanced plain text parsing with better structure detection
        const lines = content.split('\n');
        let html = '';
        let inList = false;
        let inNumberedList = false;
        let listType = 'ul';
        let titleFound = false; // Track if we've found the main title
        let lineCount = 0;
        const maxLinesPerPage = 30; // Approximate lines per page
        
        console.log('Parsing plain text with', lines.length, 'lines');
        console.log('Content:', content);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            console.log(`Line ${i}: "${line}"`);
            
            if (line.length === 0) {
                // Empty line - close any open lists
                if (inList) {
                    html += `</${listType}>`;
                    inList = false;
                    inNumberedList = false;
                }
                html += '<br>';
                lineCount += 0.5;
            } else if (this.isNumberedListItem(line)) {
                // Numbered list item (1., 2., etc.)
                if (!inNumberedList || listType !== 'ol') {
                    if (inList) {
                        html += `</${listType}>`;
                    }
                    html += '<ol>';
                    inList = true;
                    inNumberedList = true;
                    listType = 'ol';
                }
                const listText = this.extractNumberedListText(line);
                html += `<li>${this.processInlineFormatting(listText)}</li>`;
                lineCount += 1;
            } else if (this.isBulletListItem(line)) {
                // Bullet list item (-, •, *, etc.)
                console.log('Detected bullet list item:', line);
                if (!inList || listType !== 'ul') {
                    if (inList) {
                        html += `</${listType}>`;
                    }
                    html += '<ul>';
                    inList = true;
                    inNumberedList = false;
                    listType = 'ul';
                }
                const listText = this.extractBulletListText(line);
                html += `<li>${this.processInlineFormatting(listText)}</li>`;
                lineCount += 1;
            } else if (!titleFound && this.isMainTitle(line)) {
                // Main title (ONLY the first title found)
                console.log('Detected main title:', line);
                console.log('isMainTitle check:', this.isMainTitle(line));
                if (inList) {
                    html += `</${listType}>`;
                    inList = false;
                    inNumberedList = false;
                }
                html += `<h1>${this.processInlineFormatting(line)}</h1>`;
                titleFound = true;
                lineCount += 3;
            } else if (this.isSectionHeader(line)) {
                // Section header (numbered sections like "1. Project Overview")
                console.log('Detected section header:', line);
                console.log('isSectionHeader check:', this.isSectionHeader(line));
                if (inList) {
                    html += `</${listType}>`;
                    inList = false;
                    inNumberedList = false;
                }
                
                // Add page break before section if:
                // 1. User has enabled it AND we have content, OR
                // 2. Content would overflow to next page (regardless of user preference)
                const shouldAddPageBreak = (this.sectionPageBreak && lineCount > 0) || 
                                         (lineCount > maxLinesPerPage - 2); // H2 takes 2 lines, so check if adding it would overflow
                
                if (shouldAddPageBreak) {
                    html += '<div class="page-break section-break"></div>';
                    lineCount = 0;
                }
                
                html += `<h2>${this.processInlineFormatting(line)}</h2>`;
                lineCount += 2;
            } else if (this.isSubsectionHeader(line)) {
                // Subsection header (shorter, often descriptive)
                console.log('Detected subsection header:', line);
                if (inList) {
                    html += `</${listType}>`;
                    inList = false;
                    inNumberedList = false;
                }
                
                // Add page break before subsection if:
                // 1. User has enabled it AND we have content, OR
                // 2. Content would overflow to next page (regardless of user preference)
                const shouldAddPageBreak = (this.subsectionPageBreak && lineCount > 0) || 
                                         (lineCount > maxLinesPerPage - 2); // H3 takes 2 lines, so check if adding it would overflow
                
                if (shouldAddPageBreak) {
                    html += '<div class="page-break subsection-break"></div>';
                    lineCount = 0;
                }
                
                html += `<h3>${this.processInlineFormatting(line)}</h3>`;
                lineCount += 2;
            } else {
                // Regular paragraph
                if (inList) {
                    html += `</${listType}>`;
                    inList = false;
                    inNumberedList = false;
                }
                html += `<p>${this.processInlineFormatting(line)}</p>`;
                lineCount += 1;
            }
            
            // Add page break if we've exceeded the maximum lines per page
            if (lineCount >= maxLinesPerPage) {
                html += '<div class="page-break"></div>';
                lineCount = 0;
            }
        }
        
        // Close any remaining list
        if (inList) {
            html += `</${listType}>`;
        }
        
        return html;
    }

    isNumberedListItem(line) {
        // Check if line starts with a number followed by a period
        // But exclude section headers (which are longer and more descriptive)
        return /^\d+\.\s/.test(line) && 
               !this.isSectionHeader(line) && // Not a section header
               (line.length > 20 || line.includes(':') || line.endsWith('.'));
    }

    isBulletListItem(line) {
        // Check if line starts with bullet points or is indented
        return /^[-•*]\s/.test(line) || 
               /^\s+[-•*]\s/.test(line) ||
               (line.startsWith('  ') && line.length > 10 && !line.includes(':'));
    }

    extractNumberedListText(line) {
        // Extract text after "1. " pattern
        return line.replace(/^\d+\.\s/, '');
    }

    extractBulletListText(line) {
        // Extract text after bullet point or indentation
        return line.replace(/^[-•*]\s/, '').replace(/^\s+/, '');
    }

    isMainTitle(line) {
        // Check if line is likely a main title
        // Usually first line, contains "–" or "—", or is very prominent
        return (line.length < 100 && 
                line.length > 5 && 
                (line.includes('–') || line.includes('—') || 
                 line.split(' ').length <= 10) &&
                line[0] === line[0].toUpperCase() &&
                !line.includes('.') && 
                !line.includes(',') &&
                !line.startsWith(' ') &&
                !line.startsWith('\t') &&
                !line.includes(':') &&
                !line.startsWith('1.') &&
                !line.startsWith('2.') &&
                !line.startsWith('3.') &&
                !line.startsWith('4.') &&
                !line.startsWith('5.'));
    }

    isSectionHeader(line) {
        // Check if line is a section header - can be numbered or just prominent text
        const isNumbered = /^\d+\.\s[A-Z]/.test(line);
        const isProminent = line.length > 5 && 
                           line.length < 100 && 
                           line[0] === line[0].toUpperCase() &&
                           !line.includes('.') && 
                           !line.includes(',') &&
                           !line.includes(':') &&
                           !line.includes('•') &&
                           !line.includes('-') &&
                           !line.includes('*') &&
                           !line.startsWith(' ') &&
                           !line.startsWith('\t') &&
                           line.split(' ').length >= 2 &&
                           !line.includes('–') && 
                           !line.includes('—');
        
        return isNumbered || isProminent;
    }

    isSubsectionHeader(line) {
        // Check if line is a subsection header (shorter, descriptive)
        return line.length < 80 && 
               line.length > 5 && 
               line[0] === line[0].toUpperCase() &&
               !line.includes('.') && 
               !line.includes(',') &&
               !/^\d+\.\s/.test(line) &&
               line.split(' ').length <= 8 &&
               !line.includes('–') && 
               !line.includes('—') &&
               !line.startsWith(' ') &&
               !line.startsWith('\t') &&
               !line.includes('•') &&
               !line.includes('-') &&
               !line.includes('*');
    }

    // Legacy methods for backward compatibility
    isLikelyTitle(line) {
        return this.isMainTitle(line);
    }

    isLikelyHeader(line) {
        return this.isSubsectionHeader(line);
    }
    
    // Detection pattern management
    async applyDetectionPatterns() {
        const titlePatterns = document.getElementById('titlePatterns');
        const headerPatterns = document.getElementById('headerPatterns');
        const subheaderPatterns = document.getElementById('subheaderPatterns');
        const listPatterns = document.getElementById('listPatterns');
        
        if (titlePatterns) this.detectionPatterns.title = titlePatterns.value;
        if (headerPatterns) this.detectionPatterns.header = headerPatterns.value;
        if (subheaderPatterns) this.detectionPatterns.subheader = subheaderPatterns.value;
        if (listPatterns) this.detectionPatterns.list = listPatterns.value;
        
        console.log('Applied detection patterns:', this.detectionPatterns);
        await this.updatePreview();
    }
    
    async resetDetectionPatterns() {
        this.detectionPatterns = {
            title: "contains '–' or '—', starts with capital, length 5-100",
            header: "starts with number., short descriptive text, length 5-100",
            subheader: "short descriptive, no numbers, length 5-80",
            list: "starts with -, •, *, or indented"
        };
        
        // Update input fields
        const titlePatterns = document.getElementById('titlePatterns');
        const headerPatterns = document.getElementById('headerPatterns');
        const subheaderPatterns = document.getElementById('subheaderPatterns');
        const listPatterns = document.getElementById('listPatterns');
        
        if (titlePatterns) titlePatterns.value = this.detectionPatterns.title;
        if (headerPatterns) headerPatterns.value = this.detectionPatterns.header;
        if (subheaderPatterns) subheaderPatterns.value = this.detectionPatterns.subheader;
        if (listPatterns) listPatterns.value = this.detectionPatterns.list;
        
        console.log('Reset detection patterns to default');
        await this.updatePreview();
    }
    
    async learnFromCurrentContent() {
        const contentInput = document.getElementById('contentInput');
        if (!contentInput || !contentInput.value.trim()) {
            alert('Please add some content first to learn from.');
            return;
        }
        
        const content = contentInput.value;
        const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Analyze patterns in the content
        const analysis = this.analyzeContentPatterns(lines);
        
        // Update detection patterns based on analysis
        this.detectionPatterns = {
            title: analysis.titlePattern,
            header: analysis.headerPattern,
            subheader: analysis.subheaderPattern,
            list: analysis.listPattern
        };
        
        // Update input fields
        const titlePatterns = document.getElementById('titlePatterns');
        const headerPatterns = document.getElementById('headerPatterns');
        const subheaderPatterns = document.getElementById('subheaderPatterns');
        const listPatterns = document.getElementById('listPatterns');
        
        if (titlePatterns) titlePatterns.value = this.detectionPatterns.title;
        if (headerPatterns) headerPatterns.value = this.detectionPatterns.header;
        if (subheaderPatterns) subheaderPatterns.value = this.detectionPatterns.subheader;
        if (listPatterns) listPatterns.value = this.detectionPatterns.list;
        
        console.log('Learned patterns from content:', this.detectionPatterns);
        await this.updatePreview();
    }
    
    analyzeContentPatterns(lines) {
        const titles = [];
        const headers = [];
        const subheaders = [];
        const lists = [];
        
        lines.forEach(line => {
            if (line.includes('–') || line.includes('—') || (line.length < 100 && line.length > 10 && line[0] === line[0].toUpperCase())) {
                titles.push(line);
            } else if (/^\d+\.\s/.test(line) || (line.length < 100 && line[0] === line[0].toUpperCase() && line.split(' ').length <= 8)) {
                headers.push(line);
            } else if (line.length < 80 && line[0] === line[0].toUpperCase() && line.split(' ').length <= 6) {
                subheaders.push(line);
            } else if (/^[-•*]\s/.test(line) || line.startsWith('  ')) {
                lists.push(line);
            }
        });
        
        return {
            titlePattern: this.generatePatternDescription(titles, 'title'),
            headerPattern: this.generatePatternDescription(headers, 'header'),
            subheaderPattern: this.generatePatternDescription(subheaders, 'subheader'),
            listPattern: this.generatePatternDescription(lists, 'list')
        };
    }
    
    generatePatternDescription(examples, type) {
        if (examples.length === 0) {
            return `No ${type} examples found`;
        }
        
        const patterns = [];
        const lengths = examples.map(line => line.length);
        const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        
        if (type === 'title') {
            if (examples.some(line => line.includes('–') || line.includes('—'))) {
                patterns.push("contains '–' or '—'");
            }
            if (examples.every(line => line[0] === line[0].toUpperCase())) {
                patterns.push("starts with capital");
            }
            patterns.push(`length ${Math.round(avgLength * 0.5)}-${Math.round(avgLength * 1.5)}`);
        } else if (type === 'header') {
            if (examples.some(line => /^\d+\.\s/.test(line))) {
                patterns.push("starts with number.");
            }
            patterns.push("short descriptive text");
            patterns.push(`length ${Math.round(avgLength * 0.5)}-${Math.round(avgLength * 1.5)}`);
        } else if (type === 'subheader') {
            patterns.push("short descriptive");
            if (examples.every(line => !/^\d+\.\s/.test(line))) {
                patterns.push("no numbers");
            }
            patterns.push(`length ${Math.round(avgLength * 0.5)}-${Math.round(avgLength * 1.5)}`);
        } else if (type === 'list') {
            if (examples.some(line => /^[-•*]\s/.test(line))) {
                patterns.push("starts with -, •, *");
            }
            if (examples.some(line => line.startsWith('  '))) {
                patterns.push("or indented");
            }
        }
        
        return patterns.join(', ');
    }

}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StyledPages();
    
    // Track page load
    trackEvent('page_loaded', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    });
});

// Add some smooth scrolling and animations
document.addEventListener('DOMContentLoaded', () => {
    // Add fade-in animation to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    });
    
    featureCards.forEach(card => {
        observer.observe(card);
    });
});
