import { jest } from "@jest/globals";
import { registerController, 
  updateProfileController, 
  getOrdersController, 
  getAllOrdersController, 
  orderStatusController} from "./authController";
import userModel from "../models/userModel";
import orderModel from "../models/orderModel";

//Reference: https://chatgpt.com/share/67b6deef-c3d8-800a-91ea-dba30aa9eb41

jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");

// describe("Register Controller Test", () => {
//   let req, res;

//   beforeEach(() => {
//     jest.clearAllMocks();
//     req = {
//       body: {
//         name: "John Doe",
//         email: "invalid-email",
//         password: "password123",
//         phone: "12344000",
//         address: "123 Street",
//         answer: "Football",
//       },
//     };

//     res = {
//       status: jest.fn().mockReturnThis(),
//       send: jest.fn(),
//     };
//   });

//   test("user model is not saved for invalid email", async () => {
//     // specify mock functionality
//     userModel.findOne = jest.fn().mockResolvedValue(null);
//     userModel.prototype.save = jest.fn();

//     await registerController(req, res);
//     expect(userModel.prototype.save).not.toHaveBeenCalled();
//   });
// });


describe("Auth Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = { user: { _id: "123" }, body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });
  

  describe("updateProfileController", () => {
    test("should update user profile successfully", async () => {
      req.body = { name: "Updated Name", phone: "9876543210" };
      userModel.findById = jest.fn().mockResolvedValue({ _id: "123", name: "Old Name", phone: "1234567890" });
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: "123", name: "Updated Name", phone: "9876543210" });

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("123", expect.any(Object), { new: true });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Profile Updated SUccessfully" }));
    });

    test("should return error if password is less than 6 characters", async () => {
      req.body = { password: "12345" };

      await updateProfileController(req, res);

      expect(res.json).toHaveBeenCalledWith({ error: "Passsword is required and 6 character long" });
    });

    test("should handle error during profile update", async () => {
      req.body = { name: "Updated Name" };
      userModel.findById = jest.fn().mockRejectedValue(new Error("Database error"));

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Error WHile Update profile" }));
    });
  });

  describe("getOrdersController", () => {
    test("should return user orders", async () => {
      const orders = [{ _id: "order1" }, { _id: "order2" }];
      orderModel.find = jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(orders) }) });

      await getOrdersController(req, res);

      expect(orderModel.find).toHaveBeenCalledWith({ buyer: "123" });
      expect(res.json).toHaveBeenCalledWith(orders);
    });

    test("should handle error during fetching orders", async () => {
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error("Database error")),
        }),
      });

      await getOrdersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Error WHile Geting Orders" }));
    });
    

  });

  describe("getAllOrdersController", () => {
    test("should return all orders", async () => {
      const orders = [{ _id: "order1" }, { _id: "order2" }];
      orderModel.find = jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(orders) }) }) });

      await getAllOrdersController(req, res);

      expect(orderModel.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith(orders);
    });

    test("should handle error during fetching orders", async () => {
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error("Database error")),
          }),
        }),
      });
    
      await getAllOrdersController(req, res);
    
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Error WHile Geting Orders" }));
      
    });
  });

  describe("orderStatusController", () => {
    test("should update order status", async () => {
      req.params.orderId = "order123";
      req.body.status = "Shipped";
      orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: "order123", status: "Shipped" });

      await orderStatusController(req, res);

      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith("order123", { status: "Shipped" }, { new: true });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ _id: "order123", status: "Shipped" }));
    });

    test("should handle error during order status update", async () => {
      req.params.orderId = "order123";
      req.body.status = "Shipped";
      orderModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error("Database error"));

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Error While Updateing Order" }));
    });
  });
});
