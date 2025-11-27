# HubSpot WhatsApp Calling Widget

A complete HubSpot calling widget that enables WhatsApp voice calls directly from HubSpot CRM, with Meta-compliant permission management.

## Features

- **Outgoing Calls**: Make WhatsApp voice calls to contacts directly from HubSpot
- **Incoming Calls**: Receive WhatsApp calls routed to the contact's assigned owner
- **Meta Permission Compliance**: Built-in permission request workflow following Meta's WhatsApp Business API guidelines
- **Call Recording**: Optional call recording with HubSpot transcription support
- **Real-time Updates**: WebSocket-based real-time call status updates
- **HubSpot Integration**: Automatic call logging and engagement tracking
- **HubSpot Theme**: Professional UI following HubSpot design guidelines

## Tech Stack

- **Frontend**: React 18, TypeScript, Styled Components
- **HubSpot SDK**: @hubspot/calling-extensions-sdk v0.9.7
- **Voice**: Twilio Voice SDK (WebRTC)
- **Real-time**: Socket.IO Client
- **Build**: Webpack 5

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend API server (see `/backend` directory)
- Twilio Account with WhatsApp Business API
- HubSpot Developer Account

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure environment variables
nano .env

# Start development server
npm start
```

## Environment Variables

```env
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_WEBSOCKET_URL=wss://your-backend-url.com
REACT_APP_TWILIO_WHATSAPP_NUMBER=+14155238886
```

## HubSpot Setup

### 1. Register Calling Extension

In your HubSpot developer account:

1. Go to Apps > Your App > Extensions
2. Add "Calling" extension
3. Set the Widget URL to your deployed widget URL
4. Enable `supportsInboundCalling` for incoming calls
5. Set `usesCallingWindow` to `true` for detached window support

### 2. Configure Extension Settings

```bash
curl -X PATCH \
  'https://api.hubapi.com/crm/v3/extensions/calling/{APP_ID}/settings' \
  -H 'Authorization: Bearer {ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{
    "supportsInboundCalling": true,
    "usesCallingWindow": true
  }'
```

## Meta Permission Workflow

This widget follows Meta's WhatsApp Business API guidelines for voice calls:

1. **Permission Request**: Before calling, send a permission request to the contact
2. **User Consent**: Contact receives WhatsApp message and taps "Accept"
3. **Call Window**: Must call within 72 hours of permission grant
4. **Auto-Revoke**: Permission revoked after 4 consecutive missed calls
5. **Expiry**: Permissions expire after 90 days

### Rate Limits
- 1 permission request per 24 hours per number
- Maximum 2 requests per 7 days per number

## Call Flow

### Outgoing Calls
1. User enters phone number
2. Widget validates permission status
3. If no permission → Show permission request screen
4. If permission granted → Initiate WebRTC call via Twilio
5. Call logged to HubSpot engagement

### Incoming Calls
1. WhatsApp call arrives at Twilio
2. Backend looks up contact → Gets assigned owner
3. WebSocket notifies owner's widget
4. Owner accepts/declines call
5. Call logged to HubSpot engagement

## Screens

- **Loading**: Initial SDK connection
- **Login**: User authentication
- **Keypad**: Main dialing interface with availability toggle
- **Permission Request**: Request Meta permission
- **Permission Pending**: Waiting for contact to accept
- **Permission Denied**: Permission rejected/expired
- **Dialing**: Outbound call connecting
- **Incoming**: Incoming call notification
- **Calling**: Active call with mute, keypad, notes
- **Call Ended**: Summary and save options

## Development

```bash
# Start dev server
npm start

# Build for production
npm run build

# Build for development
npm run build:dev
```

## Deployment

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables for Vercel
Set these in Vercel project settings:
- `REACT_APP_API_URL`
- `REACT_APP_WEBSOCKET_URL`
- `REACT_APP_TWILIO_WHATSAPP_NUMBER`

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wacall/api/permissions/request` | POST | Request call permission |
| `/wacall/api/permissions/status/:phone` | GET | Check permission status |
| `/wacall/api/permissions/validate` | POST | Validate before calling |
| `/wacall/api/token` | GET | Get Twilio access token |
| `/wacall/api/calls/initiate` | POST | Initiate outbound call |
| `/wacall/api/calls/end` | POST | End active call |

## Project Structure

```
hubwa-widget/
├── src/
│   ├── components/
│   │   ├── screens/         # UI screens
│   │   ├── App.tsx          # Main app component
│   │   └── Icons.tsx        # SVG icons
│   ├── hooks/
│   │   ├── useCti.ts        # HubSpot SDK hook
│   │   ├── usePermission.ts # Permission management
│   │   └── useCallTimer.ts  # Call duration
│   ├── services/
│   │   ├── api.service.ts   # Backend API
│   │   ├── websocket.service.ts # Real-time events
│   │   └── webrtc.service.ts # Twilio Voice SDK
│   ├── theme/
│   │   ├── colors.ts        # HubSpot colors
│   │   └── styled.ts        # Styled components
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   ├── utils/
│   │   └── formatters.ts    # Utility functions
│   └── index.tsx            # Entry point
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

## License

MIT

## Support

For issues and feature requests, please open an issue on GitHub.
