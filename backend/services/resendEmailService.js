// backend/services/resendEmailService.js
const { Resend } = require('resend');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

console.log('📧 Resend Email Service - Environment check:');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✓ Set' : '✗ Missing');

const resend = new Resend(process.env.RESEND_API_KEY);

const resendEmailService = {
    // Generate verification code
    generateShortCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    // Test connection
    async testConnection() {
        try {
            console.log('🔌 Testing Resend connection...');
            const { data, error } = await resend.emails.send({
                from: process.env.EMAIL_FROM || 'WizDesk <onboarding@resend.dev>',
                to: ['test@example.com'],
                subject: 'Resend Test - WizDesk',
                html: '<strong>Test email from WizDesk Resend Service</strong>',
            });

            if (error) {
                console.error('❌ Resend connection test failed:', error);
                return { success: false, message: error.message };
            }

            console.log('✅ Resend connection test: SUCCESS');
            return { success: true, message: 'Resend is ready' };
        } catch (error) {
            console.error('❌ Resend connection test failed:', error);
            return { success: false, message: error.message };
        }
    },

    // Send verification email
    async sendVerificationEmail(userEmail, userName, verificationToken, numericCode) {
        try {
            console.log(`📧 Preparing verification email for: ${userEmail}`);
            console.log(`🔐 VERIFICATION CODE for ${userName}: ${numericCode}`);

            const appUrl = process.env.APP_URL || 'https://wizdesk.onrender.com';
            const verificationLink = `${appUrl}/verify-email.html?token=${verificationToken}`;

            const { data, error } = await resend.emails.send({
                from: process.env.EMAIL_FROM || 'WizDesk <onboarding@resend.dev>',
                to: [userEmail],
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
            });

            if (error) {
                console.error('❌ Resend email failed:', error);
                // Fallback to console mode
                console.log(`🎯 FALLBACK - VERIFICATION CODE: ${numericCode}`);
                return { 
                    success: true,
                    method: 'console_fallback',
                    error: error.message,
                    numericCode: numericCode
                };
            }

            console.log(`✅ Verification email sent to ${userEmail}`);
            return { 
                success: true, 
                method: 'resend', 
                messageId: data.id,
                numericCode: numericCode
            };

        } catch (error) {
            console.error('❌ Verification email failed:', error.message);
            console.log(`🎯 FALLBACK - VERIFICATION CODE: ${numericCode}`);
            
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

            const appUrl = process.env.APP_URL || 'https://wizdesk.onrender.com';
            const verificationLink = `${appUrl}/verify-member-email.html?token=${verificationToken}`;

            const { data, error } = await resend.emails.send({
                from: process.env.EMAIL_FROM || 'WizDesk <onboarding@resend.dev>',
                to: [userEmail],
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
            });

            if (error) {
                console.error('❌ Member verification email failed:', error);
                console.log(`🎯 FALLBACK - MEMBER CODE: ${numericCode}`);
                return { 
                    success: true,
                    method: 'console_fallback',
                    numericCode: numericCode
                };
            }

            console.log(`✅ Member verification email sent to ${userEmail}`);
            return { 
                success: true, 
                method: 'resend', 
                messageId: data.id,
                numericCode: numericCode
            };

        } catch (error) {
            console.error('❌ Member verification email failed:', error.message);
            console.log(`🎯 FALLBACK - MEMBER CODE: ${numericCode}`);
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

            const appUrl = process.env.APP_URL || 'https://wizdesk.onrender.com';

            const { data, error } = await resend.emails.send({
                from: process.env.EMAIL_FROM || 'WizDesk <onboarding@resend.dev>',
                to: [leaderEmail],
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
            });

            if (error) {
                console.error('❌ Team code email failed:', error);
                console.log(`🎯 FALLBACK - TEAM CODE: ${teamCode}`);
                return { 
                    success: true,
                    method: 'console_fallback',
                    teamCode: teamCode
                };
            }

            console.log(`✅ Team code email sent to ${leaderEmail}`);
            return { 
                success: true, 
                method: 'resend', 
                messageId: data.id,
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

    // Other email functions can be added similarly...
    async sendMemberApprovalNotification(memberEmail, memberName, leaderName, teamName) {
        console.log(`📧 Approval notification for ${memberName}`);
        return { success: true, method: 'console_fallback' };
    },

    async sendNewMemberNotificationToLeader(leaderEmail, leaderName, memberName, memberEmail, teamName) {
        console.log(`📧 New member notification for ${leaderName}`);
        return { success: true, method: 'console_fallback' };
    }
};

module.exports = resendEmailService;