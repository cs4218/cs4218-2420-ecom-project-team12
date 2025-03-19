import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";

//Reference: https://chatgpt.com/share/67d9a720-d124-800a-94b4-53d9b430ad10
jest.mock("axios");

describe("Dashboard Integration Tests", () => {
  beforeEach(() => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: {
          name: "John Doe",
          email: "johndoe@example.com",
          address: "123 Test St, City",
        },
        token: "dummy-token",
      })
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("renders Dashboard with correct user details", async () => {
    render(
        <MemoryRouter>
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <Dashboard />
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        </MemoryRouter>
    );

    const headings = await screen.findAllByRole("heading", { level: 3 });
  
    expect(headings).toHaveLength(3);
    expect(headings[0]).toHaveTextContent("John Doe");
    expect(headings[1]).toHaveTextContent("johndoe@example.com");
    expect(headings[2]).toHaveTextContent("123 Test St, City");
  });

  test("renders UserMenu component inside Dashboard", async () => {
    render(
        <MemoryRouter>
            <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <Dashboard />
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
        </MemoryRouter>
    );

  
    const profileLink = await screen.findByText("Profile");
    const ordersLink = await screen.findByText("Orders");

    expect(profileLink).toBeInTheDocument();
    expect(ordersLink).toBeInTheDocument();
  });
});

