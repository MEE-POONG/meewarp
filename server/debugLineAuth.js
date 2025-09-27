const axios = require('axios');
const config = require('./config/env');

const lineConfig = {
  channelId: config.line.channelId,
  channelSecret: config.line.channelSecret,
  callbackUrl: 'https://api-meewarp.me-prompt-technology.com/api/v1/auth/line/callback',
};

console.log('LINE Configuration:', {
  channelId: lineConfig.channelId,
  channelSecret: lineConfig.channelSecret?.substring(0, 8) + '...',
  callbackUrl: lineConfig.callbackUrl,
});

// Generate LINE login URL
const params = new URLSearchParams({
  response_type: 'code',
  client_id: lineConfig.channelId,
  redirect_uri: lineConfig.callbackUrl,
  state: 'default',
  scope: 'profile openid',
});

const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
console.log('\n=== LINE Login URL ===');
console.log('Login URL:', loginUrl);

// Test with the provided code
const testCode = 'vAjrRIGLVrI0yjVNpwl2';

async function testLineAuth() {
  try {
    console.log('\n=== Testing LINE Token Exchange ===');
    
    const params = {
      grant_type: 'authorization_code',
      code: testCode,
      redirect_uri: lineConfig.callbackUrl,
      client_id: lineConfig.channelId,
      client_secret: lineConfig.channelSecret,
    };

    console.log('Request params:', {
      ...params,
      client_secret: params.client_secret?.substring(0, 8) + '...'
    });

    const response = await axios.post(
      'https://api.line.me/oauth2/v2.1/token',
      new URLSearchParams(params).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('✅ Token exchange successful:', response.data);
    
    // Test ID token verification
    if (response.data.id_token) {
      console.log('\n=== Testing ID Token Verification ===');
      
      const verifyResponse = await axios.post(
        'https://api.line.me/oauth2/v2.1/verify',
        new URLSearchParams({
          id_token: response.data.id_token,
          client_id: lineConfig.channelId,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.log('✅ ID token verification successful:', verifyResponse.data);
    }

  } catch (error) {
    console.error('❌ LINE Auth Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
  }
}

testLineAuth();
