# TEC Ecosystem - 24 App Digital Platform

![TEC Platform](https://img.shields.io/badge/TEC-Platform-gold)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**TEC** (The Ecosystem Core) is a comprehensive digital platform built on the Pi Network ecosystem, offering 24 integrated applications for finance, commerce, real estate, and more.

## 🏗️ Architecture

TEC Platform follows a microservices architecture with the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│              (Next.js 14 App Router Frontend)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (Port 3000)                  │
│        Rate Limiting • Logging • Request Routing             │
└────────────┬───────────────┬───────────────┬────────────────┘
             │               │               │
    ┌────────▼────┐  ┌──────▼──────┐  ┌────▼─────────┐
    │ Auth Service│  │   Wallet    │  │   Payment    │
    │  (Port 5001)│  │   Service   │  │   Service    │
    │             │  │ (Port 5002) │  │ (Port 5003)  │
    └──────┬──────┘  └──────┬──────┘  └──────┬───────┘
           │                │                │
           └────────────────┼────────────────┘
                            ▼
                ┌───────────────────────┐
                │  PostgreSQL Database  │
                │     (Port 5432)       │
                └───────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose (recommended)
- Node.js 18+ (for local development)
- PostgreSQL 15+ (for local development)

### Environment Setup

1. **Clone the repository:**
```bash
git clone https://github.com/Yasser1728/Tec-App.git
cd Tec-App
```

2. **Set up environment variables:**
```bash
# Required secrets
export POSTGRES_PASSWORD="your_secure_password"
export JWT_SECRET="your_jwt_secret_key_min_32_chars"
export JWT_REFRESH_SECRET="your_refresh_secret_key_min_32_chars"

# Optional configurations
export NODE_ENV="production"
export CORS_ORIGIN="http://localhost:3000"
export PI_API_KEY="your_pi_network_api_key"
```

3. **Start the platform:**
```bash
docker-compose up -d
```

4. **Access the services:**
- **API Gateway:** http://localhost:3000
- **Frontend:** Deploy separately (Next.js app in `tec-frontend/`)
- **Health checks:** 
  - http://localhost:3000/health (API Gateway)
  - http://localhost:5001/health (Auth Service)
  - http://localhost:5002/health (Wallet Service)
  - http://localhost:5003/health (Payment Service)

## 📡 API Endpoints

### Authentication Service (`/api/auth/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Wallet Service (`/api/wallet/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet/wallets?userId={id}` | Get user wallets |
| POST | `/api/wallet/wallets/link` | Link new wallet |
| GET | `/api/wallet/wallets/{id}/balance` | Get wallet balance |
| GET | `/api/wallet/wallets/{id}/transactions` | Get transactions (paginated) |

### Payment Service (`/api/payment/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/payments/create` | Create payment |
| POST | `/api/payment/payments/approve` | Approve payment |
| POST | `/api/payment/payments/complete` | Complete payment |
| GET | `/api/payment/payments/{id}/status` | Get payment status |

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Pi SDK** - Pi Network integration
- **i18n** - Multi-language support (EN/AR)

### Backend Services
- **Express.js** - Web framework
- **TypeScript** - Type-safe APIs
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Primary database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **nginx** - Reverse proxy (optional)

### Security
- **Helmet.js** - Security headers
- **CORS** - Cross-origin protection
- **Rate Limiting** - DDoS protection (100 req/15min)
- **JWT Secrets** - Required environment variables

## 📦 Project Structure

```
Tec-App/
├── tec-frontend/              # Next.js 14 frontend
│   ├── app/                   # App Router pages
│   ├── components/            # React components
│   ├── lib/                   # Utilities (i18n, Pi SDK)
│   └── types/                 # TypeScript types
├── tec-api-gateway/           # API Gateway service
│   ├── src/
│   │   ├── routes/            # Proxy routes
│   │   └── middleware/        # Rate limiting, logging
│   └── Dockerfile
├── tec-auth-service/          # Authentication service
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth middleware
│   │   ├── utils/             # JWT, hashing
│   │   └── config/            # Database config
│   └── Dockerfile
├── tec-wallet-service/        # Wallet management service
│   ├── src/
│   │   ├── controllers/       # Wallet operations
│   │   └── routes/            # Wallet routes
│   └── Dockerfile
├── tec-payment-service/       # Payment processing service
│   ├── src/
│   │   ├── controllers/       # Payment workflow
│   │   └── routes/            # Payment routes
│   └── Dockerfile
├── prisma/                    # Database schema & migrations
│   └── schema.prisma
├── shared/                    # Shared TypeScript types
│   └── types/
├── docker-compose.yml         # Service orchestration
└── README.md
```

## 🔐 Security Features

- **JWT-based authentication** with access and refresh tokens
- **bcryptjs password hashing** (10 salt rounds)
- **Required secrets** - Application fails on startup if JWT secrets missing
- **Rate limiting** at API Gateway (100 requests per 15 minutes)
- **CORS protection** with configurable origins
- **Helmet.js** security headers
- **Input validation** with express-validator
- **Prisma parameterized queries** preventing SQL injection
- **Docker health checks** for all services

## 🗄️ Database Schema

### Core Models
- **User** - Authentication and profile
- **Session** - JWT session tracking
- **Wallet** - Multi-wallet support (Pi/Crypto/Fiat)
- **Transaction** - Transaction history
- **Payment** - Payment processing
- **Plan** - Subscription plans
- **Subscription** - User subscriptions
- **Device** - Trusted device management

### Relationships
- User → Sessions[], Wallets[], Payments[], Subscriptions[]
- Wallet → Transactions[]
- Plan → Subscriptions[]

## 🧪 Development

### Run services locally:

```bash
# Install dependencies for each service
cd tec-api-gateway && npm install
cd tec-auth-service && npm install
cd tec-wallet-service && npm install
cd tec-payment-service && npm install

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start services in dev mode
npm run dev
```

### Build for production:

```bash
# Build all services
docker-compose build

# Start in production mode
docker-compose up -d
```

## 📝 Environment Variables

### Required
- `POSTGRES_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - JWT access token secret (min 32 chars)
- `JWT_REFRESH_SECRET` - JWT refresh token secret (min 32 chars)

### Optional
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origins
- `PI_API_KEY` - Pi Network API key
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

## 🌍 The 24 Apps

1. **Nexus** - Social networking
2. **Commerce** - E-commerce platform
3. **Assets** - Asset management
4. **Fundx** - Investment platform
5. **Estate** - Real estate marketplace
6. **Analytics** - Business intelligence
7. **Connection** - Professional networking
8. **Life** - Lifestyle services
9. **Insure** - Insurance platform
10. **Vip** - Premium services
11. **Zone** - Geographic services
12. **Explorer** - Discovery platform
13. **Alert** - Notification system
14. **System** - System management
15. **Ecommerce** - Online shopping
16. **Dx** - Developer tools
17. **Nx** - Network utilities
18. **Nbf** - Financial services
19. **Epic** - Gaming platform
20. **Legend** - Achievement tracking
21. **Titan** - Enterprise solutions
22. **Elite** - Premium memberships
23. **Brookfield** - Property management
24. **TEC** - Core platform (this)

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

- **GitHub:** [@Yasser1728](https://github.com/Yasser1728)
- **Project:** [Tec-App](https://github.com/Yasser1728/Tec-App)

---

Built with ❤️ for the Pi Network Ecosystem