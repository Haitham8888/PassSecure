// FireBase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "passsecure-app.firebaseapp.com",
    projectId: "passsecure-app",
    storageBucket: "passsecure-app.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Document elements
document.addEventListener('DOMContentLoaded', () => {
    // Ensure RTL direction is properly set
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    
    // Navigation menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Smooth scrolling for navigation links
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    scrollLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            
            // Close mobile menu if it's open
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }

            // Scroll to the target
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Password visibility toggle
    const togglePassword = document.querySelector('.toggle-password');
    const passwordField = document.getElementById('password-field');

    if (togglePassword && passwordField) {
        togglePassword.addEventListener('click', () => {
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }

    // Password strength checker
    const strengthMeterBar = document.getElementById('strength-meter-bar');
    const strengthText = document.getElementById('strength-text');
    const feedbackContainer = document.getElementById('feedback-container');

    if (passwordField && strengthMeterBar && strengthText) {
        passwordField.addEventListener('input', checkPasswordStrength);
    }

    function checkPasswordStrength() {
        const password = passwordField.value;
        let strength = 0;
        let feedback = [];

        // Check the password length
        if (password.length > 0) {
            if (password.length < 8) {
                feedback.push('كلمة المرور قصيرة جدًا، يجب أن تكون 8 أحرف على الأقل');
            } else {
                strength += 20;
            }

            // Check for mixed case
            if (password.match(/[a-z]/) && password.match(/[A-Z]/)) {
                strength += 20;
            } else {
                feedback.push('يجب أن تحتوي على أحرف كبيرة وصغيرة');
            }

            // Check for numbers
            if (password.match(/\d/)) {
                strength += 20;
            } else {
                feedback.push('يجب أن تحتوي على أرقام');
            }

            // Check for special characters
            if (password.match(/[^a-zA-Z\d]/)) {
                strength += 20;
            } else {
                feedback.push('يجب أن تحتوي على رموز خاصة');
            }

            // Check for repeated characters
            if (!password.match(/(.)\1{2,}/)) {
                strength += 20;
            } else {
                feedback.push('تجنب تكرار نفس الحرف أكثر من مرتين');
            }
        } else {
            strengthText.textContent = 'لم يتم إدخال كلمة مرور بعد';
            strengthMeterBar.style.width = '0%';
            strengthMeterBar.style.backgroundColor = '#eee';
            feedbackContainer.innerHTML = '';
            return;
        }

        // Update the strength meter
        strengthMeterBar.style.width = strength + '%';

        // Change color based on strength
        if (strength < 40) {
            strengthMeterBar.style.backgroundColor = '#e74c3c';
            strengthText.textContent = 'ضعيفة';
        } else if (strength < 70) {
            strengthMeterBar.style.backgroundColor = '#f39c12';
            strengthText.textContent = 'متوسطة';
        } else {
            strengthMeterBar.style.backgroundColor = '#27ae60';
            strengthText.textContent = 'قوية';
        }

        // Display feedback
        if (feedback.length > 0) {
            feedbackContainer.innerHTML = '<ul>' + feedback.map(item => `<li>${item}</li>`).join('') + '</ul>';
        } else {
            feedbackContainer.innerHTML = '<p class="success-text">كلمة مرور ممتازة! 👍</p>';
        }
    }

    // Contact form submission
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', e => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            // Add to Firebase
            db.collection('contacts').add({
                name: name,
                email: email,
                message: message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                // Show success message
                contactForm.innerHTML = `
                    <div class="success-message">
                        <i class="fas fa-check-circle"></i>
                        <h3>تم إرسال رسالتك بنجاح!</h3>
                        <p>سنتواصل معك في أقرب وقت ممكن.</p>
                        <button class="btn primary" onclick="window.location.reload()">إرسال رسالة أخرى</button>
                    </div>
                `;
            })
            .catch(error => {
                console.error("Error writing document: ", error);
                alert("حدث خطأ أثناء إرسال رسالتك. يرجى المحاولة مرة أخرى.");
            });
        });
    }

    // Animation on scroll
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    
    function checkScroll() {
        animateElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.classList.add('visible');
            }
        });
    }
    
    // Check elements on initial load
    checkScroll();
    
    // Check elements on scroll
    window.addEventListener('scroll', checkScroll);
});
