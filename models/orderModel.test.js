import mongoose from "mongoose";
import Order from "./orderModel.js"; 
import dotenv from "dotenv";

//reference: https://chatgpt.com/share/67b6b64c-e764-800a-bdff-fe4063c4b299

dotenv.config();
const mongoUrl = process.env.MONGO_URL;

beforeAll(async () => {
  if (!mongoUrl) {
    throw new Error("MONGO_URL is not defined in the .env file");
  }

  await mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
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

  it("should enforce enum validation on status", async () => {
    const invalidOrder = new Order({
      products: [new mongoose.Types.ObjectId()],
      payment: {},
      buyer: new mongoose.Types.ObjectId(),
      status: "InvalidStatus",
    });

    let err;
    try {
      await invalidOrder.validate();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.status).toBeDefined();
    expect(err.errors.status.message).toContain("`InvalidStatus` is not a valid enum value");
  });
});

