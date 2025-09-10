# Port Cleanup Script for Nest.js + Nuxt.js Development
Write-Host "🧹 Cleaning development ports 3000, 3001, 3020..." -ForegroundColor Cyan

# Define target ports
$targetPorts = @(3000, 3001, 3020)

# Function to check if port is in use
function Test-PortInUse {
    param([int]$Port)
    
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -ErrorAction SilentlyContinue
        return $connection
    }
    catch {
        return $false
    }
}

# Function to find processes using specific port
function Get-ProcessUsingPort {
    param([int]$Port)
    
    $netstatOutput = netstat -ano | Select-String ":$Port "
    $processes = @()
    
    foreach ($line in $netstatOutput) {
        if ($line -match "LISTENING\s+(\d+)$") {
            $pid = $matches[1]
            try {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    $processes += @{
                        PID = $pid
                        Name = $process.ProcessName
                        Port = $Port
                    }
                }
            }
            catch {
                # Process might have been terminated already
            }
        }
    }
    
    return $processes
}

# Step 1: Check current port usage
$portsInUse = @()
foreach ($port in $targetPorts) {
    $inUse = Test-PortInUse -Port $port
    if ($inUse) {
        $portsInUse += $port
        Write-Host "⚠️  Port $port is in use" -ForegroundColor Red
    } else {
        Write-Host "✅ Port $port is free" -ForegroundColor Green
    }
}

if ($portsInUse.Count -eq 0) {
    Write-Host "🎉 All ports are free!" -ForegroundColor Green
    exit 0
}

# Step 2: Kill processes and clean up
Write-Host "🔧 Terminating processes..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
netsh int ip reset | Out-Null

# Step 3: Final check
Start-Sleep -Seconds 1
$allClean = $true
foreach ($port in $targetPorts) {
    $inUse = Test-PortInUse -Port $port
    if ($inUse) {
        Write-Host "❌ Port $port still in use" -ForegroundColor Red
        $allClean = $false
    }
}

if ($allClean) {
    Write-Host "🎉 All ports are now free! Ready to start servers." -ForegroundColor Green
} else {
    Write-Host "⚠️  Some ports may still be occupied. Try restarting." -ForegroundColor Yellow
}