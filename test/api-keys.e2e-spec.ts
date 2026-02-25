import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('API Keys E2E', () => {
    let app: INestApplication;
    let connection: Connection;
    let accessToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Apply same validation as main.ts
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();

        connection = moduleFixture.get<Connection>(getConnectionToken());
    });

    afterAll(async () => {
        // Clean up collections instead of dropping database
        const collections = connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});  // ✅ Just delete documents
        }
        await connection.close();
        await app.close();
    });


    afterEach(async () => {
        const collections = connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });

    describe('Auth Flow', () => {
        it('should register a new user', () => {
            return request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'Password123!',
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.email).toBe('test@example.com');
                });
        });

        it('should login and get access token', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'Password123!',
                });

            return request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Password123!',
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('accessToken');
                    expect(res.body.user.email).toBe('test@example.com');
                });
        });

        it('should fail login with wrong password', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'Password123!',
                });

            return request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'WrongPassword',
                })
                .expect(401);
        });
    });

    describe('API Keys Flow', () => {
        beforeEach(async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'Password123!',
                });

            const loginRes = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Password123!',
                });

            accessToken = loginRes.body.accessToken;
        });

        it('should generate an API key', () => {
            return request(app.getHttpServer())
                .post('/api-keys')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Test Key' })
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('key');
                    expect(res.body.key).toMatch(/^ak_live_/);
                    expect(res.body.name).toBe('Test Key');
                    expect(res.body.status).toBe('ACTIVE');
                });
        });

        it('should fail without JWT token', () => {
            return request(app.getHttpServer())
                .post('/api-keys')
                .send({ name: 'Test Key' })
                .expect(401);
        });

        it('should list API keys', async () => {
            await request(app.getHttpServer())
                .post('/api-keys')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Key 1' });

            return request(app.getHttpServer())
                .get('/api-keys')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(res.body.length).toBe(1);
                    expect(res.body[0].name).toBe('Key 1');
                });
        });

        it('should revoke an API key', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/api-keys')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Key to Revoke' });

            const keyId = createRes.body.id;

            return request(app.getHttpServer())
                .delete(`/api-keys/${keyId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.message).toBe('API key revoked successfully');
                });
        });

        it('should rotate an API key', async () => {
            const createRes = await request(app.getHttpServer())
                .post('/api-keys')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Key to Rotate' });

            const keyId = createRes.body.id;
            const oldKey = createRes.body.key;

            return request(app.getHttpServer())
                .post(`/api-keys/${keyId}/rotate`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(201)
                .expect((res) => {
                    expect(res.body.key).not.toBe(oldKey);
                    expect(res.body.key).toMatch(/^ak_live_/);
                    expect(res.body.name).toBe('Key to Rotate');
                });
        });

        it('should fail when generating 4th API key', async () => {
            await request(app.getHttpServer())
                .post('/api-keys')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Key 1' });

            await request(app.getHttpServer())
                .post('/api-keys')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Key 2' });

            await request(app.getHttpServer())
                .post('/api-keys')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Key 3' });

            return request(app.getHttpServer())
                .post('/api-keys')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Key 4' })
                .expect(403);
        });
    });
});
