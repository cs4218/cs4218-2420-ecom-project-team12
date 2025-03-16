import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import PrivateRoute from "./Private";
import { useAuth } from "../../context/auth";
import useLogout from "../../hooks/useLogout";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import { test, expect } from '@playwright/test';

//
// Authors:
// - @thennant with reference https://chatgpt.com/share/67b70dba-5530-800a-9c05-2c8a139e4b4e
// - @wxwern
//

jest.mock("../../hooks/useLogout", () => jest.fn(() => jest.fn()));
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("axios");

jest.mock("../Spinner", () => () => <div data-testid="spinner">Loading...</div>);

describe("PrivateRoute Component", () => {

  //
  // Author: @wxwern
  //
  const SUCCESS_RESOLVE = async () => ({ status: 200, data: { ok: true } });
  const FAILURE_RESOLVE = async () => ({ status: 200, data: { ok: false } });
  const FAILURE_REJECT = async () => {
    const err = new Error("Expected error thrown in unit test");
    err.response = {};
    err.response.status = 401;
    throw err;
  }
  const UNEXPECTED_ERROR_REJECT = async () => {
    throw new Error("Expected error thrown in unit test");
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //
  // Authors: @thennant, @wxwern
  //
  test("renders only Outlet when user is authenticated", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockImplementation(SUCCESS_RESOLVE);

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByTestId("spinner")).not.toBeInTheDocument());
  });

  test("renders only Spinner when user is not authenticated", async () => {
    useAuth.mockReturnValue([{ token: "" }, jest.fn()]);
    axios.get.mockImplementation(FAILURE_RESOLVE);

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });

  test("renders only Spinner when API response returns not OK", async () => {
    useAuth.mockReturnValue([{ token: "invalid-token" }, jest.fn()]);
    axios.get.mockImplementation(FAILURE_RESOLVE);

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
  });

  //
  // Author: @wxwern
  //
  test("renders only Spinner when API response returns error", async () => {
    useAuth.mockReturnValue([{ token: "invalid-token" }, jest.fn()]);
    axios.get.mockImplementation(FAILURE_REJECT);

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
  });

  test("renders only Spinner when API unexpectedly fails", async () => {
    useAuth.mockReturnValue([{ token: "invalid-token" }, jest.fn()]);
    axios.get.mockRejectedValue(UNEXPECTED_ERROR_REJECT);

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
  });

  test("should not invoke a client-side logout when user is authenticated", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockImplementation(SUCCESS_RESOLVE);

    const logout = jest.fn();
    useLogout.mockReturnValue(logout);

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByTestId("spinner")).not.toBeInTheDocument()); // wait for axios to resolve
    expect(logout).not.toHaveBeenCalled();
  });

  test("should not invoke a client-side logout when API unexpectedly fails", async () => {
    useAuth.mockReturnValue([{ token: "token" }, jest.fn()]);
    axios.get.mockRejectedValue(UNEXPECTED_ERROR_REJECT);

    const logout = jest.fn();
    useLogout.mockReturnValue(logout);

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument(); // wait for axios to resolve
    expect(logout).not.toHaveBeenCalled();
  });

  test("should invoke a client-side logout when API returns not OK", async () => {
    useAuth.mockReturnValue([{ token: "token" }, jest.fn()]);
    axios.get.mockImplementation(FAILURE_RESOLVE);

    const logout = jest.fn();
    useLogout.mockReturnValue(logout);

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument(); // wait for axios to resolve
    expect(logout).toHaveBeenCalled();
  });

  test("should invoke a client-side logout when API returns error", async () => {

    useAuth.mockReturnValue([{ token: "token" }, jest.fn()]);
    axios.get.mockImplementation(FAILURE_REJECT);

    const logout = jest.fn();
    useLogout.mockReturnValue(logout);

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument(); // wait for axios to resolve
    expect(logout).toHaveBeenCalled();
  });

});

//Author:@thennant with reference: https://chatgpt.com/share/67d6c293-bf18-800a-a3f0-8963ba9dc691
describe("Integration tests for authenticated routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    
    axios.get.mockImplementation(() =>
      Promise.resolve({ status: 200, data: { ok: true } })
    );
  });

  // Dummy components to simulate the dashboard pages
  const DashboardUser = () => <div>Dashboard User</div>;
  const UserProfile = () => <div>User Profile</div>;
  const UserOrders = () => <div>User Orders</div>;

  // A simple App component that uses PrivateRoute to guard the dashboard routes
  const App = () => (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard/user" element={<DashboardUser />} />
        <Route path="/dashboard/user/profile" element={<UserProfile />} />
        <Route path="/dashboard/user/orders" element={<UserOrders />} />
      </Route>
      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  );

  test("authenticated user can access /dashboard/user", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/user"]}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByText("Dashboard User")).toBeInTheDocument()
    );
  });

  test("authenticated user can access /dashboard/user/profile", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByText("User Profile")).toBeInTheDocument()
    );
  });

  test("authenticated user can access /dashboard/user/orders", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/user/orders"]}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByText("User Orders")).toBeInTheDocument()
    );
  });

  test("authenticated user remains logged in after page refresh", async () => {
    
    const { unmount } = render(
      <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByText("User Profile")).toBeInTheDocument()
    );

    unmount();
    render(
      <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByText("User Profile")).toBeInTheDocument()
    );
  });
});

//author:@thennant with reference: https://chatgpt.com/share/67d6c293-bf18-800a-a3f0-8963ba9dc691
describe("UI tests for authenticated routes", () => {
  test.describe('Authenticated User Dashboard Access', () => {
    
    test.beforeEach(async ({ page }) => {
      
      await page.goto('http://localhost:3000');
      
      await page.evaluate(() => {
        localStorage.setItem('token', 'valid-token');
      });
    });
  
    test('authenticated user can access /dashboard/user', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/user');
      
      await expect(page.locator('text=Dashboard User')).toBeVisible();
    });
  
    test('authenticated user can access /dashboard/user/profile', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/user/profile');
      await expect(page.locator('text=User Profile')).toBeVisible();
    });
  
    test('authenticated user can access /dashboard/user/orders', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/user/orders');
      await expect(page.locator('text=User Orders')).toBeVisible();
    });
  
    test('authenticated user remains logged in after page refresh', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/user/profile');
      await expect(page.locator('text=User Profile')).toBeVisible();
      
      await page.reload();
      await expect(page.locator('text=User Profile')).toBeVisible();
    });
  });


});