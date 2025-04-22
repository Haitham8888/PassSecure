// FireBase Authentication for Login with 2FA/MFA
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase
    const firebaseApp = firebase.initializeApp({
        apiKey: "YOUR_API_KEY",
        authDomain: "passsecure-app.firebaseapp.com",
        projectId: "passsecure-app",
        storageBucket: "passsecure-app.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    });
    
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Authentication flow variables
    let currentStep = 'step-login';
    let verificationId = '';
    let currentUser = null;
    let secret = '';
    
    // DOM elements
    const authSteps = document.querySelectorAll('.auth-step');
    const loginForm = document.getElementById('login-form');
    const phoneForm = document.getElementById('phone-form');
    const otpForm = document.getElementById('otp-form');
    const mfaForm = document.getElementById('mfa-form');
    const registerBtn = document.getElementById('register-btn');
    const otpInputs = document.querySelectorAll('.otp-input');
    const resendBtn = document.getElementById('resend-btn');
    const timerElement = document.getElementById('timer');
    const copyBtn = document.getElementById('copy-btn');
    const mfaSetupDoneBtn = document.getElementById('mfa-setup-done');
    
    // UI Navigation - Switch between steps
    function showStep(stepId) {
        authSteps.forEach(step => {
            step.classList.add('hidden');
        });
        document.getElementById(stepId).classList.remove('hidden');
        currentStep = stepId;
    }
    
    // Handle password visibility toggle
    const togglePassword = document.querySelector('.toggle-password');
    const passwordField = document.getElementById('password');
    
    if (togglePassword && passwordField) {
        togglePassword.addEventListener('click', () => {
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }
    
    // OTP input auto-focus functionality
    otpInputs.forEach((input, index) => {
        input.addEventListener('keyup', (e) => {
            // If the input has a value, focus on the next input
            if (input.value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
            
            // If backspace is pressed, focus on the previous input
            if (e.key === 'Backspace' && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });
    
    // Timer for OTP resend
    function startTimer(duration) {
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
    }
    
    // Setup reCAPTCHA
    function setupRecaptcha() {
        const recaptchaContainer = document.getElementById('recaptcha-container');
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(recaptchaContainer, {
            'size': 'normal',
            'callback': (response) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
        });
        window.recaptchaVerifier.render();
    }
    
    // Send OTP to phone
    function sendOTP(phoneNumber) {
        return auth.signInWithPhoneNumber(phoneNumber, window.recaptchaVerifier)
            .then((confirmationResult) => {
                verificationId = confirmationResult.verificationId;
                showStep('step-otp');
                startTimer(180); // 3 minutes
                return true;
            })
            .catch((error) => {
                alert(`خطأ في إرسال رمز التحقق: ${error.message}`);
                return false;
            });
    }
    
    // Generate QR code for MFA setup
    function generateQRCode(secretKey, email) {
        const qrContainer = document.getElementById('qr-code');
        const secretKeyElement = document.getElementById('secret-key');
        
        // Format: otpauth://totp/Label:user@email.com?secret=SECRET&issuer=PassSecure
        const otpauth = `otpauth://totp/PassSecure:${email}?secret=${secretKey}&issuer=PassSecure`;
        
        // Generate QR code
        QRCode.toCanvas(qrContainer, otpauth, { width: 200 }, function (error) {
            if (error) console.error(error);
        });
        
        secretKeyElement.textContent = secretKey;
    }
    
    // Generate a random secret key for MFA
    function generateSecretKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    // Check if user has MFA enabled
    function checkMFAStatus(user) {
        return db.collection('users').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists && doc.data().mfaEnabled) {
                    return true;
                }
                return false;
            })
            .catch(() => false);
    }
    
    // Enable MFA for user
    function enableMFA(user, secretKey) {
        return db.collection('users').doc(user.uid).set({
            email: user.email,
            mfaEnabled: true,
            mfaSecretKey: secretKey
        }, { merge: true });
    }
    
    // Event Listeners
    
    // Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    currentUser = userCredential.user;
                    setupRecaptcha();
                    showStep('step-phone');
                })
                .catch((error) => {
                    alert(`خطأ في تسجيل الدخول: ${error.message}`);
                });
        });
    }
    
    // Phone Form Submission
    if (phoneForm) {
        phoneForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const phoneNumber = document.getElementById('phone').value;
            // Format phone number for international format (add Saudi Arabia country code if needed)
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+966${phoneNumber.replace(/^0/, '')}`;
            sendOTP(formattedPhone);
        });
    }
    
    // OTP Form Submission
    if (otpForm) {
        otpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let otp = '';
            otpInputs.forEach(input => {
                otp += input.value;
            });
            
            const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, otp);
            
            auth.currentUser.linkWithCredential(credential)
                .then(() => {
                    // Check if user has MFA enabled
                    return checkMFAStatus(auth.currentUser);
                })
                .then((mfaEnabled) => {
                    if (mfaEnabled) {
                        // User already has MFA setup, go to MFA verification
                        document.getElementById('qr-setup').classList.add('hidden');
                        showStep('step-mfa');
                    } else {
                        // User needs to setup MFA
                        secret = generateSecretKey();
                        generateQRCode(secret, auth.currentUser.email);
                        document.getElementById('qr-setup').classList.remove('hidden');
                        showStep('step-mfa');
                    }
                })
                .catch((error) => {
                    alert(`خطأ في التحقق من الرمز: ${error.message}`);
                });
        });
    }
    
    // MFA Form Submission
    if (mfaForm) {
        mfaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const mfaCode = document.getElementById('mfa-code').value;
            
            // In a real app, you'd verify the MFA code with the secret on your server
            // For this demo, we'll just simulate a successful verification
            
            // If it's a new MFA setup, store the secret
            if (!document.getElementById('qr-setup').classList.contains('hidden')) {
                enableMFA(auth.currentUser, secret)
                    .then(() => {
                        showStep('step-success');
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 3000);
                    })
                    .catch(error => {
                        alert(`خطأ في تمكين المصادقة الثنائية: ${error.message}`);
                    });
            } else {
                // Existing MFA user
                showStep('step-success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            }
        });
    }
    
    // Register Button Click
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            // In a real app, redirect to registration page
            alert('سيتم توجيهك إلى صفحة التسجيل');
        });
    }
    
    // Resend OTP Button Click
    if (resendBtn) {
        resendBtn.addEventListener('click', () => {
            const phoneNumber = document.getElementById('phone').value;
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+966${phoneNumber.replace(/^0/, '')}`;
            sendOTP(formattedPhone);
        });
    }
    
    // Copy Secret Key Button
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const secretKeyElement = document.getElementById('secret-key');
            const tempInput = document.createElement('input');
            tempInput.value = secretKeyElement.textContent;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            // Show copied feedback
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        });
    }
    
    // MFA Setup Done Button
    if (mfaSetupDoneBtn) {
        mfaSetupDoneBtn.addEventListener('click', () => {
            document.getElementById('qr-setup').classList.add('hidden');
            document.getElementById('mfa-code').focus();
        });
    }
});
