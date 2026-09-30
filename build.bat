@echo off
setlocal
echo ===================================================
echo   Mavis Panel - Standalone Bundle Compiler
echo ===================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

node "%~dp0scripts\bundle.js"
if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] index.js bundle generated successfully!
    echo Upload index.js + package.json to your server or container.
) else (
    echo.
    echo [ERROR] Compilation failed.
)

endlocal
