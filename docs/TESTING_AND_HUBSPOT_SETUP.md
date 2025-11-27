# Testing & HubSpot Setup Guide

## Testing Locally (Standalone Mode)

### 1. Start the Widget

```bash
cd hubwa-widget
npm install
npm start
```

The widget will open at `http://localhost:3001`

### 2. What Works in Standalone Mode

When running outside HubSpot, the widget automatically detects "Standalone Mode":

- **Login Screen** - Shows dev mode banner
- **Keypad Screen** - Full dialing interface
- **Permission Screens** - All permission flows (requires backend)
- **Simulate Incoming** - Test button to simulate incoming calls
- **All Call Screens** - Dialing, Calling, Call Ended

### 3. Backend Required

For full functionality, start your backend server:

```bash
cd ../backend
npm run dev
```

Make sure `.env` in `hubwa-widget` points to your backend:
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WEBSOCKET_URL=http://localhost:3000
REACT_APP_TWILIO_WHATSAPP_NUMBER=+447366331247
```

### 4. Testing Flow

1. Click **"Start Testing (Dev Mode)"**
2. Enter a phone number (e.g., `+1234567890`)
3. Click the green call button
4. Widget will check permissions via backend API
5. If no permission → Shows permission request screen
6. Use **"Test Incoming"** button to simulate incoming calls

---

## HubSpot Integration Setup

### Step 1: Create HubSpot Developer Account

1. Go to https://developers.hubspot.com/
2. Create a developer account if you don't have one
3. Create a new app or use existing one

### Step 2: Register Calling Extension

1. In your HubSpot developer account, go to **Apps** → **Your App**
2. Click **"Extensions"** in the left sidebar
3. Click **"Add extension"** → Select **"Calling"**

### Step 3: Configure Calling Extension

**Basic Settings:**
```
Name: WhatsApp Calling
Widget URL: https://your-deployed-widget-url.com
Width: 400
Height: 650
```

**Advanced Settings (via API):**

```bash
curl -X PATCH \
  'https://api.hubapi.com/crm/v3/extensions/calling/{APP_ID}/settings' \
  -H 'Authorization: Bearer {ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "WhatsApp Calling",
    "url": "https://your-deployed-widget-url.com",
    "width": 400,
    "height": 650,
    "supportsInboundCalling": true,
    "usesCallingWindow": true
  }'
```

### Step 4: Deploy Widget

**Option A: Vercel (Recommended)**

```bash
cd hubwa-widget
npm run build
npx vercel --prod
```

Set environment variables in Vercel:
- `REACT_APP_API_URL` = Your backend URL
- `REACT_APP_WEBSOCKET_URL` = Your backend WebSocket URL
- `REACT_APP_TWILIO_WHATSAPP_NUMBER` = Your Twilio WhatsApp number

**Option B: Other Hosting**

Build and deploy the `dist` folder:
```bash
npm run build
# Upload dist/ to your hosting provider
```

### Step 5: Install App in HubSpot Account

1. Go to your HubSpot developer app
2. Click **"Install app"**
3. Select a test portal/account
4. Authorize the required scopes

### Step 6: Use the Widget in HubSpot

1. Open HubSpot CRM
2. Go to any **Contact** or **Company** record
3. Click on the **Call** button in the sidebar
4. Select **"WhatsApp Calling"** from the dropdown
5. The widget will load inside HubSpot

---

## API Configuration (HubSpot Extension Settings)

### Enable Incoming Calls

```bash
# PATCH /crm/v3/extensions/calling/{APP_ID}/settings
{
  "supportsInboundCalling": true,
  "usesCallingWindow": true
}
```

### Enable Channel Connection (for Help Desk)

```bash
# POST /crm/v3/extensions/calling/{APP_ID}/settings/channel-connection
{
  "url": "https://your-backend.com/wacall/api/phone-numbers",
  "isReady": true
}
```

This webhook returns available phone numbers for the calling provider.

### Enable Recordings & Transcriptions

```bash
# POST /crm/v3/extensions/calling/{APP_ID}/settings/recording
{
  "urlToRetrieveAuthedRecording": "https://your-backend.com/wacall/api/recordings/%s"
}
```

---

## Troubleshooting

### Widget Shows "Connecting to HubSpot..."

- **Cause**: Widget is running outside HubSpot iframe
- **Solution**:
  - For testing: The widget auto-detects and shows Login screen
  - For HubSpot: Deploy and load inside HubSpot CRM

### "Failed to initialize WebRTC"

- **Cause**: Twilio token endpoint not working
- **Solution**:
  1. Check backend is running
  2. Verify `REACT_APP_API_URL` is correct
  3. Check browser console for errors

### Incoming Calls Not Working

1. Ensure user status is set to **"Available"**
2. Check WebSocket connection in console
3. Verify backend is receiving Twilio webhooks
4. Check Twilio webhook URL configuration

### Permission Request Fails

1. Check backend `/wacall/api/permissions/request` endpoint
2. Verify HubDB table is configured
3. Check Twilio WhatsApp template is approved

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          HubSpot CRM                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Widget (iframe)                       │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  React App + HubSpot Calling Extensions SDK     │    │   │
│  │  │                                                  │    │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │    │   │
│  │  │  │ WebRTC   │  │WebSocket │  │ API Svc  │      │    │   │
│  │  │  │ (Twilio) │  │(Socket.IO)│  │ (Axios)  │      │    │   │
│  │  │  └────┬─────┘  └────┬─────┘  └────┬─────┘      │    │   │
│  │  └───────┼─────────────┼─────────────┼─────────────┘    │   │
│  └──────────┼─────────────┼─────────────┼──────────────────┘   │
└─────────────┼─────────────┼─────────────┼───────────────────────┘
              │             │             │
              ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend Server                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Twilio Voice │  │ Socket.IO    │  │ REST API     │          │
│  │ Webhooks     │  │ Server       │  │ Endpoints    │          │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘          │
│         │                                    │                   │
│  ┌──────▼────────────────────────────────────▼───────┐          │
│  │              Services Layer                        │          │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │          │
│  │  │ Twilio   │  │ HubSpot  │  │Permission│        │          │
│  │  │ Service  │  │ Service  │  │ Service  │        │          │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘        │          │
│  └───────┼─────────────┼─────────────┼───────────────┘          │
└──────────┼─────────────┼─────────────┼───────────────────────────┘
           │             │             │
           ▼             ▼             ▼
     ┌──────────┐  ┌──────────┐  ┌──────────┐
     │ Twilio   │  │ HubSpot  │  │  HubDB   │
     │ WhatsApp │  │   CRM    │  │ (Perms)  │
     └──────────┘  └──────────┘  └──────────┘
```

---

## Quick Reference

### Widget URL Parameters

| Parameter | Description |
|-----------|-------------|
| `?standalone=true` | Force standalone mode |

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://api.example.com` |
| `REACT_APP_WEBSOCKET_URL` | WebSocket URL | `wss://api.example.com` |
| `REACT_APP_TWILIO_WHATSAPP_NUMBER` | WhatsApp sender | `+14155238886` |

### HubSpot Extension API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/crm/v3/extensions/calling/{appId}/settings` | PATCH | Update extension settings |
| `/crm/v3/extensions/calling/{appId}/settings/recording` | POST | Configure recording URL |
| `/crm/v3/extensions/calling/{appId}/settings/channel-connection` | POST | Configure phone numbers webhook |
