import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from "../config/db";
import JWT from 'jsonwebtoken';
import { describe, test, expect, beforeAll } from '@playwright/test';
import userModel from '../models/userModel';

describe('Authentication Endpoint Tests', () => {

  const PREFIX = 'http://localhost:3000/api/v1/';
  function usingEndpoint(relpath) {
    if (!relpath.startsWith('/')) relpath = `/${relpath}`;
    return `${PREFIX}${relpath}`;
  }

  // A snapshot of the database to restore it after processing the tests
  let snapshot;

  beforeAll(async () => {
    dotenv.config();
    await connectDB();

    snapshot = {
      categories: await mongoose.connection.db.collection("categories").find({}).toArray(),
      products: await mongoose.connection.db.collection("products").find({}).toArray(),
      orders: await mongoose.connection.db.collection("orders").find({}).toArray(),
      users: await mongoose.connection.db.collection("users").find({}).toArray(),
    };
  });


  describe('Routes for Checking Authentication States', () => {

    describe('.../user-auth', () => {
      test('returns OK for a valid user JWT', async ({ request }) => {
        const user = snapshot.users.find(user => user.role === 0);
        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/user-auth'), {
          headers: { 'Authorization': `${token}` }
        });

        expect(response.status()).toBe(200);
        expect((await response.json()).ok).toBeTruthy();
      });

      test('returns OK for a valid admin JWT', async ({ request }) => {
        const user = snapshot.users.find(user => user.role === 1);
        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/user-auth'), {
          headers: { 'Authorization': `${token}` }
        });

        expect(response.status()).toBe(200);
        expect((await response.json()).ok).toBeTruthy();
      });

      test('returns 401 for missing JWT', async ({ request }) => {
        const response = await request.get(usingEndpoint('/auth/user-auth'));

        expect(response.status()).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for not-a-JWT', async ({ request }) => {
        const response = await request.get(usingEndpoint('/auth/user-auth'), {
          headers: { 'Authorization': `invalid-token` }
        });

        expect(response.status()).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for a JWT with invalid signature', async ({ request }) => {
        const user = snapshot.users.find(user => user.role === 0);
        const wrongSignatureToken = JWT.sign({ _id: user._id }, 'invalid-secret', { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/user-auth'), {
          headers: { 'Authorization': `${wrongSignatureToken}` }
        });

        expect(response.status()).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for an expired JWT', async ({ request }) => {
        const user = snapshot.users.find(user => user.role === 0);
        const expiredToken = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "-1d" });

        const response = await request.get(usingEndpoint('/auth/user-auth'), {
          headers: { 'Authorization': `${expiredToken}` }
        });

        expect(response.status()).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });
    });

    describe('.../admin-auth', () => {
      test('returns OK for a valid admin JWT', async ({ request }) => {
        const admin = snapshot.users.find(user => user.role === 1);
        const token = JWT.sign({ _id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/admin-auth'), {
          headers: { 'Authorization': `${token}` }
        });

        expect(response.status()).toBe(200);
        expect((await response.json()).ok).toBeTruthy();
      });

      test('returns 401 for a valid user JWT', async ({ request }) => {
        const user = snapshot.users.find(user => user.role === 0);
        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/admin-auth'), {
          headers: { 'Authorization': `${token}` }
        });

        expect(response.status()).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for missing JWT', async ({ request }) => {
        const response = await request.get(usingEndpoint('/auth/admin-auth'));

        expect(response.status()).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for not-a-JWT', async ({ request }) => {
        const response = await request.get(usingEndpoint('/auth/admin-auth'), {
          headers: { 'Authorization': `invalid-token` }
        });

        expect(response.status()).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for a JWT with invalid signature', async ({ request }) => {
        const admin = snapshot.users.find(user => user.role === 1);
        const wrongSignatureToken = JWT.sign({ _id: admin._id }, 'invalid-secret', { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/admin-auth'), {
          headers: { 'Authorization': `${wrongSignatureToken}` }
        });

        expect(response.status()).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for an expired JWT', async ({ request }) => {
        const admin = snapshot.users.find(user => user.role === 1);
        const expiredToken = JWT.sign({ _id: admin._id }, process.env.JWT_SECRET, { expiresIn: "-1d" });

        const response = await request.get(usingEndpoint('/auth/admin-auth'), {
          headers: { 'Authorization': `${expiredToken}` }
        });

        expect(response.status()).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

    });

  });

  describe('Routes for User Authentication', () => {
    describe('.../register', () => {
      test('returns 400 for missing field with the appropriate error', async ({ request }) => {
        const response = await request.post(usingEndpoint('/auth/register'), {
          data: { name: 'John Doe', password: '123456' }
        });

        expect(response.status()).toBe(400);

        const json = await response.json();
        expect(json.success).toBeFalsy();
        expect(json.message).toBe('Email is Required');
      });

      test('returns 201 and stores user for a valid registration', async ({ request }) => {
        const SAMPLE_EMAIL = 'fake-address.e2e-test@example.com';

        // Pre-registration cleanup
        await userModel.deleteOne({ email: SAMPLE_EMAIL }).catch(() => {});

        // Register a new user
        const response = await request.post(usingEndpoint('/auth/register'), {
          data: {
            name: 'John Doe',
            email: SAMPLE_EMAIL,
            password: '123456',
            phone: '12345678',
            address: '123 Main St',
            answer: 'answer'
          }
        });

        // Assert response results
        expect(response.status()).toBe(201);

        const json = await response.json();
        expect(json.success).toBeTruthy();
        expect(json.message).toBe('User registered successfully');

        // Assert database existence
        const user = await userModel.findOne({ email: SAMPLE_EMAIL });
        expect(user).not.toBeNull();

        // Post registration cleanup
        await userModel.deleteOne({ email: SAMPLE_EMAIL });
      });
    });

    describe('.../login', () => {
      test('returns 400 for missing field with the appropriate error', async ({ request }) => {
        const response = await request.post(usingEndpoint('/auth/login'), {
          data: { email: 'test@example.com' }
        });

        expect(response.status()).toBe(400);

        const json = await response.json();
        expect(json.success).toBeFalsy();
        expect(json.message).toBe('Password is Required');
      });

      test('returns 401 for an invalid login', async ({ request }) => {
        const response = await request.post(usingEndpoint('/auth/login'), {
          data: { email: 'invalid-user-unit-test@example.com', password: '123456' }
        });

        expect(response.status()).toBe(400);

        const json = await response.json();
        expect(json.success).toBeFalsy();
        expect(json.message).toBe('Invalid Email or Password');
      });

      test('returns 200 with user token and info for a valid login', async ({ request }) => {
        const SAMPLE_EMAIL = 'cs4218@test.com';
        const response = await request.post(usingEndpoint('/auth/login'), {
          data: { email: SAMPLE_EMAIL, password: SAMPLE_EMAIL }
        });

        expect(response.status()).toBe(200);

        const json = await response.json();
        expect(json.success).toBeTruthy();
        expect(json.token).toBeDefined();
        expect(json.user).toBeDefined();

        // Returns the correct user
        expect(json.user.email).toBe(SAMPLE_EMAIL);

        // Returns a valid token
        expect(() => JWT.verify(json.token, process.env.JWT_SECRET)).not.toThrow();

        // The token is for the correct user
        const decoded = JWT.verify(json.token, process.env.JWT_SECRET);
        expect(decoded._id).toBe(json.user._id);
      });
    });

  });


  describe('Routes Requiring Valid Authorization', () => {

    async function expectAuthorizationSuccess(response) {
      expect(response.status()).toBe(200);

      const json = await response.json();
      expect(json.success).toBeTruthy();
    }

    async function expectAuthorizationFailure(response) {
      expect(response.status()).toBe(401);

      const json = await response.json();
      expect(json.success).toBeFalsy();
      expect(json.message).toBe('Unauthorized Access');
    }

    describe('.../profile', () => {
        // TODO
    });

    describe('.../orders', () => {
        // TODO
    });

    describe('.../all-orders', () => {
        // TODO
    });
  });


});
