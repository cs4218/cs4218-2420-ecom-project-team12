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
        let randomWhitespace = () => " ".repeat(Math.floor(Math.random() * 10));
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

    // We do not exhaustively match emails w.r.t. RFC 822/5322/6532.
    // For instance, IP addresses and string escaping won't be handled.
    const VALID_EMAILS = [
      "test@example.com",         // Standard email
      "a@b.c",                    // Min characters
      "Test.Ing-mail@test.co",    // Case and some symbols does not matter
      "abc-def+ghi@x.org",        // Most symbols are allowed
      "用户@例子.ë.net",          // Internationalized emails
      "a.b.cd@bc",                // TLD-only is technically valid
    ];
    const INVALID_EMAILS = [
      // Domain and username is required
      "invalid-email",
      "invalid-email@",

      "@email.com",
      "email.com",

      // May not start and end with a dot
      "a@bc.de.",
      ".a@bc",
      "a@.bc",
      "a.@bc",

      // May not have more than one @ symbol
      "abc@@def.ghi",
      "abc@def@ghi.jkl",

      // Spaces are not allowed
      "a b @ c . d",
      "\"a b\"@c.d", // Note: Valid by RFC, but we reject it as this requires complex parsing, and there's a higher chance this is user error.
    ];

    for (let email of VALID_EMAILS) {
      test("user model is saved successfully with valid email '" + email + "'", async () => {
        await expectRequestToSucceed(withModifiedBody(req, "email", email), res);
      });
    }

    for (let email of INVALID_EMAILS) {
      test("user model is rejected and not saved for invalid email '" + email + "'", async () => {
        await expectRequestToFailWithError(
          withModifiedBody(req, "email", email), res,
          { success: false, message: "Invalid Email" }
        );
      });
    }

    // We do not exhaustively evaluate the validity of phone numbers by country.
    // Any string of 3+ digits with an optional '+' in front is considered valid.
    const VALID_PHONES = [
      "012",          // 3+ digits
      "01234567",     // 8 digits
      "1234567890",   // 10 digits
      "+11234567890", // With country code
    ];
    const INVALID_PHONES = [
      // Must be 3+ digits
      "12",

      // Brackets, dashes, spaces, and other symbols are not allowed
      "123-456-7890",
      "(123) 456-7890",
      "(123)4567890",
      "-123--456789",
      "123#45678",
      "12345*6789",
      "12345@7890",

      // Letters are not allowed
      "123456789a",
      "B123456789",
      "1234c56789",

      // + must be located at the front and appear only once max
      "1+234567890",
      "123+4567890",
      "++1234567890",
      "+1234+5678",
    ];

    for (let phone of VALID_PHONES) {
      test("user model is accepted and saved for valid phone number '" + phone + "'", async () => {
        await expectRequestToSucceed(withModifiedBody(req, "phone", phone), res);
      });
    }

    for (let phone of INVALID_PHONES) {
      test("user model is rejected and not saved for invalid phone number '" + phone + "'", async () => {
        await expectRequestToFailWithError(
          withModifiedBody(req, "phone", phone), res,
          { success: false, message: "Invalid Phone Number" }
        );
      });
    }

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
