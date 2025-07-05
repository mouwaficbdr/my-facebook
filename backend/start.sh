#!/bin/bash

echo "Starting PHP server..."
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

echo "Starting PHP built-in server on port 80..."
php -S 0.0.0.0:80 -t . &
SERVER_PID=$!

echo "PHP server started with PID: $SERVER_PID"
echo "Waiting for server to be ready..."

sleep 2

echo "Testing server locally..."
curl -s http://localhost:80/index.php || echo "Local test failed"

echo "Server is running. Press Ctrl+C to stop."
wait $SERVER_PID 