@echo off
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "API_DIR=%ROOT%services\api"
set "PROCESSED=%ROOT%data\processed"

cd /d "%API_DIR%"
if errorlevel 1 (
    echo [后端] 错误: 无法进入目录 services\api
    pause
    exit /b 1
)

echo ========================================
echo   地球气象可视化 - 后端 API
echo   http://localhost:8000
echo ========================================
echo.

if not exist ".venv\Scripts\python.exe" (
    echo [后端] 未找到虚拟环境，正在创建 .venv ...
    where python >nul 2>&1
    if errorlevel 1 (
        echo [后端] 错误: 未找到 python，请先安装 Python 3.10 或更高版本
        pause
        exit /b 1
    )
    python -m venv .venv
    if errorlevel 1 (
        echo [后端] 错误: 创建虚拟环境失败
        pause
        exit /b 1
    )
    echo [后端] 虚拟环境创建完成
) else (
    echo [后端] 虚拟环境已存在
)

call ".venv\Scripts\activate.bat"

if not exist ".venv\Lib\site-packages\fastapi" (
    echo [后端] 正在安装 Python 依赖，首次运行可能较慢 ...
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [后端] 错误: pip install 失败
        pause
        exit /b 1
    )
    echo [后端] 依赮安装完成
) else (
    echo [后端] 依赖已就绪，跳过 pip install
)

set "HAS_DATA=0"
if exist "%PROCESSED%" (
    for /d %%D in ("%PROCESSED%\*") do set "HAS_DATA=1"
)
if "!HAS_DATA!"=="0" (
    echo [后端] 未找到预处理数据，正在生成演示资产 ...
    python -m app.ingest.demo
    if errorlevel 1 (
        echo [后端] 警告: 演示数据生成失败，服务启动时将再次尝试
    )
) else (
    echo [后端] 预处理数据已存在，跳过演示数据生成
)

echo.
echo [后端] 正在启动 FastAPI (uvicorn) ...
echo [后端] 文档: http://localhost:8000/docs
echo.

python run.py

echo.
echo [后端] 服务已退出
pause
