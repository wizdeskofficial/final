// backend/services/emailService.js
const sgMail = require('@sendgrid/mail');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

console.log('📧 Email Service - Initializing');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✓ Set' : '✗ Missing');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'wizdeskofficial@gmail.com');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Initialize SendGrid only if API key exists
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid initialized successfully');
} else {
    console.log('❌ SendGrid API key missing or invalid - using console fallback');
}

const emailService = {
    // Generate verification code (6 digits)
    generateShortCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    // Test email connection
    async testConnection() {
        try {
            console.log('🔌 Testing email service...');
            
            if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_API_KEY.startsWith('SG.')) {
                return { 
                    success: false, 
                    message: 'SendGrid API key not configured properly',
                    configured: false,
                    fallback: true
                };
            }

            const testEmail = {
                to: 'test@example.com',
                from: process.env.EMAIL_FROM || 'wizdeskofficial@gmail.com',
                subject: 'WizDesk - Email Service Test',
                text: 'Test email from WizDesk Email Service',
            };

            await sgMail.send(testEmail);
            console.log('✅ Email service test: SUCCESS');
            
            return { 
                success: true, 
                message: 'Email service is ready',
                configured: true
            };
        } catch (error) {
            console.error('❌ Email service test failed:', error.message);
            return { 
                success: false, 
                message: error.message,
                configured: true,
                fallback: true
            };
        }
    },

    // Send verification email with robust fallback
    async sendVerificationEmail(userEmail, userName, verificationToken, numericCode) {
        try {
            console.log(`\n📧 === EMAIL VERIFICATION REQUEST ===`);
            console.log(`   To: ${userEmail}`);
            console.log(`   Name: ${userName}`);
            console.log(`   Code: ${numericCode}`);
            console.log(`   Token: ${verificationToken}`);
            console.log(`   Environment: ${process.env.NODE_ENV}`);
            console.log(`   SendGrid Key: ${process.env.SENDGRID_API_KEY ? 'Present' : 'Missing'}`);
            
            // Always log to console for development/production fallback
            console.log(`🎯 VERIFICATION CODE FOR ${userName} (${userEmail}): ${numericCode}`);
            console.log(`🔗 Manual verification link: https://wizdesk.onrender.com/verify-email.html?token=${verificationToken}`);

            // Try to send via SendGrid only if properly configured
            let sendgridResult = null;
            if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
                try {
                    const appUrl = process.env.APP_URL || 'https://wizdesk.onrender.com';
                    const verificationLink = `${appUrl}/verify-email.html?token=${verificationToken}`;

                    const msg = {
                        to: userEmail,
                        from: process.env.EMAIL_FROM || 'wizdeskofficial@gmail.com',
                        subject: `Verify Your Email - WizDesk Registration`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
                                    <h1>Verify Your Email</h1>
                                </div>
                                <div style="padding: 20px; background: #f8f9fa;">
                                    <p>Hello <strong>${userName}</strong>,</p>
                                    <p>Thank you for registering with WizDesk! Use the verification code below:</p>
                                    
                                    <div style="background: #667eea; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 5px;">
                                        ${numericCode}
                                    </div>
                                    
                                    <p>Or click the button below to verify automatically:</p>
                                    <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                                        Verify Email
                                    </a>
                                    
                                    <p><small>This code will expire in 1 hour.</small></p>
                                </div>
                            </div>
                        `,
                        text: `Verify Your Email - WizDesk\n\nHello ${userName},\n\nYour verification code: ${numericCode}\n\nOr click: ${verificationLink}\n\nThis code expires in 1 hour.`
                    };

                    console.log(`📤 Attempting to send email via SendGrid to ${userEmail}...`);
                    const [response] = await sgMail.send(msg);
                    
                    sendgridResult = {
                        success: true,
                        method: 'sendgrid',
                        statusCode: response.statusCode,
                        message: 'Email sent successfully via SendGrid'
                    };
                    
                    console.log(`✅ SendGrid email sent successfully to ${userEmail}`);
                    
                } catch (sendgridError) {
                    console.error('❌ SendGrid failed:', sendgridError.message);
                    if (sendgridError.response) {
                        console.error('🔍 SendGrid error details:', sendgridError.response.body);
                    }
                    sendgridResult = {
                        success: false,
                        method: 'sendgrid_failed',
                        error: sendgridError.message,
                        message: 'SendGrid delivery failed'
                    };
                }
            } else {
                console.log('📧 SendGrid not configured - using console fallback only');
                sendgridResult = {
                    success: false,
                    method: 'sendgrid_not_configured',
                    message: 'SendGrid API key not configured'
                };
            }

            // Always return success with console fallback
            return {
                success: true, // Always return true so registration continues
                method: sendgridResult.success ? 'sendgrid' : 'console_fallback',
                numericCode: numericCode,
                emailSent: sendgridResult.success || false,
                sendgridResult: sendgridResult,
                fallbackMessage: `Verification code: ${numericCode} (Check server console)`
            };

        } catch (error) {
            console.error('❌ Email service critical error:', error);
            // Even if everything fails, return success with console code
            return {
                success: true,
                method: 'console_fallback_error',
                numericCode: numericCode,
                emailSent: false,
                error: error.message,
                fallbackMessage: `Critical error. Use code: ${numericCode}`
            };
        }
    },

    // Send member verification email
    async sendMemberVerificationEmail(userEmail, userName, teamName, verificationToken, numericCode) {
        try {
            console.log(`\n📧 === MEMBER VERIFICATION REQUEST ===`);
            console.log(`   To: ${userEmail}`);
            console.log(`   Name: ${userName}`);
            console.log(`   Team: ${teamName}`);
            console.log(`   Code: ${numericCode}`);
            console.log(`   Token: ${verificationToken}`);

            // Always log to console
            console.log(`🎯 MEMBER VERIFICATION CODE FOR ${userName}: ${numericCode}`);

            // Try SendGrid if available
            let sendgridResult = null;
            if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
                try {
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
                        text: `Join ${teamName} - WizDesk\n\nHello ${userName},\n\nYour verification code: ${numericCode}\n\nOr click: ${verificationLink}`
                    };

                    const [response] = await sgMail.send(msg);
                    sendgridResult = { success: true, method: 'sendgrid', statusCode: response.statusCode };
                    console.log(`✅ Member verification email sent to ${userEmail}`);
                    
                } catch (error) {
                    console.error('❌ Member email failed:', error.message);
                    sendgridResult = { success: false, method: 'sendgrid_failed', error: error.message };
                }
            }

            return {
                success: true,
                method: sendgridResult?.success ? 'sendgrid' : 'console_fallback',
                numericCode: numericCode,
                emailSent: sendgridResult?.success || false,
                fallbackMessage: `Member verification code: ${numericCode}`
            };

        } catch (error) {
            console.error('❌ Member email critical error:', error);
            return {
                success: true,
                method: 'console_fallback_error',
                numericCode: numericCode,
                emailSent: false,
                error: error.message
            };
        }
    },

    // Send team code to leader
    async sendTeamCodeToLeader(leaderEmail, leaderName, teamCode, teamName) {
        try {
            console.log(`\n📧 === TEAM CODE EMAIL ===`);
            console.log(`   To: ${leaderEmail}`);
            console.log(`   Leader: ${leaderName}`);
            console.log(`   Team: ${teamName}`);
            console.log(`   Team Code: ${teamCode}`);

            // Always log to console
            console.log(`🏷️ TEAM CODE FOR ${leaderName}: ${teamCode}`);

            // Try SendGrid if available
            let sendgridResult = null;
            if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
                try {
                    const appUrl = process.env.APP_URL || 'https://wizdesk.onrender.com';

                    const msg = {
                        to: leaderEmail,
                        from: process.env.EMAIL_FROM || 'wizdeskofficial@gmail.com',
                        subject: `🎉 Welcome to WizDesk - Your Team Code for ${teamName}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
                                    <h1>🎉 Welcome to WizDesk!</h1>
                                </div>
                                <div style="padding: 20px; background: #f8f9fa;">
                                    <p>Hello <strong>${leaderName}</strong>,</p>
                                    <p>Your team <strong>"${teamName}"</strong> has been created!</p>
                                    
                                    <div style="background: #667eea; color: white; padding: 20px; text-align: center; font-size: 28px; font-weight: bold; margin: 20px 0; border-radius: 5px;">
                                        ${teamCode}
                                    </div>
                                    
                                    <p><strong>Share this code with your team members!</strong></p>
                                    <p>Team members register at: ${appUrl}/member-register.html</p>
                                </div>
                            </div>
                        `,
                        text: `Welcome to WizDesk!\n\nTeam: ${teamName}\nTeam Code: ${teamCode}\n\nShare with your team members!`
                    };

                    const [response] = await sgMail.send(msg);
                    sendgridResult = { success: true, method: 'sendgrid', statusCode: response.statusCode };
                    console.log(`✅ Team code email sent to ${leaderEmail}`);
                    
                } catch (error) {
                    console.error('❌ Team code email failed:', error.message);
                    sendgridResult = { success: false, method: 'sendgrid_failed', error: error.message };
                }
            }

            return {
                success: true,
                method: sendgridResult?.success ? 'sendgrid' : 'console_fallback',
                teamCode: teamCode,
                emailSent: sendgridResult?.success || false,
                fallbackMessage: `Team code: ${teamCode}`
            };

        } catch (error) {
            console.error('❌ Team code email critical error:', error);
            return {
                success: true,
                method: 'console_fallback_error',
                teamCode: teamCode,
                emailSent: false,
                error: error.message
            };
        }
    },

    // Other email functions remain the same...
    async sendMemberApprovalNotification(memberEmail, memberName, leaderName, teamName) {
        console.log(`📧 Approval notification for ${memberName} (${memberEmail})`);
        return { success: true, method: 'console_log' };
    },

    async sendNewMemberNotificationToLeader(leaderEmail, leaderName, memberName, memberEmail, teamName) {
        console.log(`📧 New member ${memberName} (${memberEmail}) for team ${teamName}`);
        return { success: true, method: 'console_log' };
    }
};

module.exports = emailService;
