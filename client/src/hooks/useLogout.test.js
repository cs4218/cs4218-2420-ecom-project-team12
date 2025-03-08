import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";

import useLogout from "./useLogout";

import * as authContextModule from "../context/auth";

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

describe("Logout Hook Tests", () => {

  const DATA = { user: { id: 1, name: "John Doe" }, token: "12345" };

  const mockSetAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    authContextModule.useAuth = jest.fn().mockReturnValue([ DATA, mockSetAuth ]);
  });

  it("should remove auth data from localStorage upon logout", () => {
    const { result } = renderHook(() => useLogout());
    const logout = result.current;

    act(() => logout());

    expect(localStorage.removeItem).toHaveBeenCalledWith("auth");
  });

  it("should set auth data to default values upon logout", () => {
    const { result } = renderHook(() => useLogout());
    const logout = result.current;

    act(() => logout());

    expect(mockSetAuth).toHaveBeenCalledWith({ user: null, token: "" });
  });

  it("should not fail if auth data is not present", () => {
    authContextModule.useAuth = jest.fn().mockReturnValue([ null, mockSetAuth ]);

    const { result } = renderHook(() => useLogout());
    const logout = result.current;

    expect(() => act(() => logout())).not.toThrow();

    expect(mockSetAuth).toHaveBeenCalledWith({ user: null, token: "" });
    expect(localStorage.removeItem).toHaveBeenCalledWith("auth");
  });

});

