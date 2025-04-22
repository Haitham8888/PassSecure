// Firebase Authentication Implementation for Registration with 2FA/MFA
document.addEventListener('DOMContentLoaded', () => {
    // تهيئة Firebase باستخدام المعلومات المخزنة في متغيرات البيئة (.env)
    // في الإصدار الإنتاجي، سيتم استخدام firebase-config.js المحسّن للأمان
    const firebaseApp = firebase.initializeApp({
        apiKey: "AIzaSyDCfD-zj3D4MWniZCmOPB9i1rscb04C_PI",
        authDomain: "pass-e223f.firebaseapp.com",
        projectId: "pass-e223f",
        storageBucket: "pass-e223f.firebasestorage.app",
        messagingSenderId: "1045988247363",
        appId: "1:1045988247363:web:1e779b4d1c2808336ad1f6",
        measurementId: "G-4B00LDMXXK"
    });
    
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // DOM elements
    const registerForm = document.getElementById('register-form');
    const phoneForm = document.getElementById('phone-form');
    const otpForm = document.getElementById('otp-form');
    const mfaForm = document.getElementById('mfa-form');
    const mfaSetupDoneBtn = document.getElementById('mfa-setup-done');
    const passwordField = document.getElementById('password');
    const passwordConfirmField = document.getElementById('confirm-password');
    const passwordMeter = document.getElementById('password-strength-meter');
    const passwordText = document.getElementById('password-strength-text');
    const loader = document.getElementById('loader');
    const goToDashboardBtn = document.getElementById('go-to-dashboard');
    
    // Authentication flow variables
    let currentStep = 'step-login';
    let verificationId = '';
    let currentUser = null;
    let secret = '';
    const authSteps = document.querySelectorAll('.auth-step');
    
    // Show loading state
    function showLoading() {
        loader.classList.add('visible');
    }
    
    // Hide loading state
    function hideLoading() {
        loader.classList.remove('visible');
    }
    
    // UI Navigation - Switch between steps
    function showStep(stepId) {
        authSteps.forEach(step => {
            step.classList.add('hidden');
        });
        document.getElementById(stepId).classList.remove('hidden');
        currentStep = stepId;
        
        // Reset scroll position when changing steps
        window.scrollTo(0, 0);
    }
    
    // Generate TOTP Secret for MFA
    function generateSecret() {
        // تتكون من 16 بايت من البيانات العشوائية
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        secret = base32Encode(bytes);
        
        // عرض السر في الواجهة
        document.getElementById('secret-key').textContent = secret;
        
        // إنشاء رمز QR باستخدام مكتبة QRCode
        const qrUrl = `otpauth://totp/PassSecure:${currentUser.email}?secret=${secret}&issuer=PassSecure`;
        QRCode.toCanvas(document.getElementById('qr-code'), qrUrl, {
            width: 200,
            color: {
                dark: '#2c3e50',
                light: '#ffffff'
            }
        });
    }
    
    // Base32 Encode helper for TOTP
    function base32Encode(data) {
        const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let result = '';
        
        // Convert byte array to binary string
        let bits = '';
        for (const byte of data) {
            bits += byte.toString(2).padStart(8, '0');
        }
        
        // Process 5 bits at a time
        for (let i = 0; i < bits.length; i += 5) {
            const chunk = bits.slice(i, i + 5).padEnd(5, '0');
            const index = parseInt(chunk, 2);
            result += CHARS[index];
        }
        
        return result;
    }
    
    // الحصول على عناصر متطلبات كلمة المرور
    const reqLength = document.getElementById('req-length');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqLowercase = document.getElementById('req-lowercase');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');
    const passwordSuggestion = document.getElementById('password-suggestion');
    const passwordExample = document.getElementById('password-example');

    // توليد كلمات مرور قوية للاقتراح
    function generateStrongPasswordSuggestion() {
        const words = ['Pass', 'Secure', 'Safe', 'Lock', 'Guard', 'Shield', 'Protect'];
        const numbers = ['2023', '1234', '2025', '5678', '2024', '9876'];
        const symbols = ['!', '@', '#', '$', '%', '&', '*'];
        
        const randomWord = words[Math.floor(Math.random() * words.length)];
        const randomWord2 = words[Math.floor(Math.random() * words.length)];
        const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        
        return randomWord + randomSymbol + randomWord2 + randomNumber;
    }
    
    // تحديث مثال كلمة المرور القوية
    function updatePasswordSuggestion() {
        passwordExample.textContent = generateStrongPasswordSuggestion();
    }

    // تحديث متطلب محدد
    function updateRequirement(element, isFulfilled) {
        const icon = element.querySelector('i');
        icon.className = isFulfilled ? 'fas fa-check-circle' : 'fas fa-times-circle';
        
        if (isFulfilled) {
            element.classList.add('fulfilled');
        } else {
            element.classList.remove('fulfilled');
        }
    }

    // Validate password strength with enhanced UI feedback
    function validatePassword(password) {
        let score = 0;
        const feedback = [];
        
        // Length check
        const hasLength = password.length >= 8;
        updateRequirement(reqLength, hasLength);
        if (hasLength) {
            score += 1;
        } else {
            feedback.push('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل');
        }
        
        // Uppercase check
        const hasUppercase = /[A-Z]/.test(password);
        updateRequirement(reqUppercase, hasUppercase);
        if (hasUppercase) {
            score += 1;
        } else {
            feedback.push('يجب أن تحتوي على حرف كبير');
        }
        
        // Lowercase check
        const hasLowercase = /[a-z]/.test(password);
        updateRequirement(reqLowercase, hasLowercase);
        if (hasLowercase) {
            score += 1;
        } else {
            feedback.push('يجب أن تحتوي على حرف صغير');
        }
        
        // Number check
        const hasNumber = /[0-9]/.test(password);
        updateRequirement(reqNumber, hasNumber);
        if (hasNumber) {
            score += 1;
        } else {
            feedback.push('يجب أن تحتوي على رقم');
        }
        
        // Special character check
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        updateRequirement(reqSpecial, hasSpecial);
        if (hasSpecial) {
            score += 1;
        } else {
            feedback.push('يجب أن تحتوي على رمز خاص (مثل !@#$%)');
        }
        
        // Update UI
        passwordMeter.className = '';
        
        // Show/hide password suggestion box
        if (score <= 3 && password.length > 0) {
            passwordSuggestion.classList.add('show');
            // Generate new suggestion if the user's password is weak
            updatePasswordSuggestion();
        } else {
            passwordSuggestion.classList.remove('show');
        }
        
        // Update password strength meter and text
        if (score <= 2) {
            passwordMeter.classList.add('weak');
            passwordText.textContent = 'ضعيف - ' + feedback.join('، ');
            return false;
        } else if (score <= 4) {
            passwordMeter.classList.add('medium');
            passwordText.textContent = 'متوسط - ' + (feedback.length > 0 ? feedback.join('، ') : 'كلمة مرور جيدة، لكن يمكن تحسينها');
            return true;
        } else {
            passwordMeter.classList.add('strong');
            passwordText.textContent = 'قوي - كلمة مرور آمنة';
            return true;
        }
    }
    
    // Handle password visibility toggle
    const togglePassword = document.querySelector('.toggle-password');
    if (togglePassword && passwordField) {
        togglePassword.addEventListener('click', () => {
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }
    
    // Real-time password validation
    if (passwordField) {
        passwordField.addEventListener('input', () => {
            validatePassword(passwordField.value);
        });
    }
    
    // Setup reCAPTCHA for phone verification
    function setupRecaptcha() {
        const recaptchaContainer = document.getElementById('recaptcha-container');
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(recaptchaContainer, {
            'size': 'normal',
            'callback': (response) => {
                // reCAPTCHA solved
            }
        });
        window.recaptchaVerifier.render();
    }
    
    // OTP input auto-focus functionality
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('keyup', (e) => {
            // If the input has a value, focus on the next input
            if (input.value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
            
            // If backspace is pressed and the input is empty, focus on the previous input
            if (e.key === 'Backspace' && index > 0 && !input.value) {
                otpInputs[index - 1].focus();
            }
        });
    });
    
    // Timer for OTP resend
    function startTimer(duration) {
        const timerElement = document.getElementById('timer');
        const resendBtn = document.getElementById('resend-btn');
        
        let timer = duration;
        const interval = setInterval(() => {
            const minutes = parseInt(timer / 60, 10);
            const seconds = parseInt(timer % 60, 10);
            
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (--timer < 0) {
                clearInterval(interval);
                resendBtn.disabled = false;
                timerElement.textContent = '';
            }
        }, 1000);
        
        return interval;
    }
    
    // Register new user with email/password
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = passwordField.value;
            const confirmPassword = passwordConfirmField.value;
            const agreeTerms = document.getElementById('agree').checked;
            
            // Basic validation
            if (!name || !email || !password || !confirmPassword) {
                alert('يرجى ملء جميع الحقول المطلوبة');
                return;
            }
            
            if (!agreeTerms) {
                alert('يجب الموافقة على الشروط والأحكام للمتابعة');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('كلمات المرور غير متطابقة');
                return;
            }
            
            if (!validatePassword(password)) {
                alert('يرجى استخدام كلمة مرور أقوى');
                return;
            }
            
            showLoading();
            
            try {
                // إنشاء مستخدم جديد في Firebase Authentication
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                currentUser = userCredential.user;
                
                // إضافة بيانات المستخدم إلى Firestore
                await db.collection('users').doc(currentUser.uid).set({
                    name,
                    email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // الانتقال إلى خطوة التحقق برقم الجوال
                showStep('step-phone');
                setupRecaptcha();
            } catch (error) {
                console.error('Error registering user:', error);
                alert(`خطأ في التسجيل: ${error.message}`);
            } finally {
                hideLoading();
            }
        });
    }
    
    // Phone verification
    if (phoneForm) {
        phoneForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const phoneNumber = document.getElementById('phone').value;
            
            if (!phoneNumber) {
                alert('يرجى إدخال رقم الجوال');
                return;
            }
            
            showLoading();
            
            try {
                // أرسل رمز التحقق إلى رقم الهاتف باستخدام Firebase Auth
                const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+966${phoneNumber.replace(/^0/, '')}`;
                
                verificationId = await auth.signInWithPhoneNumber(
                    formattedPhone, 
                    window.recaptchaVerifier
                ).then((result) => {
                    return result.verificationId;
                });
                
                // الانتقال إلى خطوة إدخال رمز التحقق
                showStep('step-otp');
                startTimer(180); // 3 minutes
            } catch (error) {
                console.error('Error sending verification code:', error);
                alert(`خطأ في إرسال رمز التحقق: ${error.message}`);
            } finally {
                hideLoading();
            }
        });
    }
    
    // OTP verification
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // جمع الرمز من حقول الإدخال
            let otp = '';
            otpInputs.forEach((input) => {
                otp += input.value;
            });
            
            if (otp.length !== 6) {
                alert('يرجى إدخال رمز التحقق المكون من 6 أرقام');
                return;
            }
            
            showLoading();
            
            try {
                // التحقق من صحة الرمز باستخدام Firebase Auth
                const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, otp);
                
                await currentUser.linkWithCredential(credential);
                
                // تحديث حساب المستخدم في Firestore
                await db.collection('users').doc(currentUser.uid).update({
                    phoneVerified: true,
                    phoneNumber: currentUser.phoneNumber
                });
                
                // الانتقال إلى خطوة إعداد MFA
                showStep('step-mfa');
                generateSecret(); // توليد سر TOTP للاستخدام مع تطبيقات المصادقة
            } catch (error) {
                console.error('Error verifying OTP:', error);
                alert(`خطأ في التحقق من الرمز: ${error.message}`);
            } finally {
                hideLoading();
            }
        });
    }
    
    // Handle MFA setup completion
    if (mfaSetupDoneBtn) {
        mfaSetupDoneBtn.addEventListener('click', () => {
            // Hide QR setup and show verification form
            document.getElementById('qr-setup').classList.add('hidden');
            document.getElementById('mfa-form').classList.remove('hidden');
        });
    }
    
    // MFA verification
    if (mfaForm) {
        mfaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const mfaCode = document.getElementById('mfa-code').value;
            
            if (!mfaCode || mfaCode.length !== 6) {
                alert('يرجى إدخال رمز المصادقة المكون من 6 أرقام');
                return;
            }
            
            showLoading();
            
            try {
                // Note: هنا في التطبيق الحقيقي ستحتاج لتنفيذ خادم خلفي للتحقق من صحة رمز MFA
                // نفترض صحة الرمز هنا لأغراض العرض التوضيحي
                
                // تحديث حساب المستخدم في Firestore
                await db.collection('users').doc(currentUser.uid).update({
                    mfaEnabled: true,
                    mfaSecret: secret, // في التطبيق الحقيقي، يجب تشفير هذا قبل تخزينه
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // اكتمال عملية التسجيل
                showStep('step-success');
                
                // عرض رسالة النجاح لمدة ٣ ثواني ثم التوجيه إلى الصفحة الرئيسية
                setTimeout(() => {
                    // إنشاء رسالة نجاح في الصفحة الرئيسية
                    sessionStorage.setItem('authSuccess', 'true');
                    sessionStorage.setItem('userName', document.getElementById('name').value);
                    
                    // الانتقال إلى الصفحة الرئيسية
                    window.location.href = 'index.html';
                }, 3000);
            } catch (error) {
                console.error('Error verifying MFA code:', error);
                alert(`خطأ في التحقق من رمز المصادقة: ${error.message}`);
            } finally {
                hideLoading();
            }
        });
    }
    
    // Copy Secret Key Button
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const secretElement = document.getElementById('secret-key');
            const text = secretElement.textContent;
            
            navigator.clipboard.writeText(text).then(() => {
                // تغيير أيقونة الزر مؤقتًا للإشارة إلى النجاح
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            });
        });
    }
    
    // Dashboard button in success screen
    if (goToDashboardBtn) {
        goToDashboardBtn.addEventListener('click', () => {
            // إنشاء رسالة نجاح في الصفحة الرئيسية
            sessionStorage.setItem('authSuccess', 'true');
            sessionStorage.setItem('userName', document.getElementById('name').value);
            
            // توجيه المستخدم إلى الصفحة الرئيسية
            window.location.href = 'index.html';
        });
    }
});
