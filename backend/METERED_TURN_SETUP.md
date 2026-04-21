# Metered TURN Server Setup Guide

## What is Metered?

Metered (https://www.metered.ca/) provides free and paid TURN servers for WebRTC applications. TURN servers help establish peer-to-peer connections when direct connections fail due to firewalls or NAT.

## Why Use Metered?

- **Free Tier**: 50GB data transfer per month
- **Global Infrastructure**: Multiple relay servers worldwide
- **Easy Setup**: Simple API key-based authentication
- **Reliable**: 99.9% uptime SLA
- **Multiple Protocols**: Supports UDP, TCP, and TLS

## Setup Instructions

### 1. Create a Metered Account

1. Go to https://www.metered.ca/
2. Click "Sign Up" or "Get Started"
3. Create your account (free tier available)

### 2. Create a New App

1. Log in to your Metered dashboard
2. Click "Create New App" or "Add Application"
3. Give your app a name (e.g., "FreelanceHub Video Calls")
4. Copy your API key (it will look like: `abc123def456...`)

### 3. Configure Your Backend

Open your `backend/.env` file and add:

```env
# Metered TURN Server Configuration
TURN_SERVER_URL=turn:a.relay.metered.ca:80
TURN_SERVER_USERNAME=your-metered-api-key-here
TURN_SERVER_CREDENTIAL=your-metered-api-key-here
```

**Important**: Both `TURN_SERVER_USERNAME` and `TURN_SERVER_CREDENTIAL` should be set to your Metered API key.

### 4. Example Configuration

```env
# Example with a real API key format
TURN_SERVER_URL=turn:a.relay.metered.ca:80
TURN_SERVER_USERNAME=abc123def456ghi789jkl012mno345pqr678
TURN_SERVER_CREDENTIAL=abc123def456ghi789jkl012mno345pqr678
```

### 5. Restart Your Backend

After updating the `.env` file:

```bash
cd backend
npm start
```

## Available Metered TURN Servers

The system automatically configures multiple Metered TURN servers for redundancy:

- `turn:a.relay.metered.ca:80` (UDP)
- `turn:a.relay.metered.ca:80?transport=tcp` (TCP)
- `turn:a.relay.metered.ca:443` (UDP on port 443)
- `turn:a.relay.metered.ca:443?transport=tcp` (TCP on port 443)
- `turns:a.relay.metered.ca:443` (TLS)
- `turns:a.relay.metered.ca:443?transport=tcp` (TLS over TCP)

## Testing Your Configuration

1. Start your backend server
2. Join a video meeting
3. Check the browser console for ICE server configuration
4. The system will automatically use TURN servers when direct connections fail

## Monitoring Usage

1. Log in to your Metered dashboard
2. View your data transfer usage
3. Monitor active connections
4. Check connection quality metrics

## Free Tier Limits

- **Data Transfer**: 50GB/month
- **Concurrent Connections**: Unlimited
- **Bandwidth**: Unlimited
- **Support**: Community support

## Upgrading

If you exceed the free tier limits, Metered offers paid plans:

- **Starter**: $29/month (500GB)
- **Growth**: $99/month (2TB)
- **Business**: Custom pricing

## Troubleshooting

### TURN Server Not Working

1. **Check API Key**: Ensure your API key is correct
2. **Check Logs**: Look for "TURN server configured" in backend logs
3. **Test Connection**: Use https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/ to test TURN connectivity

### High Data Usage

- Each video call consumes bandwidth
- 1-hour HD video call ≈ 1-2GB data transfer
- Monitor usage in Metered dashboard
- Consider upgrading if you exceed free tier

### Connection Issues

1. Ensure firewall allows outbound connections to Metered servers
2. Check that ports 80, 443, and 3478 are not blocked
3. Try different TURN server URLs (TCP vs UDP)

## Alternative TURN Providers

If Metered doesn't meet your needs, consider:

- **Twilio TURN**: https://www.twilio.com/stun-turn
- **Xirsys**: https://xirsys.com/
- **coturn**: Self-hosted open-source solution

## Support

- **Metered Documentation**: https://www.metered.ca/docs
- **Metered Support**: support@metered.ca
- **WebRTC Resources**: https://webrtc.org/

## Security Notes

- Keep your API key secret
- Don't commit `.env` file to version control
- Rotate API keys periodically
- Monitor usage for unusual activity
