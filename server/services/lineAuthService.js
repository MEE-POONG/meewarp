const axios = require('axios');
const config = require('../config/env');

class LineAuthService {
  constructor() {
    this.channelId = config.line.channelId;
    this.channelSecret = config.line.channelSecret;
    this.callbackUrl = config.line.callbackUrl;
  }

  isConfigured() {
    return !!(this.channelId && this.channelSecret && this.callbackUrl);
  }

  getLoginUrl(state = null) {
    if (!this.isConfigured()) {
      throw new Error('LINE Login is not configured');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.channelId,
      redirect_uri: this.callbackUrl,
      state: state || 'default',
      scope: 'profile openid',
    });

    return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code) {
    if (!this.isConfigured()) {
      throw new Error('LINE Login is not configured');
    }

    const params = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.callbackUrl,
      client_id: this.channelId,
      client_secret: this.channelSecret,
    };

    console.log('LINE token exchange request:', {
      url: 'https://api.line.me/oauth2/v2.1/token',
      params: {
        ...params,
        client_secret: params.client_secret?.substring(0, 8) + '...'
      }
    });

    try {
      const response = await axios.post(
        'https://api.line.me/oauth2/v2.1/token',
        new URLSearchParams(params).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.log('LINE token exchange success:', response.data);
      return response.data;
    } catch (error) {
      console.error('LINE token exchange error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error('Failed to exchange code for token');
    }
  }

  async getUserProfile(accessToken) {
    try {
      const response = await axios.get('https://api.line.me/v2/profile', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('LINE profile fetch error:', error.response?.data || error.message);
      throw new Error('Failed to fetch user profile');
    }
  }

  async verifyIdToken(idToken) {
    if (!this.isConfigured()) {
      throw new Error('LINE Login is not configured');
    }

    try {
      const response = await axios.post(
        'https://api.line.me/oauth2/v2.1/verify',
        new URLSearchParams({
          id_token: idToken,
          client_id: this.channelId,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('LINE ID token verification error:', error.response?.data || error.message);
      throw new Error('Failed to verify ID token');
    }
  }
}

module.exports = new LineAuthService();
