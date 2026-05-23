@echo off
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "VITE_PORT=5173"
set "API_URL=http://localhost:8000/health"
set "FRONTEND_URL=http://localhost:%VITE_PORT%"

echo ========================================
echo   地球气象可视化 - 一键启动
echo ========================================
echo.
echo [启动] 项目根目录: %ROOT%
echo [启动] 将打开两个命令行窗口（后端 + 前端）
echo.

echo [启动] 正在启动后端 ...
start "Earth Weather API" cmd /k ""%ROOT%start-backend.bat""

echo [启动] 等待后端就绪 (%API_URL%) ...
set /a RETRIES=45

:wait_backend
curl -sf "%API_URL%" >nul 2>&1
if !errorlevel! equ 0 goto backend_ready

powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri '%API_URL%' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if !errorlevel! equ 0 goto backend_ready

timeout /t 2 /nobreak >nul
set /a RETRIES-=1
if !RETRIES! leq 0 goto backend_timeout
goto wait_backend

:backend_timeout
echo [启动] 警告: 后端在 90 秒内未响应，仍将启动前端（可能仍在安装依赖）
goto start_frontend

:backend_ready
echo [启动] 后端已就绪

:start_frontend
echo.
echo [启动] 正在启动前端 ...
start "Earth Weather Web" cmd /k ""%ROOT%start-frontend.bat""

echo [启动] 等待前端开发服务器 ...
set /a RETRIES=30

:wait_frontend
curl -sf "%FRONTEND_URL%" >nul 2>&1
if !errorlevel! equ 0 goto open_browser

powershell -NoProfile -Command "try { Invoke-WebRequest -Uri '%FRONTEND_URL%' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if !errorlevel! equ 0 goto open_browser

timeout /t 2 /nobreak >nul
set /a RETRIES-=1
if !RETRIES! leq 0 goto open_browser
goto wait_frontend

:open_browser
echo [启动] 正在打开浏览器: %FRONTEND_URL%
start "" "%FRONTEND_URL%"

echo.
echo ========================================
echo   启动完成
echo   后端: http://localhost:8000
echo   前端: %FRONTEND_URL%
echo   关闭服务: 双击 stop.bat 或关闭两个窗口
echo ========================================
echo.
pause
