// backend/test-email.js
const emailService = require('./services/emailService');

async function testEmailService() {
    console.log('🧪 Testing Email Service...\n');
    
    // Test 1: Connection test
    console.log('1. Testing SendGrid connection...');
    const connectionTest = await emailService.testConnection();
    console.log('Connection Test:', connectionTest);
    console.log('');
    
    // Test 2: Send verification email
    console.log('2. Testing verification email...');
    const verificationTest = await emailService.sendVerificationEmail(
        'test@example.com', // Replace with your email for testing
        'Test User',
        'test-token-123',
        '123456'
    );
    console.log('Verification Test:', verificationTest);
    console.log('');
    
    console.log('✅ Email service test completed');
}

testEmailService().catch(console.error);