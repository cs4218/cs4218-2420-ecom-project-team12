import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import Orders from "./Orders";
import "@testing-library/jest-dom/extend-expect";
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";
import { BrowserRouter } from "react-router-dom";

//Reference: https://chatgpt.com/share/67dbffc1-11b4-800a-8860-f512376db5ff
//Reference: https://chatgpt.com/share/67b6281c-9c68-800a-87e0-69b311f1b889

jest.mock("axios");
const mockOrders = [
    {
      _id: "1",
      status: "Processing",
      buyer: { name: "John Doe" },
      createAt: new Date().toISOString(),
      payment: { success: true },
      products: [
        { _id: "p1", name: "Product 1", description: "Description 1", price: 100 },
      ],
    },
  ];


describe("Orders Component", () => {
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
        axios.get.mockResolvedValue({ data: mockOrders });
      });
    
    afterEach(() => {
        localStorage.clear();
    });

  test("renders the orders table and fetches orders", async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
                <CartProvider>
                    <SearchProvider>
                        <Orders />
                    </SearchProvider>
                </CartProvider>
            </AuthProvider>
      </BrowserRouter>
    );

    
    
    await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
        expect(screen.getByText("All Orders")).toBeInTheDocument();
        expect(screen.getByText("Processing")).toBeInTheDocument();
        const buyers = screen.getAllByText("John Doe");
        expect(buyers[1]).toBeInTheDocument();
        expect(screen.getByText("Product 1")).toBeInTheDocument();
        expect(screen.getByText("Price : 100")).toBeInTheDocument();
    });

  });


    test("displays failed payment correctly", async () => {
        axios.get.mockResolvedValue({
        data: [{ ...mockOrders[0], payment: { success: false } }],
        });

        render(
            <BrowserRouter>
            <AuthProvider>
                    <CartProvider>
                        <SearchProvider>
                            <Orders />
                        </SearchProvider>
                    </CartProvider>
                </AuthProvider>
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText("Failed")).toBeInTheDocument());
    });

    test("handles API errors gracefully", async () => {
        axios.get.mockRejectedValue(new Error("Network error"));

        render(
            <BrowserRouter>
                <AuthProvider>
                        <CartProvider>
                            <SearchProvider>
                                <Orders />
                            </SearchProvider>
                        </CartProvider>
                    </AuthProvider>
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("All Orders")).toBeInTheDocument();
            expect(axios.get).toHaveBeenCalled();
            const orderRows = screen.queryAllByRole("row");
            expect(orderRows.length).toBe(0);
            
            
        });
    });

  


});


