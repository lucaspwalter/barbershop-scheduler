# barbershop-scheduler

## Como rodar localmente

### Pré-requisitos
- Ubuntu ou Debian
- Conexão com a internet

### Instalação

Clone o repositório e execute o script de setup:

```bash
git clone https://github.com/lucaspwalter/barbershop-scheduler
cd barbershop-scheduler
chmod +x setup.sh
./setup.sh
```

O script instala Node.js, Docker, configura o banco,
roda as migrations e popula com dados de exemplo.

### Iniciando os servidores

Após o setup, abra dois terminais:

Terminal 1 (back-end):
```bash
npm run dev
```

Terminal 2 (front-end):
```bash
cd frontend && npm run dev
```

Acesse http://localhost:3000
No filtro de data: 2026-05-01 até 2026-06-30
