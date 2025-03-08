import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import PrivateRoute from "./Private";
import { useAuth } from "../../context/auth";
import useLogout from "../../hooks/useLogout";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";

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
