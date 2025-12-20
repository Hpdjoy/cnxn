# Frontend Configuration for Production

## Update WebSocket URL in app.js

When deploying to production, you need to update the WebSocket connection URL in `app.js`.

### Current Development Configuration (Line 12)
```javascript
const socket = new WebSocket("ws://localhost:3000");
```

### Production Configuration Options

#### Option 1: Direct EC2 Public IP
```javascript
const socket = new WebSocket("ws://your-ec2-public-ip:3000");
```

#### Option 2: Domain with SSL (Recommended)
```javascript
const socket = new WebSocket("wss://your-domain.com");
```

#### Option 3: Dynamic Configuration (Best Practice)
Create a configuration based on environment:

```javascript
// At the top of app.js, add:
const WS_URL = window.location.hostname === 'localhost' 
  ? 'ws://localhost:3000'
  : 'wss://your-production-domain.com';

const socket = new WebSocket(WS_URL);
```

#### Option 4: Environment-based with Build Tool
If using a build tool, create a config file:

**config.js:**
```javascript
const config = {
  development: {
    wsUrl: 'ws://localhost:3000'
  },
  production: {
    wsUrl: 'wss://your-production-domain.com'
  }
};

const ENV = window.location.hostname === 'localhost' ? 'development' : 'production';
export default config[ENV];
```

**app.js:**
```javascript
import config from './config.js';
const socket = new WebSocket(config.wsUrl);
```

## CORS Configuration Checklist

### Server Side (Already Fixed ✓)
- ✅ HTTP server with CORS headers
- ✅ WebSocket origin verification
- ✅ Environment variable support for allowed origins
- ✅ Health check endpoint

### Deployment Steps

1. **Set Environment Variables on AWS:**
   ```bash
   # On EC2 with PM2
   pm2 start server.js --name "websocket-server" --env production -- PORT=3000 ALLOWED_ORIGINS=https://your-frontend-domain.com
   
   # Or export before starting
   export PORT=3000
   export ALLOWED_ORIGINS=https://your-frontend-domain.com
   pm2 start server.js
   ```

2. **Update Frontend WebSocket URL:**
   - Replace `ws://localhost:3000` with your production URL
   - Use `wss://` (secure) instead of `ws://` for production
   - Match the protocol (https frontend → wss backend)

3. **Frontend Deployment (if using S3/CloudFront):**
   - Deploy your `index.html`, `app.js`, `style.css` to S3
   - Configure CloudFront distribution
   - Update `ALLOWED_ORIGINS` to include CloudFront URL

4. **Test CORS:**
   ```javascript
   // In browser console on your frontend
   fetch('http://your-server-url/health')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error);
   ```

## Common CORS Issues and Solutions

### Issue 1: "No 'Access-Control-Allow-Origin' header"
**Solution:** Ensure `ALLOWED_ORIGINS` includes your frontend domain.

```bash
# On server
export ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Issue 2: WebSocket connection fails with "Origin not allowed"
**Solution:** WebSocket origin verification needs your frontend domain.

```bash
# Multiple domains
export ALLOWED_ORIGINS=https://domain1.com,https://domain2.com
```

### Issue 3: Mixed content error (http/https)
**Solution:** Match protocols:
- HTTPS frontend → WSS (secure WebSocket)
- HTTP frontend → WS (regular WebSocket)

### Issue 4: Preflight OPTIONS request fails
**Solution:** Already fixed in server.js with OPTIONS handler.

## Production Deployment Checklist

- [ ] Install dependencies: `npm install`
- [ ] Set `PORT` environment variable
- [ ] Set `ALLOWED_ORIGINS` with your frontend URL(s)
- [ ] Update `app.js` with production WebSocket URL
- [ ] Configure SSL/TLS (use Nginx reverse proxy)
- [ ] Test health endpoint: `curl http://your-server/health`
- [ ] Test WebSocket connection from frontend
- [ ] Monitor server logs for CORS errors
- [ ] Set up PM2 or similar for process management
- [ ] Configure auto-start on server reboot
- [ ] Set up CloudWatch or monitoring

## SSL/TLS Setup (For wss://)

### Using Nginx as Reverse Proxy
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Using AWS Application Load Balancer
- Create target group pointing to your EC2 instance(s)
- Configure health check: `/health`
- Add HTTPS listener with SSL certificate
- Enable sticky sessions for WebSocket connections

## Testing Your Setup

### 1. Server Health Check
```bash
curl http://your-server-ip:3000/health
# Should return: {"status":"healthy","clients":0,"timestamp":"..."}
```

### 2. WebSocket Connection Test
```javascript
// In browser console
const ws = new WebSocket('ws://your-server-ip:3000');
ws.onopen = () => console.log('✅ Connected!');
ws.onerror = (e) => console.error('❌ Error:', e);
ws.onclose = () => console.log('⚠️ Closed');
```

### 3. CORS Test
```javascript
// In browser console (from your frontend domain)
fetch('http://your-server-ip:3000/health')
  .then(r => r.json())
  .then(data => console.log('✅ CORS working:', data))
  .catch(err => console.error('❌ CORS failed:', err));
```

## Quick Setup Commands

```bash
# 1. Install dependencies
npm install

# 2. Create .env file from example
cp .env.example .env

# 3. Edit .env with your settings
# Set ALLOWED_ORIGINS to your frontend URL

# 4. Test locally
npm start

# 5. Deploy to AWS (see AWS_DEPLOYMENT.md)
```
