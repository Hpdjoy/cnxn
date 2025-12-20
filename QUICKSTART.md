# Quick Start Guide - CORS Fixed Server

## 🎯 What Was Fixed

Your WebSocket server now has:
- ✅ **CORS support** - Works with any frontend domain
- ✅ **AWS-ready** - Environment variables, health checks, proper binding
- ✅ **Production secure** - Origin verification, configurable security
- ✅ **Health monitoring** - `/health` endpoint for AWS load balancers

---

## 🚀 Local Development

### Option 1: Using PowerShell (Windows)
```powershell
.\start.ps1
```

### Option 2: Manual Start (Windows)
```powershell
$env:PORT = "3000"
$env:ALLOWED_ORIGINS = "*"
node server.js
```

### Option 3: Unix/Linux/Mac
```bash
chmod +x start.sh
./start.sh
```

### Option 4: Create .env file
```bash
# Create .env file (copy from .env.example)
PORT=3000
ALLOWED_ORIGINS=*
```
Then run: `npm start`

---

## 📦 AWS Deployment Quick Steps

### 1. Deploy to EC2

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Upload your code or clone repo
# cd to your project directory

# Install dependencies
npm install

# Install PM2
sudo npm install -g pm2

# Set environment variables and start
export PORT=3000
export ALLOWED_ORIGINS=https://your-frontend-domain.com
pm2 start server.js --name "websocket-server"
pm2 save
pm2 startup
```

### 2. Security Group (AWS EC2)
Add inbound rules:
- **Port 3000** - TCP - Source: 0.0.0.0/0 (WebSocket)
- **Port 80** - TCP - Source: 0.0.0.0/0 (HTTP)
- **Port 22** - TCP - Source: Your IP (SSH)

### 3. Update Frontend

In `app.js`, line 12:
```javascript
// Change from:
const socket = new WebSocket("ws://localhost:3000");

// To (replace with your EC2 public IP):
const socket = new WebSocket("ws://YOUR-EC2-PUBLIC-IP:3000");
```

---

## 🔧 Testing

### Test Health Endpoint
```bash
curl http://localhost:3000/health
# Expected: {"status":"healthy","clients":0,"timestamp":"..."}
```

### Test WebSocket (Browser Console)
```javascript
const ws = new WebSocket('ws://localhost:3000');
ws.onopen = () => console.log('✅ Connected!');
ws.onerror = (e) => console.error('❌ Error:', e);
```

---

## 🎛️ Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `PORT` | `3000` | `3000` or AWS port |
| `ALLOWED_ORIGINS` | `*` | `https://yourdomain.com` |

### Multiple Domains (Production)
```bash
export ALLOWED_ORIGINS=https://domain1.com,https://domain2.com,https://domain3.com
```

---

## 📚 Documentation Files

- **`CORS_FIX_SUMMARY.md`** - Complete overview of changes
- **`AWS_DEPLOYMENT.md`** - Detailed AWS deployment guide
- **`FRONTEND_CONFIG.md`** - Frontend configuration help
- **`.env.example`** - Environment variable template

---

## 🐛 Troubleshooting

### CORS Error in Browser
**Problem:** "No 'Access-Control-Allow-Origin' header"
**Solution:** Set `ALLOWED_ORIGINS` to include your frontend URL

### WebSocket Connection Fails
**Problem:** Can't connect to WebSocket
**Solution:** 
1. Check server is running: `curl http://localhost:3000/health`
2. Check AWS security group allows port 3000
3. Verify frontend URL matches ALLOWED_ORIGINS

### Server Won't Start
**Problem:** No output or errors
**Solution:**
1. Install dependencies: `npm install`
2. Check Node.js version: `node --version` (need 14+)
3. Run with verbose: `node server.js`

---

## 📝 Production Checklist

Before deploying to production:

- [ ] Install dependencies: `npm install`
- [ ] Set `ALLOWED_ORIGINS` to your frontend domain (not `*`)
- [ ] Update frontend WebSocket URL in `app.js`
- [ ] Open port in AWS security group
- [ ] Test health endpoint
- [ ] Test WebSocket connection
- [ ] Set up PM2 for auto-restart
- [ ] Configure SSL/TLS for wss:// (recommended)
- [ ] Set up monitoring

---

## 🔒 Security Notes

### Development (Local)
```bash
ALLOWED_ORIGINS=*  # Allow all origins
```

### Production (AWS)
```bash
ALLOWED_ORIGINS=https://yourdomain.com  # Specific domain only
```

**⚠️ NEVER use `*` in production!** Always specify your exact frontend domain.

---

## 💡 Additional Resources

### SSL/TLS Setup (for wss://)
See `AWS_DEPLOYMENT.md` section on Nginx reverse proxy

### Frontend Updates
See `FRONTEND_CONFIG.md` for detailed frontend configuration

### Health Monitoring
Health endpoint: `http://your-server/health`
```json
{
  "status": "healthy",
  "clients": 0,
  "timestamp": "2025-12-20T07:40:40.000Z"
}
```

---

## 🆘 Need Help?

1. Check `CORS_FIX_SUMMARY.md` for overview
2. Read `AWS_DEPLOYMENT.md` for AWS-specific issues
3. See `FRONTEND_CONFIG.md` for frontend problems
4. Test health endpoint: `curl http://your-server/health`

---

**Your server is now ready for AWS deployment! 🚀**
