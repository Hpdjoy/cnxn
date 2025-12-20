# Start script for Windows PowerShell

# Set environment variables
$env:PORT = "3000"
$env:ALLOWED_ORIGINS = "*"

# Start the server
node server.js
