@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0"
set "WEB_DIR=%ROOT%apps\web"

set "NODE_VERSION=20.19.0"
set "NODE_DIST=node-v%NODE_VERSION%-win-x64"
set "NODE_ARCHIVE=%NODE_DIST%.zip"
set "NODE_BASE_DIR=%ROOT%tools\node"
set "NODE_CACHE_DIR=%NODE_BASE_DIR%\cache"
set "NODE_HOME=%NODE_BASE_DIR%\%NODE_DIST%"
set "NODE_EXE=%NODE_HOME%\node.exe"
set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/%NODE_ARCHIVE%"
set "NODE_ZIP=%NODE_CACHE_DIR%\%NODE_ARCHIVE%"

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
    echo [前端] 未检测到全局 Node.js，准备使用项目内便携 Node v%NODE_VERSION% ...
    call :ensure_portable_node
    if errorlevel 1 (
        echo [前端] 错误: Node 自动安装失败，无法继续。
        pause
        exit /b 1
    )
) else (
    echo [前端] 检测到全局 Node.js，优先使用系统 Node。
)

if exist "%NODE_EXE%" (
    set "PATH=%NODE_HOME%;%PATH%"
)

where node >nul 2>&1
if errorlevel 1 (
    echo [前端] 错误: 未找到 node，请检查 PATH 或重试。
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [前端] 错误: 未找到 npm，请检查 Node 安装是否完整。
    pause
    exit /b 1
)

echo [前端] Node 版本:
node -v
if errorlevel 1 (
    echo [前端] 错误: node -v 执行失败
    pause
    exit /b 1
)

echo [前端] npm 版本:
npm -v
if errorlevel 1 (
    echo [前端] 错误: npm -v 执行失败
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
    echo [前端] 依赖安装完成
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
exit /b 0

:ensure_portable_node
if exist "%NODE_EXE%" (
    echo [前端] 已存在便携 Node：%NODE_HOME%
    exit /b 0
)

if not exist "%NODE_BASE_DIR%" mkdir "%NODE_BASE_DIR%"
if not exist "%NODE_CACHE_DIR%" mkdir "%NODE_CACHE_DIR%"

if not exist "%NODE_ZIP%" (
    echo [前端] 正在下载 Node: %NODE_URL%
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_ZIP%' -UseBasicParsing; exit 0 } catch { Write-Host $_.Exception.Message; exit 1 }"
    if errorlevel 1 (
        echo [前端] 错误: Node 下载失败。
        echo [前端] 你可以手动下载 %NODE_ARCHIVE%，放到：
        echo [前端] %NODE_CACHE_DIR%
        echo [前端] 然后重新运行 start.bat。
        exit /b 1
    )
) else (
    echo [前端] 使用已缓存安装包：%NODE_ZIP%
)

echo [前端] 正在解压 Node 安装包 ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%NODE_BASE_DIR%' -Force; exit 0 } catch { Write-Host $_.Exception.Message; exit 1 }"
if errorlevel 1 (
    echo [前端] 错误: Node 解压失败。
    exit /b 1
)

if not exist "%NODE_EXE%" (
    echo [前端] 错误: 解压后未找到 node.exe: %NODE_EXE%
    exit /b 1
)

echo [前端] Node 安装完成：%NODE_HOME%
exit /b 0

