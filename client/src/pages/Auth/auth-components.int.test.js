import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import HomePage from "../HomePage";
import { useAuth } from "../../context/auth";
import PrivateRoute from "../../components/Routes/Private";

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});


jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()])
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

//
// Tests for integrating: Login, Register, ForgotPassword.
// Also integrates with: Header, HomePage, Login, Register, ForgotPassword, HomePage, useLogout, useLogin.
//
describe("Auth Components Integration Tests", () => {

  let tempData = {};

  beforeEach(() => {
    jest.clearAllMocks();
    tempData = {};

    localStorage.setItem.mockImplementation((key, value) => {
      tempData[key] = value;
    });

    localStorage.getItem.mockImplementation((key) => {
      return tempData[key];
    });

    localStorage.removeItem.mockImplementation((key) => {
      delete tempData[key];
    });

    useAuth.mockImplementation(() => {
      const data = localStorage.getItem("auth");
      const setter = (value) => {
        if (value) {
          localStorage.setItem("auth", JSON.stringify(value));
        } else {
          localStorage.removeItem("auth");
        }
      }

      return [data ? JSON.parse(data) : null, setter];
    });
  });

  it("can navigate between pages", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Login")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Login"));
    expect(await screen.findByText("LOGIN FORM")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Register"));
    expect(await screen.findByText("REGISTER FORM")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Login"));
    expect(await screen.findByText("LOGIN FORM")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Forgot Password"));
    expect(await screen.findByText("FORGOT PASSWORD FORM")).toBeInTheDocument();
  });

  it("can login", async () => {
    const authData = {
      user: { id: 1, name: "John Doe", email: "test@example.com" },
      token: "mockToken"
    }

    axios.post.mockImplementationOnce(async () => {
      return {
        data: {
          success: true,
          ...authData
        }
      }
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("LOGIN FORM")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("LOGIN"));

    expect(await screen.findByText(authData.user.name)).toBeInTheDocument();

    expect(JSON.parse(localStorage.getItem("auth"))).toEqual(authData);
  });

  it("can logout", async () => {
    const authData = {
      user: { id: 1, name: "John Doe", email: "test@example.com" },
      token: "mockToken"
    }

    tempData = { auth: JSON.stringify(authData) };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByText(authData.user.name));
    fireEvent.click(await screen.findByText("Logout"));

    expect(await screen.findByText("LOGIN FORM")).toBeInTheDocument();
    expect(screen.queryByText(authData.user.name)).not.toBeInTheDocument();
  });

});
