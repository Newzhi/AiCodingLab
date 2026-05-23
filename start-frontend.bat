@echo off
setlocal

set "ROOT=%~dp0"
set "WEB_DIR=%ROOT%apps\web"

cd /d "%WEB_DIR%"
if errorlevel 1 (
    echo [前端] 错误: 无法进入目录 apps\web
    pause
    exit /b 1
)

echo ========================================
echo   地球气象可视化 - 前端 (Vite)
echo   http://localhost:5173
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [前端] 错误: 未找到 node，请先安装 Node.js 18+
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [前端] 错误: 未找到 npm
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [前端] 未找到 node_modules，正在 npm install，首次运行可能较慢 ...
    call npm install
    if errorlevel 1 (
        echo [前端] 错误: npm install 失败
        pause
        exit /b 1
    )
    echo [前端] 依赮安装完成
) else (
    echo [前端] node_modules 已存在，跳过 npm install
)

echo.
echo [前端] 正在启动开发服务器 ...
echo.

call npm run dev

echo.
echo [前端] 开发服务器已退出
pause
