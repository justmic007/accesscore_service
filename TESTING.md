# API Testing Guide

## Base URL
```
http://localhost:3000
```

## 1. Register a User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "id": "...",
  "email": "test@example.com",
  "createdAt": "2024-..."
}
```

## 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@example.com"
  }
}
```

**Save the accessToken for next requests!**

## 3. Generate API Key

```bash
curl -X POST http://localhost:3000/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "name": "My new app API Key"
  }'
```

**Expected Response:**
```json
{
  "id": "...",
  "key": "ak_live_abc123def456...",  // ONLY SHOWN ONCE!
  "prefix": "ak_live_abc123",
  "name": "My First API Key",
  "status": "ACTIVE",
  "expiresAt": "2025-12-31T...",
  "createdAt": "2024-..."
}
```

## 4. List API Keys

```bash
curl -X GET http://localhost:3000/api-keys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response:**
```json
[
  {
    "id": "...",
    "prefix": "ak_live_abc123",
    "name": "My First API Key",
    "status": "ACTIVE",
    "expiresAt": "2025-12-31T...",
    "lastUsedAt": null,
    "createdAt": "2024-..."
  }
]
```

## 5. Revoke API Key

```bash
curl -X DELETE http://localhost:3000/api-keys/YOUR_KEY_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "message": "API key revoked successfully"
}
```

## 6. Rotate API Key

```bash
curl -X POST http://localhost:3000/api-keys/YOUR_KEY_ID/rotate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "id": "...",  // NEW KEY ID
  "key": "ak_live_xyz789...",  // NEW KEY (ONLY SHOWN ONCE!)
  "prefix": "ak_live_xyz789",
  "name": "My First API Key",
  "status": "ACTIVE",
  "expiresAt": "2025-12-31T...",
  "createdAt": "2024-..."
}
```

## Test Scenarios

### Success Cases
1. Register new user
2. Login with correct credentials
3. Generate API key (up to 3)
4. List all keys
5. Revoke a key
6. Rotate a key

### Error Cases
1. Register with duplicate email → 409 Conflict
2. Login with wrong password → 401 Unauthorized
3. Generate 4th API key → 403 Forbidden (max 3 keys)
4. Access endpoints without JWT → 401 Unauthorized
5. Revoke another user's key → 403 Forbidden
6. Invalid email format → 400 Bad Request
7. Password < 8 chars → 400 Bad Request

