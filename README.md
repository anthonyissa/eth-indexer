# ETH Indexer

A TypeScript-based Ethereum indexer specifically designed to track and monitor UserOperation events from ERC-4337 (Account Abstraction) transactions. The project includes both a backend indexer service and a React-based frontend dashboard.

## Features

- Indexes UserOperation events from an ERC-4337 EntryPoint contract
- Real-time event monitoring and historical event backfilling
- REST API for querying indexed operations
- React dashboard for visualizing operations
- Prometheus metrics integration
- In-memory caching system
- SQLite database for persistent storage

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Access to an Ethereum RPC endpoint

## Installation

```bash
git clone https://github.com/anthonyissa/eth-indexer.git

cd eth-indexer

npm install

cp .env.example .env

cd frontend

npm install
```

## Usage

### Running the Backend

Start the indexer service:

```bash
npm run dev
```

This will:
- Initialize the SQLite database
- Start indexing UserOperation events
- Launch the REST API server
- Enable metrics collection

### Running the Frontend

In a separate terminal, navigate to the frontend directory:

```bash
cd frontend

npm run start
```

The dashboard will be available at `http://localhost:3001`

## API Endpoints

### GET /api/operations
Returns all indexed UserOperation events

### GET /api/operations/:hash
Returns a specific UserOperation by its hash

### POST /api/operations/search
Search operations with filters

```json
{
"sender": "0x...",
"paymaster": "0x...",
"fromBlock": 1000000,
"toBlock": 2000000,
"success": true
}
```

### GET /metrics
Returns Prometheus-formatted metrics

## Project Structure

- `/src` - Backend TypeScript source files
  - `index.ts` - Main entry point
  - `api.ts` - REST API implementation
  - `database.ts` - SQLite database service
  - `metrics.ts` - Prometheus metrics service
  - `cache.ts` - In-memory caching system
  
- `/frontend` - React dashboard
  - `src/components` - React components
  - `src/types` - TypeScript interfaces
  - `src/App.tsx` - Main application component
