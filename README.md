# AccessCore Service

API Key Management System built with NestJS - A secure and scalable solution for managing API keys with authentication, rotation, and access control.

## 🚀 Features

- ✅ User authentication with JWT
- ✅ API key generation with cryptographic security
- ✅ API key rotation and revocation
- ✅ Maximum 3 active keys per user
- ✅ Automatic key expiration (1 year default)
- ✅ Access logging (bonus feature)
- ✅ 74%+ test coverage

## 📋 Tech Stack

- **Framework**: NestJS 9.x
- **Runtime**: Node.js 24.x
- **Language**: TypeScript 4.x
- **Database**: MongoDB Atlas (Cloud)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Testing**: Jest + Supertest
- **Containerization**: Docker

## 📦 Installation

### Prerequisites

- Node.js 24+ installed
- MongoDB Atlas account (or local MongoDB 7+)
- Yarn package manager
- Docker (optional, for containerization)

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd accesscore_service
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # App
   NODE_ENV=development
   PORT=3000

   # Database (MongoDB Atlas)
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/accesscore?retryWrites=true&w=majority

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRATION=24h

   # API Key Settings
   API_KEY_MAX_ACTIVE=3
   API_KEY_DEFAULT_EXPIRATION_DAYS=365
   ```

   **Note**: Replace `<username>`, `<password>`, and `<cluster>` with your MongoDB Atlas credentials.

4. **Run database migrations**
   ```bash
   npx migrate-mongo up
   ```

## 🏃 Running the Application

### Development Mode
```bash
yarn start:dev
```
Server runs on: `http://localhost:3000`

### Production Mode
```bash
yarn build
yarn start:prod
```

### Watch Mode
```bash
yarn start:debug
```

### Docker (Containerized)
```bash
# Build Docker image
docker build -t accesscore-service .

# Run container
docker run -p 3000:3000 --env-file .env accesscore-service
```

## 🧪 Testing

### Run all tests
```bash
yarn test
```

### Run tests with coverage
```bash
yarn test:cov
```
Current coverage: **74.44%**

### Run E2E tests
```bash
yarn test:e2e
```

## 📚 API Documentation

### Postman Collection

Import the Postman collection for complete API documentation with examples:

**File**: `AccessCore_API.postman_collection.json`

**Import Steps**:
1. Open Postman
2. Click "Import" button
3. Select the JSON file
4. Collection will appear with all endpoints

### API Endpoints

#### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive JWT token

#### API Keys (Protected - JWT Required)
- `POST /api-keys` - Generate new API key
- `GET /api-keys` - List all API keys
- `DELETE /api-keys/:id` - Revoke an API key
- `POST /api-keys/:id/rotate` - Rotate an API key

#### Access Logs (Protected - JWT Required)
- `GET /access-logs` - View audit logs of all API key operations

### Quick Start Example

1. **Register a user**
   ```bash
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "Password123!"
     }'
   ```

2. **Login**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "Password123!"
     }'
   ```
   Save the `accessToken` from response.

3. **Generate API Key**
   ```bash
   curl -X POST http://localhost:3000/api-keys \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -d '{
       "name": "Production API Key"
     }'
   ```

## 🔒 Security Features

- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, number, and special character
- **API Key Format**: `ak_live_` prefix + 64 character hex string
- **Hashing**: bcrypt with 10 salt rounds for passwords and API keys
- **JWT Expiration**: 24 hours (configurable)
- **Key Expiration**: 1 year default (configurable)
- **Max Active Keys**: 3 per user (configurable)

## 🗄️ Database Schema

### Users Collection
```typescript
{
  _id: ObjectId
  email: string (unique)
  password: string (hashed)
  createdAt: Date
  updatedAt: Date
}
```

### API Keys Collection
```typescript
{
  _id: ObjectId
  userId: ObjectId (ref: User)
  key: string (hashed)
  prefix: string (visible, e.g., "ak_live_abc123")
  name: string
  status: "ACTIVE" | "REVOKED" | "EXPIRED"
  expiresAt: Date
  lastUsedAt: Date
  revokedAt: Date
  createdAt: Date
  updatedAt: Date
}
```

### Access Logs Collection (Bonus)
```typescript
{
  _id: ObjectId
  apiKeyId: ObjectId (ref: ApiKey)
  userId: ObjectId (ref: User)
  endpoint: string
  method: string
  statusCode: number
  ipAddress: string
  userAgent: string
  timestamp: Date
}
```

## 📁 Project Structure

```
src/
├── modules/
│   ├── auth/              # Authentication module
│   ├── api-keys/          # API key management
│   └── access-logs/       # Access logging (bonus)
├── common/
│   ├── constants/         # App constants
│   ├── decorators/        # Custom decorators
│   ├── interceptors/      # Logging interceptor
│   └── utils/             # Crypto & hash utilities
├── config/                # Configuration files
├── app.module.ts
└── main.ts

test/
├── *.spec.ts             # Unit tests
└── *.e2e-spec.ts         # E2E tests

migrations/               # Database migrations
```

## 🚀 Deployment

### Deployment URL
```
Production: https://sxz4fpw7u6.us-east-1.awsapprunner.com
```

### Docker Deployment

The application is containerized using Docker for easy deployment.

**Build and run locally:**
```bash
# Build image
docker build -t accesscore-service .

# Run container
docker run -p 3000:3000 --env-file .env accesscore-service
```

**Docker Compose (with MongoDB):**
```bash
docker-compose up -d
```

### AWS Deployment (Recommended)

**Platform Options:**
- AWS ECS Fargate (Serverless containers)
- AWS EC2 (Traditional instances)
- AWS App Runner (Simplified container deployment)

**Database:**
- MongoDB Atlas (Cloud-managed)
- AWS DocumentDB (AWS-managed MongoDB-compatible)

**Deployment Steps:**
1. Build Docker image
2. Push to AWS ECR (Elastic Container Registry)
3. Create ECS task definition
4. Deploy to ECS Fargate/EC2
5. Configure Application Load Balancer
6. Set up CloudWatch for logging and monitoring

### MongoDB Atlas Setup

1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with read/write permissions
3. Whitelist IP addresses:
   - For development: Your local IP
   - For production: `0.0.0.0/0` or specific AWS IPs
4. Get connection string from Atlas dashboard
5. Add connection string to `.env` file

**Connection String Format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/accesscore?retryWrites=true&w=majority
```

## 🔧 Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `3000` | No |
| `MONGODB_URI` | MongoDB Atlas connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRATION` | JWT token expiration | `24h` | No |
| `API_KEY_MAX_ACTIVE` | Max active keys per user | `3` | No |
| `API_KEY_DEFAULT_EXPIRATION_DAYS` | Default key expiration | `365` | No |

## 📊 Test Coverage

Current test coverage: **74.44%**


## 🐳 Docker

The application includes a `Dockerfile` for containerization:

- Multi-stage build for optimized image size
- Node.js 24 Alpine base image
- Production-ready configuration
- Health check endpoint included

See `Dockerfile` for complete configuration.


