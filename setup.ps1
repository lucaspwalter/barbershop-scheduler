$ErrorActionPreference = "Stop"

function Write-Step {
    param ([string]$Message)
    Write-Host ""
    Write-Host "==> $Message"
}

function Fail {
    param ([string]$Message)
    Write-Host ""
    Write-Host "Erro: $Message" -ForegroundColor Red
    exit 1
}

function Ensure-EnvVar {
    param (
        [string]$Path,
        [string]$Key,
        [string]$Value
    )

    if (!(Test-Path $Path)) {
        New-Item -ItemType File -Path $Path | Out-Null
    }

    $content = Get-Content $Path -ErrorAction SilentlyContinue
    if ($content | Select-String -Pattern "^$Key=" -Quiet) {
        $content = $content | ForEach-Object {
            if ($_ -match "^$Key=") {
                "$Key=$Value"
            } else {
                $_
            }
        }
        Set-Content -Path $Path -Value $content
    } else {
        Add-Content -Path $Path -Value "$Key=$Value"
    }
}

function Stop-ApiProcess {
    if ($script:ApiProcess -and !$script:ApiProcess.HasExited) {
        Stop-Process -Id $script:ApiProcess.Id -Force -ErrorAction SilentlyContinue
    }
}

try {
    Write-Step "Verificando Node.js"
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Step "Instalando Node.js LTS"
        winget install OpenJS.NodeJS.LTS --silent
        Write-Host "Node.js instalado."
        Write-Host "Reinicie o terminal e rode este script novamente."
        exit 0
    }
    Write-Host "Node.js já instalado: $(node --version)"

    Write-Step "Verificando Docker Desktop"
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Step "Instalando Docker Desktop"
        winget install Docker.DockerDesktop --silent
        Write-Host "Docker Desktop instalado."
        Write-Host "Abra o Docker Desktop, aguarde iniciar e rode este script novamente."
        exit 0
    }
    Write-Host "Docker já instalado: $(docker --version)"

    Write-Step "Verificando se Docker está rodando"
    docker ps | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Fail "Docker não está rodando. Abra o Docker Desktop e aguarde iniciar."
    }

    Write-Step "Subindo banco de dados PostgreSQL"
    $containerExists = docker ps -a --format "{{.Names}}" | Select-String "barbershop-db"
    if ($containerExists) {
        Write-Host "Container barbershop-db já existe. Iniciando..."
        docker start barbershop-db | Out-Null
    } else {
        Write-Host "Criando container barbershop-db..."
        Write-Host "Baixando imagem postgres:16 se necessário (pode demorar alguns minutos)..."
        docker run --name barbershop-db `
            -e POSTGRES_USER=barbershop `
            -e POSTGRES_PASSWORD=barbershop `
            -e POSTGRES_DB=barbershop `
            -p 5433:5432 -d postgres:16
    }
    Start-Sleep -Seconds 3

    Write-Step "Configurando back-end"
    if (!(Test-Path .env)) {
        Copy-Item .env.example .env
    }
    Ensure-EnvVar -Path ".env" -Key "DATABASE_URL" -Value "postgresql://barbershop:barbershop@localhost:5433/barbershop"
    Ensure-EnvVar -Path ".env" -Key "SKIP_DATE_VALIDATION" -Value "true"

    Write-Host "Instalando dependências do back-end"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Fail "Falha ao instalar dependências do back-end."
    }

    Write-Host "Rodando migrations"
    npm run migrate
    if ($LASTEXITCODE -ne 0) {
        Fail "Falha ao rodar migrations."
    }

    Write-Step "Configurando front-end"
    Set-Location frontend
    if (!(Test-Path .env.local)) {
        Copy-Item .env.example .env.local
    }

    Write-Host "Instalando dependências do front-end"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Fail "Falha ao instalar dependências do front-end."
    }
    Set-Location ..

    Write-Step "Populando banco"
    Write-Host "Iniciando back-end temporariamente para executar o seed"
    $script:ApiProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -RedirectStandardOutput "$env:TEMP\barbershop-scheduler-api.log" -RedirectStandardError "$env:TEMP\barbershop-scheduler-api-error.log" -PassThru -WindowStyle Hidden

    Write-Host "Aguardando API responder em http://localhost:3333"
    $apiReady = $false
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        try {
            Invoke-WebRequest -Uri "http://localhost:3333/" -UseBasicParsing | Out-Null
            $apiReady = $true
            break
        } catch {
            Start-Sleep -Seconds 1
        }
    }

    if (!$apiReady) {
        Stop-ApiProcess
        Fail "API não respondeu em http://localhost:3333. Confira os logs em $env:TEMP\barbershop-scheduler-api.log"
    }

    npx tsx seed.ts
    if ($LASTEXITCODE -ne 0) {
        Stop-ApiProcess
        Fail "Falha ao popular o banco."
    }
    Stop-ApiProcess

    Write-Host ""
    Write-Host "Setup concluído."
    Write-Host ""
    Write-Host "Para iniciar o projeto:"
    Write-Host "  Terminal 1: npm run dev"
    Write-Host "  Terminal 2: cd frontend; npm run dev"
    Write-Host ""
    Write-Host "Acesse: http://localhost:3000"
    Write-Host "Filtro de data: 2026-05-01 até 2026-06-30"
} catch {
    Stop-ApiProcess
    Fail $_.Exception.Message
}
