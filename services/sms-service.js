require('dotenv').config();

class SMSService {
    constructor() {
        this.client = null;
        console.log('📱 SMS service initialized (demo mode)');
    }

    async sendOTPSMS(phoneNumber, otp, purpose = 'registration') {
        try {
            // Clean phone number (remove non-digits)
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            
            // Demo mode - log to console
            console.log(`📱 DEMO: OTP for ${cleanPhone}: ${otp}`);
            
            return { 
                success: true, 
                demoMode: true,
                message: `Demo Mode: OTP would be sent to ${cleanPhone}. OTP: ${otp}`
            };
            
        } catch (error) {
            console.error('❌ SMS sending error:', error);
            return { 
                success: true, 
                demoMode: true,
                message: `Demo Mode: OTP would be sent. OTP: ${otp}`
            };
        }
    }
}

module.exports = new SMSService();