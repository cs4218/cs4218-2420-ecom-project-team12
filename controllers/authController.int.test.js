import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "./authController.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

//reference: https://chatgpt.com/share/67dede88-40b4-800a-a7d9-61f8a493643c

const productSchema = new mongoose.Schema({ name: String, photo: String });
mongoose.model("Products", productSchema);

describe("Integration Tests for Auth Controllers", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
    await orderModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  const createRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  describe("updateProfileController", () => {
    it("should update the user profile successfully", async () => {
      const user = await userModel.create({
        name: "Original Name",
        email: "original@example.com",
        password: "password123", 
        phone: "1112223333",
        address: "Original Address",
        answer: "Test Answer",
      });

      const req = {
        user: { _id: user._id },
        body: {
          name: "Updated Name",
          phone: "9998887777",
          address: "Updated Address",
        },
      };
      const res = createRes();

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Profile Updated SUccessfully",
        })
      );

      const updatedUser = await userModel.findById(user._id);
      expect(updatedUser.name).toBe("Updated Name");
      expect(updatedUser.phone).toBe("9998887777");
      expect(updatedUser.address).toBe("Updated Address");
    });

    it("should return an error when password is less than 6 characters", async () => {
      const user = await userModel.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        phone: "1112223333",
        address: "Test Address",
        answer: "Answer",
      });

      const req = {
        user: { _id: user._id },
        body: {
          password: "123", 
        },
      };
      const res = createRes();

      await updateProfileController(req, res);
      expect(res.json).toHaveBeenCalledWith({
        error: "Passsword is required and 6 character long",
      });
    });
  });

  describe("getOrdersController", () => {
    it("should return orders for the authenticated user", async () => {
      const user = await userModel.create({
        name: "Order User",
        email: "orderuser@example.com",
        password: "password123",
        phone: "1234567890",
        address: "Some Address",
        answer: "Answer",
      });


      const order1 = await orderModel.create({
        products: [], 
        buyer: user._id,
        status: "Not Process",
      });
      const order2 = await orderModel.create({
        products: [],
        buyer: user._id,
        status: "Processing",
      });

      const req = { user: { _id: user._id } };
      const res = createRes();

      await getOrdersController(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ _id: order1._id }),
          expect.objectContaining({ _id: order2._id }),
        ])
      );
    });

    it("should handle errors during fetching orders", async () => {
      const originalFind = orderModel.find;
      orderModel.find = () => ({
        populate: () => ({
          populate: () => {
            throw new Error("Database error");
          },
        }),
      });

      const req = { user: { _id: new mongoose.Types.ObjectId() } };
      const res = createRes();

      await getOrdersController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error WHile Geting Orders",
        })
      );

      
      orderModel.find = originalFind;
    });
  });

  describe("getAllOrdersController", () => {
    it("should return all orders", async () => {
        const user1 = await userModel.create({
          name: "User One",
          email: "userone@example.com",
          password: "password123",
          phone: "1111111111",
          address: "Address One",
          answer: "Answer",
        });
        const user2 = await userModel.create({
          name: "User Two",
          email: "usertwo@example.com",
          password: "password123",
          phone: "2222222222",
          address: "Address Two",
          answer: "Answer",
        });
  
        const order1 = await orderModel.create({
          products: [],
          buyer: user1._id,
          status: "Not Process",
        });
        const order2 = await orderModel.create({
          products: [],
          buyer: user2._id,
          status: "Shipped",
        });
  
        const req = {};
        const res = createRes();
  
        await getAllOrdersController(req, res);
  
        expect(res.json).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ _id: order1._id }),
            expect.objectContaining({ _id: order2._id }),
          ])
        );
      });

    it("should handle errors during fetching all orders", async () => {
      const originalFind = orderModel.find;
      orderModel.find = () => ({
        populate: () => ({
          populate: () => ({
            sort: () => {
              throw new Error("Database error");
            },
          }),
        }),
      });

      const req = {};
      const res = createRes();

      await getAllOrdersController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error WHile Geting Orders",
        })
      );

      orderModel.find = originalFind;
    });
  });

  describe("orderStatusController", () => {
    it("should update order status successfully", async () => {
      const order = await orderModel.create({
        products: [],
        buyer: new mongoose.Types.ObjectId(),
        status: "Not Process",
      });

      const req = {
        params: { orderId: order._id },
        body: { status: "Shipped" },
      };
      const res = createRes();

      await orderStatusController(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ _id: order._id, status: "Shipped" })
      );

      const updatedOrder = await orderModel.findById(order._id);
      expect(updatedOrder.status).toBe("Shipped");
    });

    it("should handle errors during order status update", async () => {
      const originalUpdate = orderModel.findByIdAndUpdate;
      orderModel.findByIdAndUpdate = async () => {
        throw new Error("Database error");
      };

      const req = {
        params: { orderId: new mongoose.Types.ObjectId() },
        body: { status: "Shipped" },
      };
      const res = createRes();

      await orderStatusController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While Updateing Order",
        })
      );

      orderModel.findByIdAndUpdate = originalUpdate;
    });
  });
});
