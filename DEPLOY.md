# Deploy Separado - Coolify

## Estrutura

- **Backend**: `/backend` - API Node.js + Express
- **Frontend**: `/frontend` - React + Vite
- **MongoDB**: Instância externa no Coolify

## Desenvolvimento Local

```bash
# 1. Subir MongoDB
docker-compose -f docker-compose.dev.yml up -d

# 2. Backend
cd backend
cp .env.dev .env
npm install
npm start

# 3. Frontend
cd frontend
cp .env.dev .env
npm install
npm run dev
```

## Deploy Produção

### Ordem de Deploy
1. **MongoDB** (primeiro)
2. **Backend** (segundo) 
3. **Frontend** (terceiro)

### Variáveis de Ambiente

#### Backend
```env
MONGO_URI=mongodb://admin:senha@mongo.host.coolify.com:27017/radegondes?authSource=admin
JWT_SECRET=sua_chave_jwt_muito_segura_aqui_com_pelo_menos_32_caracteres
NODE_ENV=production
```

#### Frontend
```env
VITE_API_BASE_URL=https://backend.host.coolify.com
```

### Configuração Coolify

1. Crie 2 serviços separados apontando para o mesmo repositório
2. Backend: build directory = `backend`
3. Frontend: build directory = `frontend`
4. Configure URLs das variáveis após deploy do MongoDB e Backend