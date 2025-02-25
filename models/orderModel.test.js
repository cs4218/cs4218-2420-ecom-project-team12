import mongoose from "mongoose";
import Order from "./orderModel.js"; 
import { MongoMemoryServer } from "mongodb-memory-server";

//reference: https://chatgpt.com/share/67b6b64c-e764-800a-bdff-fe4063c4b299

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Order Model Test", () => {
  it("should create and save an order successfully", async () => {
    const orderData = {
      products: [new mongoose.Types.ObjectId()],
      payment: { method: "Credit Card", amount: 100 },
      buyer: new mongoose.Types.ObjectId(),
      status: "Processing",
    };

    const order = new Order(orderData);
    const savedOrder = await order.save();

    expect(savedOrder._id).toBeDefined();
    expect(savedOrder.products.length).toBe(1);
    expect(savedOrder.payment.method).toBe("Credit Card");
    expect(savedOrder.buyer).toBeDefined();
    expect(savedOrder.status).toBe("Processing");
  });

  it("should not save an order with an invalid status", async () => {
    const invalidOrder = new Order({
      products: [new mongoose.Types.ObjectId()],
      payment: { method: "PayPal", amount: 50 },
      buyer: new mongoose.Types.ObjectId(),
      status: "InvalidStatus",
    });

    let err;
    try {
      await invalidOrder.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.status).toBeDefined();
  });
});

