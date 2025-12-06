# UNI-CHAIN - Blockchain-based Supply Transparency for Agricultural Produce

A comprehensive blockchain-based supply chain transparency system for agricultural produce tracking.

## Tech Stack

### Frontend
- **React 18.2.0** with TypeScript
- **Vite 5.0.8** - Build tool and dev server
- **Tailwind CSS 3.3.6** - Styling
- **React Router DOM 6.20.1** - Routing
- **Axios 1.6.2** - HTTP client

### Backend
- **Node.js** with **Express 4.18.2**
- **TypeScript 5.3.3**
- **PostgreSQL** - Database
- **Prisma 5.7.1** - ORM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Features

- ✅ DID-based Identity System (Ed25519)
- ✅ Dual Ledger System (Economic & Quality)
- ✅ Zero-Knowledge Proof (ZKP) Module
- ✅ Blockchain Simulation with Hash Chaining
- ✅ Real-time Dashboard Metrics
- ✅ Order Management System
- ✅ Transport Logging
- ✅ Supply Chain Traceability
- ✅ Role-based Access Control (Farmer, Transporter, Retailer, Consumer)

## Project Structure

```
sih/
├── backend/          # Express + TypeScript backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── zkp/      # Zero-Knowledge Proof module
│   └── prisma/       # Database schema & migrations
├── frontend/         # React + TypeScript frontend
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── services/
│       └── context/
└── api/              # Vercel serverless functions
```

## Local Development

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Backend setup:**
   ```bash
   cd backend
   cp .env.example .env  # Create .env file
   # Add your DATABASE_URL, JWT_SECRET, MASTER_KEY
   npx prisma migrate dev
   npm run seed  # Seed dummy data
   npm run dev   # Start backend server (port 3001)
   ```

3. **Frontend setup:**
   ```bash
   cd frontend
   npm run dev   # Start frontend dev server (port 3000)
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api

## Vercel Deployment

### Environment Variables

Set these in your Vercel project settings:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `MASTER_KEY` - Master encryption key for sensitive data

### Deploy

1. **Connect your GitHub repository to Vercel**

2. **Configure build settings:**
   - Root Directory: `/` (project root)
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `cd frontend && npm install && cd ../backend && npm install`

3. **Deploy:**
   ```bash
   vercel --prod
   ```

The application will be deployed with:
- Frontend as static site
- Backend API as serverless functions in `/api` route

## API Endpoints

### Public Endpoints
- `POST /api/register/farmer` - Register farmer
- `POST /api/register/transporter` - Register transporter
- `POST /api/register/retailer` - Register retailer
- `POST /api/register/consumer` - Register consumer
- `POST /api/login` - User login
- `GET /api/trace/:batchId` - Trace product by batch ID
- `GET /api/ledger/economic` - Get economic ledger
- `GET /api/ledger/quality` - Get quality ledger
- `GET /api/supplies` - Get supply prices

### Protected Endpoints (Require JWT)
- `GET /api/me` - Get current user
- `GET /api/account` - Get account details
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `POST /api/produce/register` - Register produce (Farmer)
- `GET /api/produce/logs` - Get produce logs (Farmer)
- And more...

## Database Schema

- **User** - User accounts with DID
- **FarmerIdentity, TransporterIdentity, RetailerIdentity** - Role-specific identities
- **ProduceLog** - Farmer produce records
- **EconomicLedgerTx** - Economic transactions
- **QualityLedgerTx** - Quality tracking data
- **ZkpLog** - Zero-knowledge proof logs
- **SupplyQuantity** - Global supply quantities

## License

ISC
