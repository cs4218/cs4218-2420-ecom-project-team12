import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import PrivateRoute from "./Private";
import { useAuth } from "../../context/auth";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Spinner from "../Spinner";

//Reference: https://chatgpt.com/share/67b70dba-5530-800a-9c05-2c8a139e4b4e

// Mock useAuth
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

// Mock axios
jest.mock("axios");

jest.mock("../Spinner", () => () => <div data-testid="spinner">Loading...</div>);

describe("PrivateRoute Component", () => {
  test("renders Outlet when user is authenticated", async () => {
    useAuth.mockReturnValue([{ token: "valid_token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    render(
      <BrowserRouter>
        <PrivateRoute />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    });
  });

  test("renders Spinner when user is not authenticated", async () => {
    useAuth.mockReturnValue([{ token: "" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: false } });

    render(
      <BrowserRouter>
        <PrivateRoute />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });
  });

  test("handles setOk(false) when API response is false", async () => {
    useAuth.mockReturnValue([{ token: "valid_token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: false } }); // Simulating API returning false

    render(
      <BrowserRouter>
        <PrivateRoute />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });
  });
});
