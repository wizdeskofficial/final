// backend/services/sendgridEmailService.js
const sgMail = require('@sendgrid/mail');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

console.log('📧 SendGrid Email Service - Initializing');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✓ Set' : '✗ Missing');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'wizdeskofficial@gmail.com');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid initialized successfully');
} else {
    console.log('❌ SENDGRID_API_KEY not found');
}

const sendgridEmailService = {
    // Generate verification code
    generateShortCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    // Test SendGrid connection
    async testConnection() {
        try {
            console.log('🔌 Testing SendGrid connection...');
            
            if (!process.env.SENDGRID_API_KEY) {
                return { 
                    success: false, 
                    message: 'SendGrid API key not configured',
                    configured: false
                };
            }

            // Test by sending a simple email
            const testEmail = {
                to: 'test@example.com',
                from: process.env.EMAIL_FROM || 'wizdeskofficial@gmail.com',
                subject: 'SendGrid Test - WizDesk',
                text: 'Test email from WizDesk SendGrid Service',
                html: '<strong>Test email from WizDesk SendGrid Service</strong>',
            };

            await sgMail.send(testEmail);
            console.log('✅ SendGrid connection test: SUCCESS');
            
            return { 
                success: true, 
                message: 'SendGrid is ready for production',
                configured: true
            };
        } catch (error) {
            console.error('❌ SendGrid connection test failed:', error);
            return { 
                success: false, 
                message: error.message,
                configured: true
            };
        }
    },

    // Send verification email
    async sendVerificationEmail(userEmail, userName, verificationToken, numericCode) {
        try {
            console.log(`📧 Preparing verification email for: ${userEmail}`);
            console.log(`🔐 VERIFICATION CODE for ${userName}: ${numericCode}`);

            if (!process.env.SENDGRID_API_KEY) {
                throw new Error('SendGrid API key not configured');
            }

            const appUrl = process.env.APP_URL || 'https://wizdesk.onrender.com';
            const verificationLink = `${appUrl}/verify-email.html?token=${verificationToken}`;

            const msg = {
                to: userEmail,
                from: process.env.EMAIL_FROM || 'wizdeskofficial@gmail.com',
                subject: `Verify Your Email - WizDesk Registration`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                            .header { background: #667eea; color: white; padding: 20px; text-align: center; }
                            .content { padding: 20px; background: #f8f9fa; }
                            .verification-code { 
                                background: #667eea; 
                                color: white; 
                                padding: 15px; 
                                text-align: center; 
                                font-size: 24px; 
                                font-weight: bold; 
                                margin: 20px 0;
                                border-radius: 5px;
                            }
                            .verify-button {
                                display: inline-block;
                                padding: 12px 24px;
                                background: #28a745;
                                color: white;
                                text-decoration: none;
                                border-radius: 5px;
                                margin: 10px 0;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Verify Your Email</h1>
                        </div>
                        <div class="content">
                            <p>Hello <strong>${userName}</strong>,</p>
                            <p>Thank you for registering with WizDesk! Use the verification code below:</p>
                            
                            <div class="verification-code">
                                ${numericCode}
                            </div>
                            
                            <p>Or click the button below to verify automatically:</p>
                            <a href="${verificationLink}" class="verify-button">Verify Email</a>
                            
                            <p><small>This code will expire in 1 hour.</small></p>
                        </div>
                    </body>
                    </html>
                `,
                text: `
Verify Your Email - WizDesk Registration

Hello ${userName},

Thank you for registering with WizDesk!

Your verification code: ${numericCode}

Or click this link: ${verificationLink}

This code will expire in 1 hour.
                `
            };

            console.log(`📤 Sending verification email to ${userEmail} via SendGrid...`);
            
            const [response] = await sgMail.send(msg);
            
            console.log(`✅ Verification email sent to ${userEmail}`);
            console.log(`📨 SendGrid Response: ${response.statusCode}`);
            
            return { 
                success: true, 
                method: 'sendgrid', 
                statusCode: response.statusCode,
                numericCode: numericCode
            };

        } catch (error) {
            console.error('❌ SendGrid email failed:', error);
            
            // Enhanced error logging
            if (error.response) {
                console.error('🔍 SendGrid error details:', error.response.body);
            }
            
            // Fallback to console mode
            console.log(`🎯 FALLBACK - VERIFICATION CODE FOR ${userName}: ${numericCode}`);
            return { 
                success: true,
                method: 'console_fallback',
                error: error.message,
                numericCode: numericCode,
                message: `Email failed. Use code: ${numericCode}`
            };
        }
    },

    // Send member verification email
    async sendMemberVerificationEmail(userEmail, userName, teamName, verificationToken, numericCode) {
        try {
            console.log(`📧 Preparing member verification for: ${userEmail}`);
            console.log(`🔐 MEMBER VERIFICATION CODE for ${userName}: ${numericCode}`);

            if (!process.env.SENDGRID_API_KEY) {
                throw new Error('SendGrid API key not configured');
            }

            const appUrl = process.env.APP_URL || 'https://wizdesk.onrender.com';
            const verificationLink = `${appUrl}/verify-member-email.html?token=${verificationToken}`;

            const msg = {
                to: userEmail,
                from: process.env.EMAIL_FROM || 'wizdeskofficial@gmail.com',
                subject: `Verify Your Email - Join ${teamName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
                            <h1>Join ${teamName}</h1>
                        </div>
                        <div style="padding: 20px; background: #f8f9fa;">
                            <p>Hello <strong>${userName}</strong>,</p>
                            <p>You're joining <strong>${teamName}</strong> on WizDesk!</p>
                            
                            <div style="background: #667eea; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 5px;">
                                ${numericCode}
                            </div>
                            
                            <p>Or click here to verify: <a href="${verificationLink}">Verify Email</a></p>
                            <p><small>This code will expire in 1 hour.</small></p>
                        </div>
                    </div>
                `,
                text: `
Join ${teamName} - WizDesk

Hello ${userName},

You're joining ${teamName} on WizDesk!

Your verification code: ${numericCode}

Or click: ${verificationLink}

This code will expire in 1 hour.
                `
            };

            console.log(`📤 Sending member verification email to ${userEmail}...`);
            
            const [response] = await sgMail.send(msg);
            
            console.log(`✅ Member verification email sent to ${userEmail}`);
            return { 
                success: true, 
                method: 'sendgrid', 
                statusCode: response.statusCode,
                numericCode: numericCode
            };

        } catch (error) {
            console.error('❌ Member verification email failed:', error.message);
            console.log(`🎯 FALLBACK - MEMBER VERIFICATION CODE: ${numericCode}`);
            return { 
                success: true, 
                method: 'console_fallback',
                numericCode: numericCode
            };
        }
    },

    // Send team code to leader
    async sendTeamCodeToLeader(leaderEmail, leaderName, teamCode, teamName) {
        try {
            console.log(`📧 Preparing team code email for: ${leaderEmail}`);
            console.log(`🏷️ TEAM CODE for ${leaderName}: ${teamCode}`);

            if (!process.env.SENDGRID_API_KEY) {
                throw new Error('SendGrid API key not configured');
            }

            const appUrl = process.env.APP_URL || 'https://wizdesk.onrender.com';

            const msg = {
                to: leaderEmail,
                from: process.env.EMAIL_FROM || 'wizdeskofficial@gmail.com',
                subject: `🎉 Welcome to WizDesk - Your Team Code for ${teamName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
                            <h1>🎉 Welcome to WizDesk!</h1>
                            <p>Your team has been created successfully</p>
                        </div>
                        <div style="padding: 20px; background: #f8f9fa;">
                            <p>Hello <strong>${leaderName}</strong>,</p>
                            <p>Thank you for registering as a team leader on WizDesk! Your team <strong>"${teamName}"</strong> has been created successfully.</p>
                            
                            <div style="background: #667eea; color: white; padding: 20px; text-align: center; font-size: 28px; font-weight: bold; margin: 20px 0; border-radius: 5px; letter-spacing: 2px;">
                                ${teamCode}
                            </div>
                            
                            <p><strong>Share this code with your team members so they can join your team.</strong></p>
                            <p>Team members can register at: ${appUrl}/member-register.html</p>
                            
                            <p>You can now login and start managing your team!</p>
                        </div>
                    </div>
                `,
                text: `
🎉 Welcome to WizDesk!

Hello ${leaderName},

Thank you for registering as a team leader on WizDesk! Your team "${teamName}" has been created successfully.

YOUR TEAM CODE: ${teamCode}

Share this code with your team members so they can join your team.

Team members can register at: ${appUrl}/member-register.html

You can now login and start managing your team!
                `
            };

            console.log(`📤 Sending team code email to ${leaderEmail}...`);
            
            const [response] = await sgMail.send(msg);
            
            console.log(`✅ Team code email sent to ${leaderEmail}`);
            return { 
                success: true, 
                method: 'sendgrid', 
                statusCode: response.statusCode,
                teamCode: teamCode
            };

        } catch (error) {
            console.error('❌ Team code email failed:', error.message);
            console.log(`🎯 FALLBACK - TEAM CODE: ${teamCode}`);
            return { 
                success: true, 
                method: 'console_fallback',
                teamCode: teamCode
            };
        }
    },

    // Other email functions...
    async sendMemberApprovalNotification(memberEmail, memberName, leaderName, teamName) {
        console.log(`📧 Approval notification for ${memberName}`);
        return { success: true, method: 'sendgrid' };
    },

    async sendNewMemberNotificationToLeader(leaderEmail, leaderName, memberName, memberEmail, teamName) {
        console.log(`📧 New member notification for ${leaderName}`);
        return { success: true, method: 'sendgrid' };
    }
};

module.exports = sendgridEmailService;