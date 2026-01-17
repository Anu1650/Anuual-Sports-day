const crypto = require('crypto');

class OTPService {
    constructor() {
        this.otpStore = new Map();
        this.otpExpiryMinutes = 10; // OTP valid for 10 minutes
    }

    generateOTP() {
        // Generate 6-digit OTP
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    storeOTP(email, phone, otp, data = {}) {
        const otpId = crypto.randomBytes(16).toString('hex');
        const expiryTime = Date.now() + (this.otpExpiryMinutes * 60 * 1000);
        
        this.otpStore.set(otpId, {
            email: email ? email.toLowerCase() : null,
            phone,
            otp: otp.toString(),
            expiryTime,
            verified: false,
            data: {
                ...data,
                created: new Date()
            }
        });

        // Auto-cleanup after expiry
        setTimeout(() => {
            if (this.otpStore.has(otpId)) {
                const stored = this.otpStore.get(otpId);
                if (!stored.verified) {
                    this.otpStore.delete(otpId);
                    console.log(`🧹 Cleaned up expired OTP: ${otpId}`);
                }
            }
        }, this.otpExpiryMinutes * 60 * 1000 + 5000);

        return otpId;
    }

    verifyOtp(otpId, otp, action = null) {
        if (!this.otpStore.has(otpId)) {
            return {
                success: false,
                message: 'OTP not found or expired'
            };
        }

        const stored = this.otpStore.get(otpId);
        
        // Check if expired
        if (Date.now() > stored.expiryTime) {
            this.otpStore.delete(otpId);
            return {
                success: false,
                message: 'OTP has expired'
            };
        }

        // Check if already verified
        if (stored.verified) {
            return {
                success: false,
                message: 'OTP already used'
            };
        }

        // Check if action matches (if specified)
        if (action && stored.data?.action !== action) {
            return {
                success: false,
                message: 'Invalid OTP for this action'
            };
        }

        // Verify OTP
        if (stored.otp !== otp.toString()) {
            return {
                success: false,
                message: 'Invalid OTP'
            };
        }

        // Mark as verified
        stored.verified = true;
        this.otpStore.set(otpId, stored);

        return {
            success: true,
            message: 'OTP verified successfully',
            data: stored.data
        };
    }

    // Alias for backward compatibility
    verifyOTP(otpId, otp) {
        return this.verifyOtp(otpId, otp);
    }

    getOtpById(otpId) {
        return this.otpStore.get(otpId);
    }

    getOtpByEmail(email) {
        for (const [id, data] of this.otpStore) {
            if (data.email && data.email.toLowerCase() === email.toLowerCase()) {
                return { id, ...data };
            }
        }
        return null;
    }

    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [id, data] of this.otpStore) {
            if (now > data.expiryTime) {
                this.otpStore.delete(id);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired OTPs`);
        }
        
        return cleaned;
    }
}

module.exports = new OTPService();