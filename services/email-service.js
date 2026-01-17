const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = null;
        
        // Only create transporter if email credentials are available
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            console.log('📧 Email service initialized');
        } else {
            console.log('⚠️ Email credentials not found. Running in demo mode.');
        }
    }

    async sendOTPEmail(email, otp, name, purpose = 'registration') {
        try {
            // Validate email
            if (!this.isValidEmail(email)) {
                throw new Error('Invalid email address');
            }

            // If transporter is not available, run in demo mode
            if (!this.transporter) {
                console.log(`📧 DEMO: OTP for ${email}: ${otp}`);
                return { 
                    success: true, 
                    demoMode: true, 
                    message: `Demo Mode: OTP would be sent to ${email}. OTP: ${otp}` 
                };
            }

            const mailOptions = {
                from: `"Sports Day 2K25" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `Your OTP for Sports Day ${purpose === 'registration' ? 'Registration' : 'Deletion'}`,
                html: this.generateOTPEmailHTML(name, otp, purpose)
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`📧 Email sent to ${email}:`, info.messageId);
            return { success: true, messageId: info.messageId };
            
        } catch (error) {
            console.error('❌ Email sending error:', error.message);
            
            // Fallback to console output
            console.log(`📧 DEMO FALLBACK: OTP for ${email}: ${otp}`);
            return { 
                success: true, 
                demoMode: true, 
                message: `Demo Mode: OTP would be sent to ${email}. OTP: ${otp}` 
            };
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    generateOTPEmailHTML(name, otp, purpose) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                .header { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 30px 20px; 
                    text-align: center; 
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 24px;
                }
                .content { 
                    padding: 30px; 
                }
                .otp-box { 
                    background: #f8f9fa; 
                    border: 2px dashed #667eea; 
                    padding: 25px; 
                    text-align: center; 
                    margin: 25px 0; 
                    font-size: 36px; 
                    font-weight: bold; 
                    letter-spacing: 8px; 
                    color: #667eea; 
                    border-radius: 8px;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 30px; 
                    color: #666; 
                    font-size: 12px; 
                    padding: 20px;
                    border-top: 1px solid #eee;
                }
                .warning { 
                    background: #fff3cd; 
                    border: 1px solid #ffeaa7; 
                    padding: 15px; 
                    border-radius: 5px; 
                    margin: 20px 0; 
                    color: #856404;
                }
                .btn {
                    display: inline-block;
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Annual Sports Day 2K25</h1>
                    <p>Registration Portal</p>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>Your OTP for ${purpose === 'registration' ? 'registration' : 'deletion'} is:</p>
                    <div class="otp-box">${otp}</div>
                    <div class="warning">
                        ⚠️ <strong>Important:</strong> This OTP is valid for 10 minutes only.
                        Do not share this OTP with anyone.
                    </div>
                    <p>If you didn't request this OTP, please ignore this email.</p>
                    <p>Best regards,<br>Sports Day Organizing Committee</p>
                </div>
                <div class="footer">
                    <p>© 2025 Annual Sports Day 2K25. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

module.exports = new EmailService();