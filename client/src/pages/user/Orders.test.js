import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import Orders from "./Orders";
import "@testing-library/jest-dom/extend-expect";
import { useAuth } from "../../context/auth";
import { BrowserRouter } from "react-router-dom";

//Reference: https://chatgpt.com/share/67b6281c-9c68-800a-87e0-69b311f1b889

jest.mock("axios");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/Layout", () => ({children}) => <>{children}</>);

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
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: mockOrders });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders the orders table and fetches orders", async () => {
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
      expect(screen.getByText("All Orders")).toBeInTheDocument();
      expect(screen.getByText("Processing")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Price : 100")).toBeInTheDocument();
    });
  });

  it("does not call getOrders when auth token is missing", () => {
    useAuth.mockReturnValue([{ token: "" }, jest.fn()]); 
    
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );
    expect(axios.get).not.toHaveBeenCalled();

  });



  test("displays failed payment correctly", async () => {
    axios.get.mockResolvedValue({
      data: [{ ...mockOrders[0], payment: { success: false } }],
    });

    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText("Failed")).toBeInTheDocument());
  });

  it("handles API errors gracefully", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));

    render(
      <BrowserRouter>
        <Orders />
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