// إظهار رسالة نجاح التسجيل
document.addEventListener('DOMContentLoaded', () => {
    // التحقق مما إذا كان المستخدم قد أتى من صفحة التسجيل
    const authSuccess = sessionStorage.getItem('authSuccess');
    const userName = sessionStorage.getItem('userName');
    
    if (authSuccess === 'true') {
        // إنشاء عنصر رسالة النجاح
        const successMessage = document.createElement('div');
        successMessage.className = 'success-toast';
        
        // تعيين محتوى الرسالة
        let messageContent = '<i class="fas fa-check-circle"></i>';
        messageContent += `<div class="toast-message">`;
        messageContent += `<h4>تم التسجيل بنجاح!</h4>`;
        
        if (userName) {
            messageContent += `<p>مرحباً ${userName}، نتمنى لك تجربة آمنة</p>`;
        } else {
            messageContent += `<p>تم تسجيل حسابك بنجاح</p>`;
        }
        
        messageContent += `</div>`;
        messageContent += `<button class="close-toast"><i class="fas fa-times"></i></button>`;
        
        successMessage.innerHTML = messageContent;
        
        // إضافة الرسالة إلى الصفحة
        document.body.appendChild(successMessage);
        
        // إظهار الرسالة بتأثير بصري
        setTimeout(() => {
            successMessage.classList.add('show');
        }, 300);
        
        // إغلاق الرسالة عند النقر على زر الإغلاق
        const closeButton = successMessage.querySelector('.close-toast');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                successMessage.classList.remove('show');
                setTimeout(() => {
                    successMessage.remove();
                    // حذف معلومات الجلسة بعد إغلاق الرسالة
                    sessionStorage.removeItem('authSuccess');
                    sessionStorage.removeItem('userName');
                }, 300);
            });
        }
        
        // إغلاق الرسالة تلقائيًا بعد 5 ثوانٍ
        setTimeout(() => {
            if (document.body.contains(successMessage)) {
                successMessage.classList.remove('show');
                setTimeout(() => {
                    successMessage.remove();
                    // حذف معلومات الجلسة بعد إغلاق الرسالة
                    sessionStorage.removeItem('authSuccess');
                    sessionStorage.removeItem('userName');
                }, 300);
            }
        }, 5000);
    }
});
