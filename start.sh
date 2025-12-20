#!/bin/bash
# Start script for Unix/Linux/Mac

# Set environment variables
export PORT=3000
export ALLOWED_ORIGINS='*'

# Start the server
node server.js
