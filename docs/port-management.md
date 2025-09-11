# Port Management Guide

This guide provides commands for managing development ports 3000, 3001, and 3020 during Nest.js + Nuxt.js development.

## Quick Port Cleanup

### For Claude Code Users (Recommended)

If you're using Claude Code and have background servers running:

```bash
# Check active background processes
/bashes

# Kill specific background server by ID
# Example: KillBash tool with ID from /bashes output
```

**Note**: Use the KillBash tool in Claude Code for instant termination of background processes.

### Windows (PowerShell)
Copy and paste the following command in PowerShell:

```powershell
# One-liner port cleanup for Windows
Write-Host "🧹 Cleaning ports 3000, 3001, 3020..." -ForegroundColor Cyan; $ports = @(3000, 3001, 3020); foreach($p in $ports) { $inUse = Test-NetConnection -ComputerName localhost -Port $p -InformationLevel Quiet -ErrorAction SilentlyContinue; if($inUse) { Write-Host "⚠️  Port $p in use" -ForegroundColor Red } else { Write-Host "✅ Port $p free" -ForegroundColor Green } }; if($ports | Where-Object { Test-NetConnection -ComputerName localhost -Port $_ -InformationLevel Quiet -ErrorAction SilentlyContinue }) { Write-Host "🔧 Terminating Node.js processes..." -ForegroundColor Yellow; Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue; netsh int ip reset | Out-Null; Start-Sleep 1; Write-Host "✅ Cleanup complete!" -ForegroundColor Green } else { Write-Host "🎉 All ports already free!" -ForegroundColor Green }
```

### Windows (Git Bash)
For Windows users using Git Bash environment:

```bash
# Git Bash compatible port cleanup for Windows
echo "🧹 Cleaning ports 3000, 3001, 3020..."
for port in 3000 3001 3020; do
  if netstat -an 2>/dev/null | grep -q ":$port "; then
    echo "⚠️  Port $port in use"
    # Use taskkill through Git Bash
    taskkill //F //IM node.exe 2>/dev/null || echo "No node processes found"
  else
    echo "✅ Port $port free"
  fi
done
echo "✅ Cleanup complete!"
```

### Linux/macOS (Bash)
Copy and paste the following commands in terminal:

```bash
# Port cleanup for Linux/macOS
echo "🧹 Cleaning ports 3000, 3001, 3020..."
for port in 3000 3001 3020; do
  if lsof -i :$port >/dev/null 2>&1 || netstat -an 2>/dev/null | grep -q ":$port "; then
    echo "⚠️  Port $port in use"
    lsof -ti :$port 2>/dev/null | xargs -r kill -9
  else
    echo "✅ Port $port free"
  fi
done
echo "✅ Cleanup complete!"
```

## Step-by-Step Manual Cleanup

### 1. Check Port Status

**Windows:**
```powershell
# Check specific ports
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3020"
netstat -ano | findstr ":3001"
```

**Linux/macOS:**
```bash
# Check specific ports
lsof -i :3000
lsof -i :3020  
lsof -i :3001
```

### 2. Terminate Specific Processes

**Windows (PowerShell):**
```powershell
# Find PID from netstat output, then kill it
taskkill /PID <PID_NUMBER> /F

# Or kill all Node.js processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Windows (Git Bash):**
```bash
# Kill processes by port (Git Bash compatible)
netstat -ano | grep ":3000" | awk '{print $5}' | xargs -I {} taskkill //PID {} //F
netstat -ano | grep ":3020" | awk '{print $5}' | xargs -I {} taskkill //PID {} //F
netstat -ano | grep ":3001" | awk '{print $5}' | xargs -I {} taskkill //PID {} //F

# Or kill all Node.js processes
taskkill //F //IM node.exe
```

**Linux/macOS:**
```bash
# Kill process by port
kill -9 $(lsof -ti :3000)
kill -9 $(lsof -ti :3020)
kill -9 $(lsof -ti :3001)

# Or kill all Node.js processes
pkill -f node
```

### 3. Network Reset (Windows Only)

```powershell
# Reset network stack to clear TIME_WAIT connections
netsh int ip reset
```

### 4. Verify Ports are Free

**Windows:**
```powershell
# Should return False for all
Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet
Test-NetConnection -ComputerName localhost -Port 3020 -InformationLevel Quiet
Test-NetConnection -ComputerName localhost -Port 3001 -InformationLevel Quiet
```

**Linux/macOS:**
```bash
# Should return no output
lsof -i :3000 :3020 :3001
```

## Development Workflow

### Starting Development Servers
```bash
# Terminal 1: Backend (Port 3020)
cd backend && npm run local

# Terminal 2: Frontend (Port 3000)
cd frontend && npm run local
```

### Stopping Servers Gracefully
1. Press `Ctrl+C` in each terminal
2. Wait for "Server closed" messages
3. If servers don't respond, use cleanup commands above

## Troubleshooting

### Common Issues

**"EADDRINUSE" Error:**
- Run the appropriate cleanup command above
- Verify ports are free before restarting servers

**Ports Show Free but Services Won't Start:**
- On Windows: Run network reset command
- Wait 30 seconds and try again
- Restart computer if issues persist

**Background Node.js Processes:**
- **Claude Code Users**: Use `/bashes` command to list and KillBash tool to terminate
- Use the "kill all Node.js processes" commands above
- Check task manager (Windows) or activity monitor (macOS) for hidden processes

**'nul' File Creation (Windows Git Bash):**
If you find a file named `nul` in your project directory:
```bash
# Remove the file
rm -f nul

# Or if in specific directories
rm -f frontend/nul
```

**Why this happens:**
- Windows reserves `nul` as a device name (equivalent to `/dev/null` on Unix)
- When Git Bash processes certain Windows commands, output redirection can create actual files
- This commonly occurs during port checking or process monitoring commands

**Prevention:**
- ✅ Use PowerShell for Windows-specific commands like `netstat`, `tasklist`
- ✅ Use the provided cleanup scripts above which are designed for each platform
- ✅ The `nul` file is now included in `.gitignore` to prevent accidental commits
- ❌ Avoid mixing Windows CMD syntax in Git Bash environment

### Emergency Reset

**Windows:**
```powershell
# Nuclear option: Kill everything and reset
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
netsh int ip reset
netsh winsock reset
# Restart computer recommended after this
```

**Linux/macOS:**
```bash
# Nuclear option: Kill everything
sudo pkill -f node
sudo lsof -ti :3000,:3001,:3020 | xargs -r kill -9
```

## Quick Reference by Environment

### Claude Code Users
```bash
# List background processes
/bashes

# Kill specific process (replace ID with actual ID from /bashes)
# Use KillBash tool in Claude Code interface
```

### Git Bash (Windows)
```bash
# Quick kill all Node.js processes
taskkill //F //IM node.exe

# Check ports
netstat -ano | grep -E ":(3000|3001|3020)"
```

### PowerShell (Windows)
```powershell
# Quick kill all Node.js processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Check ports
Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet
```

### Unix/Linux/macOS
```bash
# Quick kill all Node.js processes
pkill -f node

# Check ports
lsof -i :3000 :3001 :3020
```

## Port Configuration Reference

- **Backend (NestJS)**: Port 3020
- **Frontend (Nuxt.js)**: Port 3000
- **Reserved**: Port 3001 (avoid conflicts)

These ports are configured in:
- `backend/.env.local` (PORT=3020)
- `frontend/nuxt.config.ts` (default dev port 3000)