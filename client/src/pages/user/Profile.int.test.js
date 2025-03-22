import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "./Profile";
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";

//Reference: https://chatgpt.com/share/67d9a720-d124-800a-94b4-53d9b430ad10
//Reference: https://chatgpt.com/share/67b61379-1a48-800a-8768-beb741b2f102

jest.mock("react-hot-toast", () => ({
    error: jest.fn(),
    success: jest.fn()
}));

jest.mock("../../components/Layout", () => ({children}) => <>{children}</>);

describe("Profile Integration Tests", () => {
  beforeEach(() => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: {
          name: "John Doe",
          email: "johndoe@example.com",
          phone: "1234567890",
          address: "123 Test St, City",
        },
        token: "dummy-token", 
      })
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("renders Profile with correct user details", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Profile />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("Enter Your Name")).toHaveValue("John Doe");
    expect(screen.getByPlaceholderText("Enter Your Email")).toHaveValue("johndoe@example.com");
    expect(screen.getByPlaceholderText("Enter Your Password")).toHaveValue("");
    expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue("1234567890");
    expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue("123 Test St, City");
  });

  test("updates input values when typed", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Profile />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText("Enter Your Name");
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    expect(nameInput).toHaveValue("Jane Doe");
  });

  test("submits the form and updates profile successfully", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Profile />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), { target: { value: "456 Avenue, City" } });

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter Your Name")).toHaveValue("Jane Doe");
      expect(screen.getByPlaceholderText("Enter Your Email")).toHaveValue("johndoe@example.com");
      expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue("9876543210");
      expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue("456 Avenue, City");
    });
  });

  test("email input does not update when changed", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Profile />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("Enter Your Email");
    fireEvent.change(emailInput, { target: { value: "newemail@example.com" } });
    expect(emailInput).toBeDisabled();
  });

  test("shows error message when API request fails", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Profile />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

});
