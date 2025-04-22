// Firebase configuration with environment variables protection
class FirebaseService {
    constructor() {
        this.app = null;
        this.auth = null;
        this.firestore = null;
        this.analytics = null;
        this.initialized = false;
    }

    // Load environment variables safely
    loadEnvConfig() {
        // في الإصدار الإنتاجي، تُحمل هذه القيم من الخادم أو من عملية بناء الموقع
        // استخدام هذه الطريقة يساعد في حماية المفاتيح من الظهور في الكود المصدري المُرسل للمتصفح
        return {
            apiKey: process.env.FIREBASE_API_KEY || "",
            authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
            projectId: process.env.FIREBASE_PROJECT_ID || "",
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
            appId: process.env.FIREBASE_APP_ID || "",
            measurementId: process.env.FIREBASE_MEASUREMENT_ID || ""
        };
    }

    // Initialize Firebase services
    async initialize() {
        if (this.initialized) return;

        try {
            // Import Firebase modules dynamically for better performance and tree-shaking
            const { initializeApp } = await import('firebase/app');
            const { getAuth } = await import('firebase/auth');
            const { getFirestore } = await import('firebase/firestore');
            const { getAnalytics } = await import('firebase/analytics');
            
            const config = this.loadEnvConfig();
            this.app = initializeApp(config);
            this.auth = getAuth(this.app);
            this.firestore = getFirestore(this.app);
            
            // Initialize analytics only in production
            if (process.env.NODE_ENV === 'production') {
                this.analytics = getAnalytics(this.app);
            }
            
            this.initialized = true;
            console.log('Firebase services initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
        }
    }

    // Get Firebase Auth instance
    getAuth() {
        if (!this.initialized) throw new Error('Firebase not initialized');
        return this.auth;
    }

    // Get Firestore instance
    getFirestore() {
        if (!this.initialized) throw new Error('Firebase not initialized');
        return this.firestore;
    }

    // Get Analytics instance
    getAnalytics() {
        if (!this.initialized || !this.analytics) {
            throw new Error('Firebase Analytics not initialized');
        }
        return this.analytics;
    }
}

// Export singleton instance
export const firebaseService = new FirebaseService();

// Auto-initialize Firebase when imported
firebaseService.initialize().catch(console.error);
