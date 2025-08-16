#!/bin/bash
# Script to kill any process using port 5173

PORT=5173

# Find and kill any process using the port
PID=$(lsof -ti:$PORT)

if [ -n "$PID" ]; then
    echo "Found process $PID using port $PORT"
    kill $PID
    echo "Process killed successfully"
else
    echo "No process found using port $PORT"
fi