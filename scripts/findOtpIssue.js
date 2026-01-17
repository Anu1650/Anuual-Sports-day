const http = require('http');

console.log('🔍 Finding OTP Verification Issue...\n');

// Test the OTP verification API directly
const testData = {
    otpId: 'test-otp-id',
    otp: '123456'
};

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/otp/verify-otp',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    console.log(`📡 API Response Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('📄 API Response Body:', data);
        console.log('\n💡 Based on the response:');
        
        if (res.statusCode === 400) {
            console.log('1. OTP verification failed (expected for test data)');
            console.log('2. The API endpoint is working correctly');
            console.log('3. Issue is likely with OTP ID storage/retrieval');
        } else if (res.statusCode === 200) {
            console.log('1. API is working');
            console.log('2. Check frontend JavaScript for issues');
        } else {
            console.log('1. Server error - check server logs');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ API Request Failed:', error.message);
    console.log('\n💡 Server might not be running on port 5000');
});

req.write(JSON.stringify(testData));
req.end();

console.log('\n📝 Checking common issues:');
console.log('1. Is server running? (port 5000)');
console.log('2. Are OTP routes properly defined?');
console.log('3. Is OTP service being imported correctly?');
console.log('4. Check browser console for JavaScript errors');