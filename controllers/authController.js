import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

import { comparePassword, hashPassword, isValidEmail, isValidPhone } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";

const trimStringValues = (obj) => {
  obj = { ...obj };
  for (let key in obj) {
    obj[key] = typeof obj[key] === 'string' ? obj[key]?.trim() : obj[key];
  }
  return obj;
}

export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = trimStringValues(req.body);

    // validations
    if (!name) {
      return res.status(400).send({ success: false, message: "Name is Required" });
    }
    if (!email) {
      return res.status(400).send({ success: false, message: "Email is Required" });
    }
    if (!password) {
      return res.status(400).send({ success: false, message: "Password is Required" });
    }
    if (!phone) {
      return res.status(400).send({ success: false, message: "Phone Number is Required" });
    }
    if (!address) {
      return res.status(400).send({ success: false, message: "Address is Required" });
    }
    if (!answer) {
      return res.status(400).send({ success: false, message: "Answer is Required" });
    }

    if (password.length < 6) {
      return res.status(400).send({ success: false, message: "Password must be at least 6 characters long" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).send({ success: false, message: "Invalid Email" });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).send({ success: false, message: "Invalid Phone Number" });
    }

    // check for existing user
    const exisitingUser = await userModel.findOne({ email });
    if (exisitingUser) {
      return res.status(400).send({
        success: false,
        message: "Already registered, please login",
      });
    }

    // register user
    const hashedPassword = await hashPassword(password);
    const user = new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      answer,
    })

    await user.save();

    res.status(201).send({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Internal server error occured during registration",
      error,
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = trimStringValues(req.body);

    // validations
    if (!email) {
      return res.status(400).send({ success: false, message: "Email is Required" });
    }

    if (!password) {
      return res.status(400).send({ success: false, message: "Password is Required" });
    }

    // login credential validations
    const user = await userModel.findOne({ email });
    const passwordMatch = user && await comparePassword(password, user.password);

    if (!user || !passwordMatch) {
      return res.status(400).send({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    // generate new token
    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // return the result
    res.status(200).send({
      success: true,
      message: "Logged in successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Internal server error occured during login",
      error,
    });
  }
};

export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = trimStringValues(req.body);

    // validations
    if (!email) {
      return res.status(400).send({ success: false, message: "Email is Required" });
    }
    if (!answer) {
      return res.status(400).send({ success: false, message: "Answer is Required" });
    }
    if (!newPassword) {
      return res.status(400).send({ success: false, message: "New Password is Required" });
    }

    // verify security question's answer
    const user = await userModel.findOne({ email, answer });
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "Wrong Email Or Answer",
      });
    }

    // update password
    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    res.status(200).send({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Internal server error occured during password reset",
      error,
    });
  }
};


export const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, address, phone } = trimStringValues(req.body);
    const user = await userModel.findById(req.user._id);
    //password
    if (password && password.length < 6) {
      return res.json({ error: "Passsword is required and 6 character long" });
    }
    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        password: hashedPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Profile Updated SUccessfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error WHile Update profile",
      error,
    });
  }
};

export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
};

export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
};

export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updateing Order",
      error,
    });
  }
};
