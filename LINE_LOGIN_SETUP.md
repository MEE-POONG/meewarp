# LINE Login Setup Guide

## Overview
This application now requires users to login with LINE before they can create warp transactions. This provides better user tracking and prevents spam.

## Backend Setup

### 1. Install Dependencies
The required dependencies are already installed:
- `@line/bot-sdk`
- `passport`
- `passport-line-auth`
- `express-session`

### 2. Environment Variables
Add these variables to your `.env` file:

```env
# LINE Login Configuration
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CALLBACK_URL=http://localhost:5173/line/callback
```

### 3. LINE Developer Console Setup

1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Create a new provider or use existing one
3. Create a new Channel
4. Select "LINE Login" as the channel type
5. Fill in the required information:
   - App name: MeeWarp
   - App description: Warp display system
   - App icon: Upload your app icon
   - Privacy policy URL: Your privacy policy URL
   - Terms of service URL: Your terms of service URL

6. Configure the channel:
   - **Callback URL**: `http://localhost:5173/line/callback` (for development)
   - **OpenID Connect**: Enable
   - **Bot linking**: Optional

7. Get your credentials:
   - **Channel ID**: Copy from the Basic settings tab
   - **Channel secret**: Copy from the Basic settings tab

### 4. Database Schema
The system automatically creates a `User` collection with the following fields:
- `lineUserId`: Unique LINE user ID
- `displayName`: User's display name from LINE
- `pictureUrl`: User's profile picture URL
- `statusMessage`: User's status message
- `email`: User's email (if available)
- `lastLoginAt`: Last login timestamp
- `isActive`: User status flag

## Frontend Setup

### 1. LINE Login Flow
1. User clicks "เข้าสู่ระบบ LINE" button
2. User is redirected to LINE login page
3. After successful login, user is redirected back to `/line/callback`
4. The callback page exchanges the authorization code for a token
5. User is redirected back to the original page

### 2. Authentication State
The `LineAuthContext` manages:
- User authentication state
- Token storage in localStorage
- Automatic token verification
- Login/logout functionality

### 3. Protected Routes
The following features now require LINE login:
- Creating warp transactions (CustomerWarpModal)
- Self-warp page (SelfWarpPage)

## API Endpoints

### Authentication Endpoints
- `GET /api/v1/auth/line/login` - Get LINE login URL
- `POST /api/v1/auth/line/callback` - Handle LINE callback
- `GET /api/v1/auth/verify` - Verify user token
- `POST /api/v1/auth/logout` - Logout user

### Protected Endpoints
- `POST /api/v1/public/transactions` - Now requires LINE authentication

## Security Features

1. **JWT Tokens**: User sessions are managed with JWT tokens
2. **Token Verification**: All protected endpoints verify the JWT token
3. **User Tracking**: All transactions are linked to LINE user accounts
4. **Rate Limiting**: Existing rate limiting still applies

## Development vs Production

### Development
- Callback URL: `http://localhost:5173/line/callback`
- LINE Channel: Use sandbox/test channel

### Production
- Callback URL: `https://yourdomain.com/line/callback`
- LINE Channel: Use production channel
- Update environment variables accordingly

## Testing

1. Start the server: `cd server && npm start`
2. Start the client: `cd client && npm run dev`
3. Try to create a warp transaction
4. You should be prompted to login with LINE
5. After login, you should be able to create transactions

## Troubleshooting

### Common Issues

1. **"LINE Login is not configured"**
   - Check that all LINE environment variables are set
   - Verify the LINE channel is properly configured

2. **"Invalid callback URL"**
   - Ensure the callback URL in LINE console matches your environment variable
   - Check that the callback URL is accessible

3. **"Token verification failed"**
   - Check that JWT_SECRET is properly set
   - Verify the token hasn't expired

4. **"User not found"**
   - Check that the user was properly created in the database
   - Verify the LINE user ID is being stored correctly

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment.

## Migration Notes

Existing warp transactions without LINE user data will continue to work, but new transactions require LINE login. The system automatically uses LINE profile data (name, picture) when available, falling back to manually entered data if needed.
