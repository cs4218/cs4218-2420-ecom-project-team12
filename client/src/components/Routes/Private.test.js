import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import PrivateRoute from "./Private";
import { useAuth } from "../../context/auth";
import useLogout from "../../hooks/useLogout";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";

//
// Author: @thennant with reference https://chatgpt.com/share/67b70dba-5530-800a-9c05-2c8a139e4b4e
//
// Cleaned up and updated by: @wxwern
//

jest.mock("../../hooks/useLogout", () => {
  const inner = jest.fn(() => {});
  const outer = jest.fn(() => inner);
  outer.inner = inner;
  return outer;
});
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("axios");

jest.mock("../Spinner", () => () => <div data-testid="spinner">Loading...</div>);

describe("PrivateRoute Component", () => {

  //
  // Author: @wxwern
  //
  const SUCCESS_RESOLVE = async () => ({ data: { ok: true } });
  const FAILURE_RESOLVE = async () => ({ data: { ok: false } });
  const ERROR_REJECT = async () => { throw new Error("Expected error thrown in unit test") };

  beforeEach(() => {
    jest.clearAllMocks();
  });


  //
  // Author: @thennant
  //
  test("renders only Outlet when user is authenticated", async () => {
    useAuth.mockReturnValue([{ token: "valid_token" }, jest.fn()]);
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
  });



  //
  // Author: @wxwern
  //
  test("renders only Spinner when user token is invalid", async () => {
    useAuth.mockReturnValue([{ token: "invalid-token" }, jest.fn()]);
    axios.get.mockImplementation(FAILURE_RESOLVE);

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
  });

  test("renders only Spinner when API response fails", async () => {
    useAuth.mockReturnValue([{ token: "valid_token" }, jest.fn()]);
    axios.get.mockRejectedValue(ERROR_REJECT);

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
  });


  test("should not invoke a client-side logout when user is authenticated", async () => {

    useAuth.mockReturnValue([{ token: "valid_token" }, jest.fn()]);
    axios.get.mockImplementation(SUCCESS_RESOLVE);

    const logout = jest.fn();
    useLogout.mockImplementation(() => {console.log("AAAAA"); return logout});

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByTestId("spinner")).not.toBeInTheDocument()); // wait for axios to resolve
    expect(logout).not.toHaveBeenCalled();
  });

  test("should invoke a client-side logout when user token is invalid", async () => {

    useAuth.mockReturnValue([{ token: "invalid-token" }, jest.fn()]);
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

  test("should invoke a client-side logout when API response fails", async () => {

    useAuth.mockReturnValue([{ token: "valid_token" }, jest.fn()]);
    axios.get.mockRejectedValue(ERROR_REJECT);

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
