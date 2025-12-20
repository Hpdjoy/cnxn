# AWS Deployment Guide

## Overview
This guide will help you deploy your P2P WebSocket signaling server to AWS.

## Prerequisites
- AWS Account
- AWS CLI installed and configured
- Node.js and npm installed locally

## Deployment Options

### Option 1: AWS EC2 (Recommended for WebSocket)

#### 1. Launch EC2 Instance
```bash
# Choose Amazon Linux 2 or Ubuntu
# Instance type: t2.micro (free tier eligible)
# Configure security group (see below)
```

#### 2. Security Group Configuration
Add the following inbound rules:
- **SSH**: Port 22 (for your IP only)
- **HTTP**: Port 80 (for health checks)
- **WebSocket**: Port 3000 (or your chosen port) - Source: 0.0.0.0/0
- **HTTPS**: Port 443 (if using SSL)

#### 3. Connect and Setup
```bash
# SSH into your instance
ssh -i your-key.pem ec2-user@your-ec2-public-ip

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone or upload your code
# Navigate to your project directory
cd /path/to/p2p-button-app

# Install dependencies
npm install

# Set environment variables
export PORT=3000
export ALLOWED_ORIGINS=https://your-frontend-domain.com

# Start the server with PM2
pm2 start server.js --name "websocket-server"
pm2 save
pm2 startup
```

#### 4. Configure Auto-start on Boot
```bash
pm2 startup systemd
# Copy and run the command it outputs
pm2 save
```

### Option 2: AWS Elastic Beanstalk

#### 1. Create Elastic Beanstalk Application
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js your-app-name --region us-east-1

# Create environment
eb create production-env
```

#### 2. Configure Environment Variables
In the AWS Console or via CLI:
```bash
eb setenv PORT=8080 ALLOWED_ORIGINS=https://your-frontend-domain.com
```

#### 3. Deploy
```bash
eb deploy
```

### Option 3: AWS App Runner

#### 1. Create apprunner.yaml
```yaml
version: 1.0
runtime: nodejs18
build:
  commands:
    build:
      - npm install
run:
  command: node server.js
  network:
    port: 3000
```

#### 2. Deploy via AWS Console
- Go to AWS App Runner
- Create service from source code
- Configure environment variables
- Deploy

## Environment Variables for Production

Create a `.env` file (never commit this!):
```bash
PORT=3000
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

Or set them in your AWS service configuration.

## Update Frontend Configuration

Update `app.js` line 12 to use your AWS server URL:

**Development:**
```javascript
const socket = new WebSocket("ws://localhost:3000");
```

**Production:**
```javascript
const socket = new WebSocket("ws://your-ec2-public-ip:3000");
// OR with domain and SSL:
const socket = new WebSocket("wss://your-domain.com");
```

## SSL/TLS Configuration (Recommended)

For production with `wss://` (secure WebSocket):

### Using Nginx as Reverse Proxy
```bash
# Install Nginx
sudo yum install nginx -y

# Install Certbot for Let's Encrypt
sudo yum install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

Nginx configuration (`/etc/nginx/conf.d/websocket.conf`):
```nginx
upstream websocket {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://websocket/health;
        proxy_set_header Host $host;
    }
}
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

## Testing Your Deployment

### 1. Test Health Endpoint
```bash
curl http://your-server-url/health
# Should return: {"status":"healthy","clients":0,"timestamp":"..."}
```

### 2. Test WebSocket Connection
Open your browser console on the frontend:
```javascript
const ws = new WebSocket("ws://your-server-url:3000");
ws.onopen = () => console.log("Connected!");
ws.onerror = (error) => console.error("Error:", error);
```

## Monitoring

### CloudWatch Logs (for Elastic Beanstalk/App Runner)
- Automatically configured
- View logs in AWS Console

### PM2 Monitoring (for EC2)
```bash
pm2 monit
pm2 logs
```

## Troubleshooting

### CORS Errors
- Verify `ALLOWED_ORIGINS` includes your frontend URL
- Check browser console for exact error
- Ensure protocol matches (http/https)

### WebSocket Connection Failed
- Check security group allows inbound traffic on your port
- Verify server is running: `pm2 status` or `eb status`
- Check firewall rules
- Test health endpoint first

### High Latency
- Consider using multiple regions with route-based routing
- Use CloudFront for frontend
- Enable keepalive on WebSocket connections

## Scaling Considerations

For high traffic, consider:
1. **Load Balancer**: AWS Application Load Balancer supports WebSocket
2. **Redis**: For cross-server message broadcasting
3. **Auto Scaling**: Configure based on connection count
4. **Multiple Regions**: Deploy in regions closer to users

## Cost Optimization

- Start with t2.micro (free tier)
- Use reserved instances for production
- Monitor CloudWatch metrics
- Set up billing alerts

## Security Best Practices

1. **Always use HTTPS/WSS in production**
2. **Restrict ALLOWED_ORIGINS** to your actual domains
3. **Use AWS IAM roles** for service permissions
4. **Enable AWS WAF** for DDoS protection
5. **Regular security updates**: `sudo yum update -y`
6. **Use AWS Secrets Manager** for sensitive data

## Next Steps

1. Choose your deployment option
2. Configure environment variables
3. Update frontend WebSocket URL
4. Test thoroughly
5. Set up monitoring and alerts
6. Configure SSL/TLS
7. Document your production URLs
