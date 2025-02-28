import { jest } from "@jest/globals";
import { registerController,
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController} from "./authController";
import userModel from "../models/userModel";
import orderModel from "../models/orderModel";

jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");

jest.mock("../helpers/authHelper.js", () => ({
  isValidEmail: jest.fn(e => e.includes("@")),
  isValidPhone: jest.fn(p => !isNaN(+p)),
  comparePassword: jest.fn((p, hash) => btoa(p) === hash),
  hashPassword: jest.fn(x => btoa(x)),
}));


// Author: @wxwern
describe("Auth Controller Tests", () => {
  describe("Register Controller Tests", () => {
    let req, res;

    //
    // Configuration
    //
    beforeEach(() => {
      jest.clearAllMocks();
      req = {
        body: {
          name: "John Doe",
          email: "test12345678@example.com",
          password: "password123",
          phone: "12344000",
          address: "123 Street",
          answer: "Football",
        },
      };

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      userModel.findOne = jest.fn().mockResolvedValue(null);
      userModel.prototype.save = jest.fn();

    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    //
    // Helper methods
    //
    function copying(obj) {
      return JSON.parse(JSON.stringify(obj));
    }

    function withModifiedBody(obj, key, value) {
      let res = copying(obj);
      if (value === undefined) {
        delete res.body[key];
      } else {
        res.body[key] = value;
      }
      return res;
    }

    async function expectRequestToFailWithError(req, res, error) {
      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(400); // Bad Request
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, ...error })
      );
      expect(userModel.prototype.save).not.toHaveBeenCalled();
    }

    async function expectRequestToSucceedWithUser(req, res, target) {
      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(201); // Created
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "User registered successfully" })
      );
      expect(userModel.prototype.save).toHaveBeenCalled();

      if (target) {
        delete target.password; // bcrypt hashes are not deterministic
        expect(userModel).toHaveBeenCalledWith(expect.objectContaining(target));
      }
    }

    async function expectRequestToSucceed(req, res) {
      await expectRequestToSucceedWithUser(req, res, null);
    }

    //
    // Tests all fields must be present
    //
    // Factor with 4 levels: empty, string-empty, string-whitespace-empty, valid
    //
    test("user model is saved successfully with all non-empty valid inputs", async () => {
      await expectRequestToSucceedWithUser(req, res, req.body);
    });

    const EMPTY_CASES = [
      [undefined, "missing"], ["", "empty"], ["   ", "whitespace-only"]
    ];

    for (let c of EMPTY_CASES) {
      const [empty, description] = c;
      test("user model is rejected and not saved for " + description + " name", async () => {
        await expectRequestToFailWithError(
          withModifiedBody(req, "name", empty), res,
          { success: false, message: "Name is Required" }
        );
      });

      test("user model is rejected and not saved for " + description + " email", async () => {
        await expectRequestToFailWithError(
          withModifiedBody(req, "email", empty), res,
          { success: false, message: "Email is Required" }
        );
      });

      test("user model is rejected and not saved for " + description + " password", async () => {
        await expectRequestToFailWithError(
          withModifiedBody(req, "password", empty), res,
          { success: false, message: "Password is Required" }
        );
      });

      test("user model is rejected and not saved for " + description + " phone", async () => {
        await expectRequestToFailWithError(
          withModifiedBody(req, "phone", empty), res,
          { success: false, message: "Phone Number is Required" }
        );
      });

      test("user model is rejected and not saved for " + description + " address", async () => {
        await expectRequestToFailWithError(
          withModifiedBody(req, "address", empty), res,
          { success: false, message: "Address is Required" }
        );
      });

      test("user model is rejected and not saved for " + description + " answer", async () => {
        await expectRequestToFailWithError(
          withModifiedBody(req, "answer", empty), res,
          { success: false, message: "Answer is Required" }
        );
      });
    }


    //
    // Automated whitespace cleanup tests
    //
    // Extraneous whitespace should be trimmed from all fields.
    //
    test("user model is saved successfully with all whitespace trimmed", async () => {
      // Track the original input for comparison
      let cleanedInput = copying(req.body);
      delete cleanedInput.password;

      // Prepare a random whitespace-padded input
      for (let key in req.body) {
        let randomWhitespace = () => " ".repeat(Math.ceil(Math.random() * 10));
        req.body[key] = randomWhitespace() + req.body[key] + randomWhitespace();
      }

      // Ensure the input succeeds with the cleaned up instance.
      await expectRequestToSucceedWithUser(req, res, cleanedInput);
    });

    //
    // Duplicate user tests
    //
    // Users must have unique email addresses.
    //
    test("user model is rejected and not saved for existing email", async () => {
      userModel.findOne = jest.fn().mockResolvedValue({
        name: "Dummy User",
        email: req.body.email,
      });

      await expectRequestToFailWithError(req, res, {
        success: false,
        message: "Already registered, please login",
      });
    });



    //
    // Input parsing tests
    //

    test("user model is saved successfully with valid email", async () => {
      let email = "valid@example.com" // mocked condition: valid if includes "@"
      await expectRequestToSucceed(withModifiedBody(req, "email", email), res);
    });

    test("user model is rejected and not saved for invalid email", async () => {
      let email = "invalid-email" // mocked condition: invalid if does not include "@"
      await expectRequestToFailWithError(
        withModifiedBody(req, "email", email), res,
        { success: false, message: "Invalid Email" }
      );
    });

    test("user model is accepted and saved for valid phone number", async () => {
      let phone = "12345678" // mocked condition: valid if number
      await expectRequestToSucceed(withModifiedBody(req, "phone", phone), res);
    });

    test("user model is rejected and not saved for invalid phone number", async () => {
      let phone = "invalid-phone" // mocked condition: invalid if not number
      await expectRequestToFailWithError(
        withModifiedBody(req, "phone", phone), res,
        { success: false, message: "Invalid Phone Number" }
      );
    });

  });
});




// Author: @thennant
// Reference: https://chatgpt.com/share/67b6deef-c3d8-800a-91ea-dba30aa9eb41

describe("Auth Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.findById = jest.fn().mockResolvedValue({ _id: "123", name: "Old Name", phone: "1234567890" });
    userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: "123", name: "Updated Name", phone: "9876543210" });
    userModel.prototype.save = jest.fn().mockResolvedValue({});

    orderModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([{ _id: "order1" }, { _id: "order2" }]),
      }),
    });

    orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: "order123", status: "Shipped" });

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
