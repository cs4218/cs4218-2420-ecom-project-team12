import mongoose from 'mongoose';
import User from './userModel'; 
import { MongoMemoryServer } from 'mongodb-memory-server';

//reference: https://chatgpt.com/share/67b72a19-2a08-800a-b10e-91f9acfe866a

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User Model Test', () => {
  it('should create a user successfully', async () => {
    const validUser = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'securepassword',
      phone: '1234567890',
      address: { street: '123 Main St', city: 'Anytown' },
      answer: 'Blue',
      role: 1,
    });
    const savedUser = await validUser.save();
    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe('John Doe');
  });

  it('should require all fields', async () => {
    const userWithoutFields = new User({});
    let err;
    try {
      await userWithoutFields.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
    expect(err.errors.phone).toBeDefined();
    expect(err.errors.address).toBeDefined();
    expect(err.errors.answer).toBeDefined();
  });

  it('should enforce unique email constraint', async () => {
    await User.init(); // Ensure indexes are built
  
    const user1 = new User({
      name: 'John Doe',
      email: 'duplicate@example.com',
      password: 'password123',
      phone: '9876543210',
      address: { street: '321 Side St', city: 'Othertown' },
      answer: 'Red',
      role: 0,
    });
    await user1.save();
  
    const user2 = new User({
      name: 'Jane Doe',
      email: 'duplicate@example.com', // Same email as user1
      password: 'password456',
      phone: '1231231234',
      address: { street: '456 Another St', city: 'Sometown' },
      answer: 'Green',
      role: 1,
    });
  
    let err;
    try {
      await user2.save();
    } catch (error) {
      err = error;
    }
  
    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(mongoose.mongo.MongoServerError);
    expect(err.message).toMatch(/duplicate key error/i); 
  });
  
});
