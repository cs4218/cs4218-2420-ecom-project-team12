import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import AdminRoute from "./AdminRoute";
import { useAuth } from "../../context/auth";
import useLogout from "../../hooks/useLogout";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";

//
// Author: @wxwern
//
// Dev note: Tests are similar to and the one in Private.test.js, but without logging out
//

jest.mock("../../hooks/useLogout", () => jest.fn());
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("axios");

jest.mock("../Spinner", () => () => <div data-testid="spinner">Loading...</div>);

describe("AdminRoute Component", () => {

  const SUCCESS_RESOLVE = async () => ({ data: { ok: true } });
  const FAILURE_RESOLVE = async () => ({ data: { ok: false } });
  const ERROR_REJECT = async () => { throw new Error("Expected error thrown in unit test") };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders only Outlet when user is admin", async () => {
    useAuth.mockReturnValue([{ token: "valid_token" }, jest.fn()]);
    axios.get.mockImplementation(SUCCESS_RESOLVE);

    render(
      <MemoryRouter>
        <AdminRoute />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByTestId("spinner")).not.toBeInTheDocument());
  });

  test("renders only Spinner when user is not admin", async () => {
    useAuth.mockReturnValue([{ token: "" }, jest.fn()]);
    axios.get.mockImplementation(FAILURE_RESOLVE);

    render(
      <MemoryRouter>
        <AdminRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
  });

  test("renders only Spinner when user token is not valid", async () => {
    useAuth.mockReturnValue([{ token: "invalid-token" }, jest.fn()]);
    axios.get.mockImplementation(FAILURE_RESOLVE);

    render(
      <MemoryRouter>
        <AdminRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
  });

  test("renders only Spinner when API response fails", async () => {
    useAuth.mockReturnValue([{ token: "valid_token" }, jest.fn()]);
    axios.get.mockRejectedValue(ERROR_REJECT);

    render(
      <MemoryRouter>
        <AdminRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
  });

  test("does not attempt to prepare to logout", async () => {
    useAuth.mockReturnValue([{ token: "" }, jest.fn()]);
    axios.get.mockImplementation(FAILURE_RESOLVE);

    render(
      <MemoryRouter>
        <AdminRoute />
      </MemoryRouter>
    );

    expect(useLogout).not.toHaveBeenCalled();
  });


});
