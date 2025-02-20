import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";
import { useAuth } from "../../context/auth";
import "@testing-library/jest-dom";

//Reference: https://chatgpt.com/share/67b723dc-f7ec-800a-96eb-df3852989920

// Mock the useAuth hook
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../components/UserMenu", () => () => (
  <div data-testid="user-menu">UserMenu Component</div>
));

describe("Dashboard Component", () => {
  beforeEach(() => {
    useAuth.mockReturnValue([
      {
        user: {
          name: "John Doe",
          email: "johndoe@example.com",
          address: "123 Test St, City",
        },
      },
    ]);
  });

  test("renders dashboard with user details", () => {
    render(<Dashboard />);

    // Check if Layout component is rendered
    expect(screen.getByTestId("layout")).toBeInTheDocument();

    // Check if UserMenu component is rendered
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();

    // Check if user details are displayed
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("johndoe@example.com")).toBeInTheDocument();
    expect(screen.getByText("123 Test St, City")).toBeInTheDocument();
  });
});
