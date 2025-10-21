// backend/services/emailService.js
const sgMail = require('@sendgrid/mail');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

console.log('📧 SendGrid Email Service - Initializing');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✓ Set' : '✗ Missing');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'wizdeskofficial@gmail.com');
console.log('APP_URL:', process.env.APP_URL || 'https://wizdesk.onrender.com');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid initialized successfully');
} else {
    console.log('❌ SENDGRID_API_KEY not found');
}

const emailService = {
    // Generate verification code (6 digits)
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

    // Send verification email with SendGrid
    async sendVerificationEmail(userEmail, userName, verificationToken, numericCode) {
        try {
            console.log(`📧 Preparing verification email for: ${userEmail}`);
            console.log(`🔐 VERIFICATION CODE for ${userName}: ${numericCode}`);

            if (!process.env.SENDGRID_API_KEY) {
                // Even if SendGrid fails, we still return success with console fallback
                console.log(`🎯 CONSOLE FALLBACK - VERIFICATION CODE FOR ${userName}: ${numericCode}`);
                return { 
                    success: true,
                    method: 'console_fallback',
                    numericCode: numericCode,
                    message: `Email service not configured. Use code: ${numericCode}`
                };
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
                numericCode: numericCode,
                message: 'Verification email sent successfully'
            };

        } catch (error) {
            console.error('❌ SendGrid email failed:', error);
            
            // Enhanced error logging
            if (error.response) {
                console.error('🔍 SendGrid error details:', error.response.body);
            }
            
            // Fallback to console mode - but still return success
            console.log(`🎯 FALLBACK - VERIFICATION CODE FOR ${userName}: ${numericCode}`);
            return { 
                success: true,
                method: 'console_fallback',
                error: error.message,
                numericCode: numericCode,
                message: `Email delivery failed. Use code: ${numericCode}`
            };
        }
    },

    // Send member verification email with SendGrid
    async sendMemberVerificationEmail(userEmail, userName, teamName, verificationToken, numericCode) {
        try {
            console.log(`📧 Preparing member verification for: ${userEmail}`);
            console.log(`🔐 MEMBER VERIFICATION CODE for ${userName}: ${numericCode}`);

            if (!process.env.SENDGRID_API_KEY) {
                console.log(`🎯 CONSOLE FALLBACK - MEMBER VERIFICATION CODE: ${numericCode}`);
                return { 
                    success: true, 
                    method: 'console_fallback',
                    numericCode: numericCode,
                    message: `Email service not configured. Use code: ${numericCode}`
                };
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
                numericCode: numericCode,
                message: 'Member verification email sent successfully'
            };

        } catch (error) {
            console.error('❌ Member verification email failed:', error.message);
            console.log(`🎯 FALLBACK - MEMBER VERIFICATION CODE: ${numericCode}`);
            return { 
                success: true, 
                method: 'console_fallback',
                numericCode: numericCode,
                message: `Email delivery failed. Use code: ${numericCode}`
            };
        }
    },

    // Send team code to leader with SendGrid
    async sendTeamCodeToLeader(leaderEmail, leaderName, teamCode, teamName) {
        try {
            console.log(`📧 Preparing team code email for: ${leaderEmail}`);
            console.log(`🏷️ TEAM CODE for ${leaderName}: ${teamCode}`);

            if (!process.env.SENDGRID_API_KEY) {
                console.log(`🎯 CONSOLE FALLBACK - TEAM CODE: ${teamCode}`);
                return { 
                    success: true, 
                    method: 'console_fallback',
                    teamCode: teamCode,
                    message: `Email service not configured. Team code: ${teamCode}`
                };
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
                teamCode: teamCode,
                message: 'Team code email sent successfully'
            };

        } catch (error) {
            console.error('❌ Team code email failed:', error.message);
            console.log(`🎯 FALLBACK - TEAM CODE: ${teamCode}`);
            return { 
                success: true, 
                method: 'console_fallback',
                teamCode: teamCode,
                message: `Email delivery failed. Team code: ${teamCode}`
            };
        }
    },

    // Send member approval notification with SendGrid
    async sendMemberApprovalNotification(memberEmail, memberName, leaderName, teamName) {
        try {
            console.log(`📧 Preparing approval email for: ${memberEmail}`);
            
            if (!process.env.SENDGRID_API_KEY) {
                console.log(`📧 Approval notification skipped for ${memberName} - email not configured`);
                return { 
                    success: true,
                    method: 'console_fallback',
                    message: 'Email service not configured'
                };
            }

            const appUrl = process.env.APP_URL || 'https://wizdesk.onrender.com';

            const msg = {
                to: memberEmail,
                from: process.env.EMAIL_FROM || 'wizdeskofficial@gmail.com',
                subject: `✅ Membership Approved - Welcome to ${teamName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
                            <h1>✅ Membership Approved!</h1>
                            <p>Welcome to the team!</p>
                        </div>
                        <div style="padding: 20px; background: #f8f9fa;">
                            <p>Hello <strong>${memberName}</strong>,</p>
                            <p>Great news! Your membership request for team <strong>"${teamName}"</strong> has been approved by <strong>${leaderName}</strong>.</p>
                            <p>You are now an official member of the team and can start working on assigned tasks.</p>
                            <p>Login to your dashboard: <a href="${appUrl}">${appUrl}</a></p>
                            <p>Start contributing to your team's success!</p>
                        </div>
                    </div>
                `,
                text: `
✅ Membership Approved - Welcome to ${teamName}

Hello ${memberName},

Great news! Your membership request for team "${teamName}" has been approved by ${leaderName}.

You are now an official member of the team and can start working on assigned tasks.

Login to your dashboard: ${appUrl}

Start contributing to your team's success!
                `
            };

            console.log(`📤 Sending approval email to ${memberEmail}...`);
            
            const [response] = await sgMail.send(msg);
            
            console.log(`✅ Approval email sent to ${memberEmail}`);
            return { 
                success: true, 
                method: 'sendgrid', 
                statusCode: response.statusCode,
                message: 'Approval email sent successfully'
            };

        } catch (error) {
            console.error('❌ Approval email failed:', error);
            console.log(`📧 Approval notification failed for ${memberName}`);
            return { 
                success: false,
                method: 'console_fallback',
                error: error.message,
                message: 'Failed to send approval email'
            };
        }
    },

    // Send new member notification to leader with SendGrid
    async sendNewMemberNotificationToLeader(leaderEmail, leaderName, memberName, memberEmail, teamName) {
        try {
            console.log(`📧 Preparing new member notification for: ${leaderEmail}`);
            
            if (!process.env.SENDGRID_API_KEY) {
                console.log(`📧 New member notification skipped for ${leaderName} - email not configured`);
                return { 
                    success: true,
                    method: 'console_fallback',
                    message: 'Email service not configured'
                };
            }

            const appUrl = process.env.APP_URL || 'https://wizdesk.onrender.com';

            const msg = {
                to: leaderEmail,
                from: process.env.EMAIL_FROM || 'wizdeskofficial@gmail.com',
                subject: `👤 New Member Request for ${teamName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
                            <h1>👤 New Member Request</h1>
                            <p>Action required for team ${teamName}</p>
                        </div>
                        <div style="padding: 20px; background: #f8f9fa;">
                            <p>Hello <strong>${leaderName}</strong>,</p>
                            <p>A new member has requested to join your team <strong>${teamName}</strong>.</p>
                            
                            <p><strong>Member Details:</strong></p>
                            <p><strong>Name:</strong> ${memberName}</p>
                            <p><strong>Email:</strong> ${memberEmail}</p>
                            <p><strong>Status:</strong> Pending Approval</p>
                            
                            <p>Please review and approve or reject this member request in your leader dashboard.</p>
                            <p>Login to review: <a href="${appUrl}/leader-dashboard.html">${appUrl}/leader-dashboard.html</a></p>
                        </div>
                    </div>
                `,
                text: `
👤 New Member Request for ${teamName}

Hello ${leaderName},

A new member has requested to join your team ${teamName}.

Member Details:
Name: ${memberName}
Email: ${memberEmail}
Status: Pending Approval

Please review and approve or reject this member request in your leader dashboard.

Login to review: ${appUrl}/leader-dashboard.html
                `
            };

            console.log(`📤 Sending new member notification to ${leaderEmail}...`);
            
            const [response] = await sgMail.send(msg);
            
            console.log(`✅ New member notification sent to ${leaderEmail}`);
            return { 
                success: true, 
                method: 'sendgrid', 
                statusCode: response.statusCode,
                message: 'New member notification sent successfully'
            };

        } catch (error) {
            console.error('❌ New member notification failed:', error);
            console.log(`📧 New member notification failed for ${leaderName}`);
            return { 
                success: false,
                method: 'console_fallback',
                error: error.message,
                message: 'Failed to send new member notification'
            };
        }
    }
};

module.exports = emailService;