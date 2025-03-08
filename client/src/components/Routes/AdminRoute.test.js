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

  test("renders only Outlet when user is admin", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockImplementation(SUCCESS_RESOLVE);

    render(
      <MemoryRouter>
        <AdminRoute />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByTestId("spinner")).not.toBeInTheDocument());
    expect(axios.get).toHaveBeenCalled();
  });

  test("renders only Spinner when user is not logged in", async () => {
    useAuth.mockReturnValue([{ token: "" }, jest.fn()]);
    axios.get.mockImplementation(FAILURE_RESOLVE);

    render(
      <MemoryRouter>
        <AdminRoute />
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
        <AdminRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalled();
  });

  test("renders only Spinner when API response returns error", async () => {
    useAuth.mockReturnValue([{ token: "invalid-token" }, jest.fn()]);
    axios.get.mockImplementation(FAILURE_REJECT);

    render(
      <MemoryRouter>
        <AdminRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalled();
  });

  test("renders only Spinner when API response fails", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockRejectedValue(UNEXPECTED_ERROR_REJECT);

    render(
      <MemoryRouter>
        <AdminRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalled();
  });

  test("does not attempt to prepare to logout", async () => {
    useAuth.mockReturnValue([{ token: "token" }, jest.fn()]);

    [ FAILURE_RESOLVE, FAILURE_REJECT, UNEXPECTED_ERROR_REJECT ].forEach(async (mock) => {
      axios.get.mockImplementation(mock);

      render(
        <MemoryRouter>
          <AdminRoute />
        </MemoryRouter>
      );

      expect(useLogout).not.toHaveBeenCalled();
    });
  });


});
