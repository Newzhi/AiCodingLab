@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   地球气象可视化 - 停止服务
echo ========================================
echo.

set "KILLED=0"

call :kill_port 8000 "后端 API"
call :kill_port 5173 "前端 Vite"

if "!KILLED!"=="0" (
    echo [停止] 未发现占用端口 8000 或 5173 的监听进程
) else (
    echo [停止] 已尝试终止相关进程
)

echo.
pause
exit /b 0

:kill_port
set "PORT=%~1"
set "LABEL=%~2"
set "FOUND=0"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
    set "FOUND=1"
    set "KILLED=1"
    echo [停止] 终止 !LABEL! 进程 PID=%%a 端口 %PORT%
    taskkill /PID %%a /F >nul 2>&1
    if errorlevel 1 (
        echo [停止] 警告: 无法终止 PID %%a，可能需要管理员权限
    )
)

if "!FOUND!"=="0" (
    echo [停止] 端口 %PORT% - !LABEL! 无监听进程
)
exit /b 0
