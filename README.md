# TEC Ecosystem - Core Platform Foundation

**TEC Ecosystem** is a comprehensive 24-app digital platform providing integrated solutions for content creation, education, business, wellness, and technology services. This repository contains the core infrastructure that powers the entire ecosystem.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     TEC Frontend (Next.js)                   │
│                 [Web App + Mobile Support]                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Port 3000)                   │
│           [Rate Limiting, Logging, Proxy Routing]            │
└──────────┬───────────────┬───────────────┬──────────────────┘
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │   Auth   │   │  Wallet  │   │ Payment  │
    │ Service  │   │ Service  │   │ Service  │
    │ :5001    │   │ :5002    │   │ :5003    │
    └────┬─────┘   └────┬─────┘   └────┬─────┘
         │              │              │
         └──────────────┼──────────────┘
                        ▼
              ┌──────────────────┐
              │   PostgreSQL     │
              │   Database       │
              └──────────────────┘
```

## 🚀 Tech Stack

- **Runtime:** Node.js 20
- **Language:** TypeScript 5.x
- **Backend Framework:** Express.js
- **Database:** PostgreSQL 15
- **ORM:** Prisma 5.x
- **Authentication:** JWT + bcrypt
- **Containerization:** Docker & Docker Compose
- **API Gateway:** http-proxy-middleware
- **Frontend:** Next.js (in tec-frontend/)

## 📦 Services

### 1. API Gateway (Port 3000)
Central entry point for all client requests. Handles:
- Request routing to microservices
- Rate limiting (100 requests per 15 minutes)
- Request logging
- CORS and security headers
- Health monitoring

**Routes:**
- `GET /health` - Gateway health check
- `POST /api/auth/*` - Auth service routes
- `GET|POST /api/wallet/*` - Wallet service routes
- `POST /api/payment/*` - Payment service routes

### 2. Auth Service (Port 5001)
Manages user authentication and authorization. Features:
- User registration with email/username
- Login with JWT token generation
- Token refresh mechanism
- Session management
- KYC status tracking

**Endpoints:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user (requires auth)

### 3. Wallet Service (Port 5002)
Handles wallet management and transactions. Features:
- Multi-wallet support (Pi, Crypto, Fiat)
- Balance tracking
- Transaction history
- Wallet linking

**Endpoints:**
- `GET /wallet/wallets?user_id={id}` - Get user wallets
- `POST /wallet/wallets/link` - Link new wallet
- `GET /wallet/wallets/:id/balance` - Get wallet balance
- `GET /wallet/wallets/:id/transactions` - Get transaction history

### 4. Payment Service (Port 5003)
Manages payment processing. Features:
- Payment creation
- Payment approval workflow
- Payment completion
- Pi Network integration support
- Multiple payment methods (Pi, Card, Wallet)

**Endpoints:**
- `POST /payment/payments/create` - Create payment
- `POST /payment/payments/approve` - Approve payment
- `POST /payment/payments/complete` - Complete payment
- `GET /payment/payments/:id/status` - Get payment status

## 🗄️ Database Schema

The platform uses PostgreSQL with the following core models:

- **User** - User accounts with authentication
- **Session** - Active user sessions
- **Wallet** - User wallet information
- **Transaction** - Wallet transactions
- **Payment** - Payment records
- **Plan** - Subscription plans
- **Subscription** - User subscriptions
- **Device** - Registered devices

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- npm or yarn

### Quick Start with Docker

1. Clone the repository:
```bash
git clone https://github.com/Yasser1728/Tec-App.git
cd Tec-App
```

2. Create environment file:
```bash
cp .env.example .env
# Edit .env with your configurations
```

3. Start all services:
```bash
docker-compose up -d
```

4. Run database migrations:
```bash
docker-compose exec auth-service npx prisma migrate deploy
```

5. Verify services are running:
```bash
# API Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:5001/health

# Wallet Service
curl http://localhost:5002/health

# Payment Service
curl http://localhost:5003/health
```

### Local Development

1. Install dependencies for all services:
```bash
npm run install:all
```

2. Generate Prisma client:
```bash
npm run prisma:generate
```

3. Start PostgreSQL:
```bash
docker-compose up -d postgres
```

4. Run migrations:
```bash
npm run prisma:migrate
```

5. Start services in separate terminals:
```bash
# Terminal 1: API Gateway
npm run dev:gateway

# Terminal 2: Auth Service
npm run dev:auth

# Terminal 3: Wallet Service
npm run dev:wallet

# Terminal 4: Payment Service
npm run dev:payment
```

## 📝 Environment Variables

See `.env.example` for all required environment variables. Key variables include:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `PI_API_KEY` - Pi Network API key
- Service ports and URLs

## 🧪 API Examples

### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "SecurePass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Link Wallet
```bash
curl -X POST http://localhost:3000/api/wallet/wallets/link \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "wallet_address": "0x1234567890abcdef",
    "wallet_type": "crypto",
    "currency": "ETH"
  }'
```

### Create Payment
```bash
curl -X POST http://localhost:3000/api/payment/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "amount": 100.00,
    "currency": "USD",
    "payment_method": "pi"
  }'
```

## 📁 Project Structure

```
Tec-App/
├── tec-api-gateway/           # API Gateway service
│   ├── src/
│   │   ├── index.ts           # Main entry point
│   │   ├── routes/            # Proxy route configuration
│   │   └── middleware/        # Rate limiting, logging
│   ├── Dockerfile
│   └── package.json
│
├── tec-auth-service/          # Authentication service
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # Route definitions
│   │   ├── middleware/        # Auth middleware
│   │   ├── models/            # Data models
│   │   ├── utils/             # JWT, hashing utilities
│   │   └── config/            # Database config
│   ├── Dockerfile
│   └── package.json
│
├── tec-wallet-service/        # Wallet management service
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── models/
│   ├── Dockerfile
│   └── package.json
│
├── tec-payment-service/       # Payment processing service
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── models/
│   ├── Dockerfile
│   └── package.json
│
├── tec-frontend/              # Next.js frontend application
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── lib/
│
├── shared/                    # Shared types and utilities
│   └── types/
│       ├── user.ts
│       ├── wallet.ts
│       ├── payment.ts
│       └── api-response.ts
│
├── prisma/
│   └── schema.prisma          # Database schema
│
├── docker-compose.yml         # Docker orchestration
├── package.json               # Root workspace config
└── .env.example               # Environment variables template
```

## 🔐 Security

- All passwords are hashed using bcrypt
- JWT tokens for authentication
- Rate limiting on API Gateway
- CORS and Helmet security headers
- Input validation on all endpoints
- SQL injection protection via Prisma ORM

## 📊 Database Management

```bash
# Generate Prisma client
npm run prisma:generate

# Create a migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Rebuild specific service
docker-compose build [service-name]
```

## 🛣️ Roadmap

- [x] Core platform infrastructure
- [x] Auth, Wallet, Payment services
- [x] API Gateway with proxy routing
- [x] Docker containerization
- [ ] Frontend integration with services
- [ ] Pi Network payment integration
- [ ] Additional microservices (24 total apps)
- [ ] Kubernetes deployment
- [ ] Monitoring and observability
- [ ] CI/CD pipeline

## 📄 License

Private repository - All rights reserved

## 👥 Contributors

- Yasser1728 - Project Owner

## 🤝 Support

For support and questions, please open an issue in the repository.
