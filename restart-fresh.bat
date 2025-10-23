@echo off
echo ====================================
echo  Restarting Dev Server (Clean)
echo ====================================
echo.

echo [1/4] Killing Node processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo      ✓ Node processes killed
) else (
    echo      ℹ No Node processes running
)
echo.

echo [2/4] Clearing Next.js cache...
if exist .next (
    rmdir /s /q .next
    echo      ✓ .next directory cleared
) else (
    echo      ℹ No .next directory found
)
echo.

echo [3/4] Clearing node_modules cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo      ✓ node_modules cache cleared
) else (
    echo      ℹ No node_modules cache found
)
echo.

echo [4/4] Starting dev server...
echo      Please wait...
echo.
echo ====================================
echo  IMPORTANT: After server starts:
echo  1. Close ALL browser tabs
echo  2. Clear browser cache (Ctrl+Shift+R)
echo  3. Open fresh: http://localhost:3000
echo ====================================
echo.

npm run dev

