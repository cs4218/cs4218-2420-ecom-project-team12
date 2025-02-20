import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Profile from "./Profile";
import "@testing-library/jest-dom/extend-expect";
import { useAuth } from "../../context/auth";
import axios from "axios";
import toast from "react-hot-toast";


//Reference: https://chatgpt.com/share/67b61379-1a48-800a-8768-beb741b2f102


jest.mock("../../context/auth", () => ({
  useAuth: jest.fn()
}));

jest.mock("axios");

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn()
}));

jest.mock("../../components/Layout", () => ({children}) => <>{children}</>);

describe("Profile Component", () => {
  let mockSetAuth;

  beforeEach(() => {
    mockSetAuth = jest.fn();
    useAuth.mockReturnValue([
      {
        user: {
          name: "John Doe",
          email: "john@example.com",
          phone: "1234567890",
          address: "123 Street, City"
        }
      },
      mockSetAuth
    ]);
    jest.clearAllMocks();
    axios.put.mockReset();
  });

  test("renders Profile component with user data", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("Enter Your Name")).toHaveValue("John Doe");
    expect(screen.getByPlaceholderText("Enter Your Email")).toHaveValue("john@example.com");
    expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue("1234567890");
    expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue("123 Street, City");
  });

  test("updates input values when typed", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText("Enter Your Name");
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    expect(nameInput).toHaveValue("Jane Doe");
  });

  test("submits the form and updates profile successfully", async () => {
    axios.put.mockResolvedValue({
      data: {
        updatedUser: {
          name: "Jane Doe",
          email: "john@example.com",
          phone: "9876543210",
          address: "456 Avenue, City"
        }
      }
    });
    
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), { target: { value: "456 Avenue, City" } });

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", expect.objectContaining({
        name: "Jane Doe",
        email: "john@example.com",
        phone: "9876543210",
        address: "456 Avenue, City"
      }));
    });
    
  });

  test("triggers toast.error when incorrect data is submitted", async () => {
    axios.put.mockResolvedValue({ data: { error: "Incorrect data provided" } });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Incorrect data provided");
    });
  });

  test("ensures password and email inputs behave correctly", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
    const emailInput = screen.getByPlaceholderText("Enter Your Email");
    expect(emailInput).toBeDisabled();

    const passwordInput = screen.getByPlaceholderText("Enter Your Password");
    fireEvent.change(passwordInput, { target: { value: "newpassword" } });
    expect(passwordInput).toHaveValue("newpassword");
  });

  test("allows password update only if email is correct", async () => {
    axios.put.mockResolvedValue({
      data: { error: "Email does not match records" }
    });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), { target: { value: "newpassword" } });
    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email does not match records");
    });
  });

  test("email input does not update when changed", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("Enter Your Email");
    fireEvent.change(emailInput, { target: { value: "newemail@example.com" } });
    expect(emailInput).toBeDisabled();
  });

  test("shows error message when API request fails", async () => {
    axios.put.mockRejectedValue(new Error("Network error"));

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("handles form submission with missing fields", async () => {
    axios.put.mockResolvedValue({ data: { error: "Missing fields" } });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Missing fields");
    });
  });

});