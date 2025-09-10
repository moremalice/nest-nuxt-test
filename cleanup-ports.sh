#!/bin/bash

# Port Cleanup Script for Nest.js + Nuxt.js Development
echo "🧹 Cleaning development ports 3000, 3001, 3020..."

TARGET_PORTS=(3000 3001 3020)
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

# Function to check if port is in use (cross-platform)
check_port_usage() {
    local port=$1
    local result
    
    # Try different methods based on available tools
    if command -v netstat >/dev/null 2>&1; then
        result=$(netstat -ano 2>/dev/null | grep ":${port} " | grep "LISTENING")
    elif command -v lsof >/dev/null 2>&1; then
        result=$(lsof -i :${port} 2>/dev/null)
    elif command -v ss >/dev/null 2>&1; then
        result=$(ss -tlnp 2>/dev/null | grep ":${port} ")
    else
        echo -e "${YELLOW}⚠️  Warning: No suitable port checking tool found${NC}"
        return 1
    fi
    
    if [ ! -z "$result" ]; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to get PID using port
get_pid_by_port() {
    local port=$1
    local pid
    
    if command -v netstat >/dev/null 2>&1; then
        # Windows/Linux netstat approach
        pid=$(netstat -ano 2>/dev/null | grep ":${port} " | grep "LISTENING" | awk '{print $NF}' | head -1)
    elif command -v lsof >/dev/null 2>&1; then
        # macOS/Linux lsof approach
        pid=$(lsof -ti :${port} 2>/dev/null | head -1)
    elif command -v ss >/dev/null 2>&1; then
        # Linux ss approach
        pid=$(ss -tlnp 2>/dev/null | grep ":${port} " | sed 's/.*pid=\([0-9]*\).*/\1/' | head -1)
    fi
    
    echo "$pid"
}

# Check current port usage
PORTS_IN_USE=()
for port in "${TARGET_PORTS[@]}"; do
    if check_port_usage $port; then
        PORTS_IN_USE+=($port)
        echo -e "${RED}⚠️  Port $port is in use${NC}"
    else
        echo -e "${GREEN}✅ Port $port is free${NC}"
    fi
done

if [ ${#PORTS_IN_USE[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 All ports are free!${NC}"
    exit 0
fi

# Kill Node.js processes and clean up
echo -e "${CYAN}🔧 Terminating processes...${NC}"
if command -v pgrep >/dev/null 2>&1; then
    pgrep -f node | xargs -r kill -KILL 2>/dev/null
elif command -v ps >/dev/null 2>&1; then
    ps aux | grep -v grep | grep node | awk '{print $2}' | xargs -r kill -KILL 2>/dev/null
fi

# Windows network reset if available
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    powershell.exe -Command "netsh int ip reset" >/dev/null 2>&1
fi

# Final check
sleep 1
ALL_CLEAN=true
for port in "${TARGET_PORTS[@]}"; do
    if check_port_usage $port; then
        echo -e "${RED}❌ Port $port still in use${NC}"
        ALL_CLEAN=false
    fi
done

if [ "$ALL_CLEAN" = true ]; then
    echo -e "${GREEN}🎉 All ports are now free! Ready to start servers.${NC}"
else
    echo -e "${YELLOW}⚠️  Some ports may still be occupied. Try restarting.${NC}"
fi