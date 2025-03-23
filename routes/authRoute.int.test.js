import dotenv from 'dotenv';
import JWT from 'jsonwebtoken';

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from 'mongoose';

import userModel from '../models/userModel';

import { createSampleUser, generateSampleUserProps } from '../tests/generators/sample-user';

import express from 'express';
import authRoutes from './authRoute';

//
// Tests integration for: API <--> router <--> middleware <--> controllers <--> database
// For authentication related validations and operations
//
describe('Endpoint Authentication Integration Tests', () => {

  let mongoServer;
  let app;
  let listener;
  let PORT = 0;

  let tempStandardUser = { role: 0 };
  let tempAdminUser = { role: 1 };

  const cleanRequestOptions = (options) => {
    if (typeof options?.body === 'object') {
      options.headers = { 'Content-Type': 'application/json', ...options.headers };
      options.body = JSON.stringify(options.body);
    }
  }

  const request = {
    get: async (url, options) => {
      cleanRequestOptions(options);
      return await fetch(url, { method: 'GET', ...options });
    },
    post: async (url, options) => {
      cleanRequestOptions(options);
      return await fetch(url, { method: 'POST', ...options });
    },
    put: async (url, options) => {
      cleanRequestOptions(options);
      return await fetch(url, { method: 'PUT', ...options });
    },
    delete: async (url, options) => {
      cleanRequestOptions(options);
      return await fetch(url, { method: 'DELETE', ...options });
    }
  };

  const usingEndpoint = (relpath) => {
    if (!relpath.startsWith('/')) relpath = `/${relpath}`;
    return `http://localhost:${PORT}/api/v1${relpath}`;
  }

  beforeAll(async () => {
    // Load environment variables (required for JWT secret)
    dotenv.config();

    // Start a temporary MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Prepopulate the database with sample users
    tempStandardUser = await createSampleUser(0);
    tempAdminUser = await createSampleUser(1);

    // Start a dummy ExpressJS server
    app = express();
    app.use(express.json());
    app.use("/api/v1/auth", authRoutes);

    listener = app.listen(0, () => {
      PORT = listener.address().port;
      console.log(`Running authRoute integration tests on port ${PORT}`);
    });

    // Wait for the express server to start
    for (let i = 0; i < 5 && !PORT; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!PORT) {
      throw new Error("Express server failed to start - can't test auth routes");
    }
  });

  afterAll(async () => {
    listener.close();

    await userModel.findByIdAndDelete(tempStandardUser._id);
    await userModel.findByIdAndDelete(tempAdminUser._id);

    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('Routes for Checking Authentication States', () => {

    describe('.../user-auth', () => {
      test('returns OK for a valid user JWT', async () => {
        const user = tempStandardUser;
        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/user-auth'), {
          headers: { 'Authorization': `${token}` }
        });

        expect(response.status).toBe(200);
        expect((await response.json()).ok).toBeTruthy();
      });

      test('returns OK for a valid admin JWT', async () => {
        const user = tempAdminUser;
        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/user-auth'), {
          headers: { 'Authorization': `${token}` }
        });

        expect(response.status).toBe(200);
        expect((await response.json()).ok).toBeTruthy();
      });

      test('returns 401 for missing JWT', async () => {
        const response = await request.get(usingEndpoint('/auth/user-auth'));

        expect(response.status).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for not-a-JWT', async () => {
        const response = await request.get(usingEndpoint('/auth/user-auth'), {
          headers: { 'Authorization': `invalid-token` }
        });

        expect(response.status).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for a JWT with invalid signature', async () => {
        const user = tempStandardUser;
        const wrongSignatureToken = JWT.sign({ _id: user._id }, 'invalid-secret', { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/user-auth'), {
          headers: { 'Authorization': `${wrongSignatureToken}` }
        });

        expect(response.status).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for an expired JWT', async () => {
        const user = tempStandardUser;
        const expiredToken = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "-1d" });

        const response = await request.get(usingEndpoint('/auth/user-auth'), {
          headers: { 'Authorization': `${expiredToken}` }
        });

        expect(response.status).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });
    });

    describe('.../admin-auth', () => {
      test('returns OK for a valid admin JWT', async () => {
        const admin = tempAdminUser;
        const token = JWT.sign({ _id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/admin-auth'), {
          headers: { 'Authorization': `${token}` }
        });

        expect(response.status).toBe(200);
        expect((await response.json()).ok).toBeTruthy();
      });

      test('returns 401 for a valid user JWT', async () => {
        const user = tempStandardUser;
        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/admin-auth'), {
          headers: { 'Authorization': `${token}` }
        });

        expect(response.status).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for missing JWT', async () => {
        const response = await request.get(usingEndpoint('/auth/admin-auth'));

        expect(response.status).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for not-a-JWT', async () => {
        const response = await request.get(usingEndpoint('/auth/admin-auth'), {
          headers: { 'Authorization': `invalid-token` }
        });

        expect(response.status).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for a JWT with invalid signature', async () => {
        const admin = tempAdminUser;
        const wrongSignatureToken = JWT.sign({ _id: admin._id }, 'invalid-secret', { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/admin-auth'), {
          headers: { 'Authorization': `${wrongSignatureToken}` }
        });

        expect(response.status).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for an expired JWT', async () => {
        const admin = tempAdminUser;
        const expiredToken = JWT.sign({ _id: admin._id }, process.env.JWT_SECRET, { expiresIn: "-1d" });

        const response = await request.get(usingEndpoint('/auth/admin-auth'), {
          headers: { 'Authorization': `${expiredToken}` }
        });

        expect(response.status).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

    });

  });

  describe('Routes for User Authentication', () => {
    describe('.../register', () => {
      test('returns 400 for missing field with the appropriate error', async () => {
        const response = await request.post(usingEndpoint('/auth/register'), {
          body: { name: 'John Doe', password: '123456' }
        });

        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.success).toBeFalsy();
        expect(json.message).toBe('Email is Required');
      });

      test('returns 201 and stores user for a valid registration', async () => {
        const newUserProps = generateSampleUserProps();

        // Register a new user via API
        const response = await request.post(usingEndpoint('/auth/register'), {
          body: { ...newUserProps }
        });

        // Assert response results
        expect(response.status).toBe(201);

        const json = await response.json();
        expect(json.success).toBeTruthy();
        expect(json.message).toBe('User registered successfully');

        // Assert database existence
        const user = await userModel.findOne({ email: newUserProps.email });
        expect(user).not.toBeNull();

        // Post registration cleanup
        await userModel.deleteOne({ email: newUserProps.email });
      });
    });

    describe('.../login', () => {
      test('returns 400 for missing field with the appropriate error', async () => {
        const response = await request.post(usingEndpoint('/auth/login'), {
          body: { email: 'test@example.com' }
        });

        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.success).toBeFalsy();
        expect(json.message).toBe('Password is Required');
      });

      test('returns 401 for an invalid login', async () => {
        const response = await request.post(usingEndpoint('/auth/login'), {
          body: { email: 'invalid-user-unit-test@example.com', password: '123456' }
        });

        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.success).toBeFalsy();
        expect(json.message).toBe('Invalid Email or Password');
      });

      test('returns 200 with user token and info for a valid login', async () => {
        // Log in as a standard user
        const response = await request.post(usingEndpoint('/auth/login'), {
          body: { email: tempStandardUser.email, password: tempStandardUser.password }
        });

        // Assert response results
        expect(response.status).toBe(200);

        const json = await response.json();
        expect(json.success).toBeTruthy();
        expect(json.token).toBeDefined();
        expect(json.user).toBeDefined();

        // Returns the correct user
        expect(json.user.email).toBe(tempStandardUser.email);

        // Returns a valid token
        expect(() => JWT.verify(json.token, process.env.JWT_SECRET)).not.toThrow();

        // The token is for the correct user
        const decoded = JWT.verify(json.token, process.env.JWT_SECRET);
        expect(decoded._id).toBe(json.user._id);
      });
    });

  });


  describe('Routes Requiring Valid Authorization', () => {

    function constructValidRequestTests(getUser, endpoint, method, data, handler) {
      test(`authorized for a user with ${getUser()?.role === 1 ? 'admin' : 'standard'} role`, async () => {
        const user = getUser();
        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        const response = await request[method](usingEndpoint(endpoint), {
          headers: { 'Authorization': `${token}` },
          data
        });
        await handler(response);
      });
    }

    function constructInvalidRequestTests(getUser, endpoint, method, data, handler) {
      test(`unauthorized for user with ${getUser()?.role === 1 ? 'admin' : 'standard'} role`, async () => {
        const user = getUser();
        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        const response = await request[method](usingEndpoint(endpoint), {
          headers: { 'Authorization': `${token}` },
          data
        });
        await handler(response);
      });
    }

    function constructInvalidTokenTests(getUser, endpoint, method, handler) {
      test('unauthorized for missing JWT', async () => {
        const response = await request[method](usingEndpoint(endpoint));
        await handler(response);
      });

      test('unauthorized for not-a-JWT', async () => {
        const response = await request[method](usingEndpoint(endpoint), {
          headers: { 'Authorization': `invalid-token` }
        });
        await handler(response);
      });

      test('unauthorized for a JWT with invalid signature', async () => {
        const user = getUser();
        const wrongSignatureToken = JWT.sign({ _id: user._id }, 'invalid-secret', { expiresIn: "1d" });
        const response = await request[method](usingEndpoint(endpoint), {
          headers: { 'Authorization': `${wrongSignatureToken}` }
        });
        await handler(response);
      });

      test('unauthorized for an expired JWT', async () => {
        const user = getUser();
        const expiredToken = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "-1d" });
        const response = await request[method](usingEndpoint(endpoint), {
          headers: { 'Authorization': `${expiredToken}` }
        });
        await handler(response);
      });
    }

    async function expectAuthorizationSuccess(response) {
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.error).toBeUndefined();
      expect(json.success || Array.isArray(json)).toBe(true);
    }

    async function expectAuthorizationFailure(response) {
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.message).toBe('Unauthorized Access');
    }

    describe('.../profile', () => {
      constructValidRequestTests(() => tempStandardUser, '/auth/profile', 'put', { address: 'Edited Address' }, expectAuthorizationSuccess);
      constructValidRequestTests(() => tempAdminUser, '/auth/profile', 'put', { address: 'Edited Address' }, expectAuthorizationSuccess);
      constructInvalidTokenTests(() => tempStandardUser, '/auth/profile', 'put', expectAuthorizationFailure);
    });

    describe('.../orders', () => {
      constructValidRequestTests(() => tempStandardUser, '/auth/orders', 'get', {}, expectAuthorizationSuccess);
      constructValidRequestTests(() => tempAdminUser, '/auth/orders', 'get', {}, expectAuthorizationSuccess);
      constructInvalidTokenTests(() => tempStandardUser, '/auth/orders', 'get', expectAuthorizationFailure);
    });

    describe('.../all-orders', () => {
      constructValidRequestTests(() => tempAdminUser, '/auth/all-orders', 'get', {}, expectAuthorizationSuccess);
      constructInvalidRequestTests(() => tempStandardUser, '/auth/all-orders', 'get', {}, expectAuthorizationFailure);
      constructInvalidTokenTests(() => tempAdminUser, '/auth/all-orders', 'get', expectAuthorizationFailure);
    });

  });


});
