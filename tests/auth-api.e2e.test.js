import { describe, test, expect, beforeAll, afterAll } from '@playwright/test';

import JWT from 'jsonwebtoken';
import dotenv from 'dotenv';
import connectDB from "../config/db";
import userModel from '../models/userModel';
import { createSampleUser, generateSampleUserProps } from './generators/sample-user';

describe('Authentication Endpoint Tests', () => {

  const PREFIX = 'http://localhost:3000/api/v1';
  function usingEndpoint(relpath) {
    if (!relpath.startsWith('/')) relpath = `/${relpath}`;
    return PREFIX + relpath;
  }


  let tempStandardUser = { role: 0 };
  let tempAdminUser = { role: 1 };

  beforeAll(async () => {
    dotenv.config();
    await connectDB();

    tempStandardUser = await createSampleUser(0);
    tempAdminUser = await createSampleUser(1);
  });

  afterAll(async () => {
    await userModel.findByIdAndDelete(tempStandardUser._id);
    await userModel.findByIdAndDelete(tempAdminUser._id);
  });



  describe('Routes for Checking Authentication States', () => {

    describe('.../user-auth', () => {
      test('returns OK for a valid user JWT', async ({ request }) => {
        const user = tempStandardUser;
        const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/user-auth'), {
          headers: { 'Authorization': `${token}` }
        });

        expect(response.status()).toBe(200);
        expect((await response.json()).ok).toBeTruthy();
      });

      test('returns OK for a valid admin JWT', async ({ request }) => {
        const user = tempAdminUser;
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
        const user = tempStandardUser;
        const wrongSignatureToken = JWT.sign({ _id: user._id }, 'invalid-secret', { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/user-auth'), {
          headers: { 'Authorization': `${wrongSignatureToken}` }
        });

        expect(response.status()).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for an expired JWT', async ({ request }) => {
        const user = tempStandardUser;
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
        const admin = tempAdminUser;
        const token = JWT.sign({ _id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/admin-auth'), {
          headers: { 'Authorization': `${token}` }
        });

        expect(response.status()).toBe(200);
        expect((await response.json()).ok).toBeTruthy();
      });

      test('returns 401 for a valid user JWT', async ({ request }) => {
        const user = tempStandardUser;
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
        const admin = tempAdminUser;
        const wrongSignatureToken = JWT.sign({ _id: admin._id }, 'invalid-secret', { expiresIn: "1d" });

        const response = await request.get(usingEndpoint('/auth/admin-auth'), {
          headers: { 'Authorization': `${wrongSignatureToken}` }
        });

        expect(response.status()).toBe(401);
        expect((await response.json()).ok).toBeFalsy();
      });

      test('returns 401 for an expired JWT', async ({ request }) => {
        const admin = tempAdminUser;
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
        const newUserProps = generateSampleUserProps();

        // Register a new user via API
        const response = await request.post(usingEndpoint('/auth/register'), {
          data: { ...newUserProps }
        });

        // Assert response results
        expect(response.status()).toBe(201);

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
        // Log in as a standard user
        const response = await request.post(usingEndpoint('/auth/login'), {
          data: { email: tempStandardUser.email, password: tempStandardUser.password }
        });

        // Assert response results
        expect(response.status()).toBe(200);

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
      test(`authorized for a user with ${getUser()?.role === 1 ? 'admin' : 'standard'} role`, async ({ request }) => {
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
      test(`unauthorized for user with ${getUser()?.role === 1 ? 'admin' : 'standard'} role`, async ({ request }) => {
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
      test('unauthorized for missing JWT', async ({ request }) => {
        const response = await request[method](usingEndpoint(endpoint));
        await handler(response);
      });

      test('unauthorized for not-a-JWT', async ({ request }) => {
        const response = await request[method](usingEndpoint(endpoint), {
          headers: { 'Authorization': `invalid-token` }
        });
        await handler(response);
      });

      test('unauthorized for a JWT with invalid signature', async ({ request }) => {
        const user = getUser();
        const wrongSignatureToken = JWT.sign({ _id: user._id }, 'invalid-secret', { expiresIn: "1d" });
        const response = await request[method](usingEndpoint(endpoint), {
          headers: { 'Authorization': `${wrongSignatureToken}` }
        });
        await handler(response);
      });

      test('unauthorized for an expired JWT', async ({ request }) => {
        const user = getUser();
        const expiredToken = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "-1d" });
        const response = await request[method](usingEndpoint(endpoint), {
          headers: { 'Authorization': `${expiredToken}` }
        });
        await handler(response);
      });
    }

    async function expectAuthorizationSuccess(response) {
      const json = await response.json();
      console.log(json);

      expect(response.status()).toBe(200);
      expect(json.error).toBeUndefined();
      expect(json.success || Array.isArray(json)).toBe(true);
    }

    async function expectAuthorizationFailure(response) {
      expect(response.status()).toBe(401);

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
