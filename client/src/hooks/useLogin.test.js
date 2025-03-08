import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";

import useLogin from "./useLogin";

import * as authContextModule from "../context/auth";

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

describe("Login Hook Tests", () => {

  const LOGIN_DATA = { user: { id: 1, name: "John Doe" }, token: "12345" };
  const ALT_DATA = { user: { id: 2, name: "Alice Doe" }, token: "67890" };

  const mockSetAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    authContextModule.useAuth = jest.fn().mockReturnValue([ null, mockSetAuth ]);
  });

  it("should set auth data to input upon login", () => {
    const { result } = renderHook(() => useLogin());
    const login = result.current;

    act(() => login(LOGIN_DATA.user, LOGIN_DATA.token));

    expect(mockSetAuth).toHaveBeenCalledWith(LOGIN_DATA);
  });

  it("should save auth data to localStorage upon login", () => {
    const { result } = renderHook(() => useLogin());
    const login = result.current;

    act(() => login(LOGIN_DATA.user, LOGIN_DATA.token));

    expect(localStorage.setItem).toHaveBeenCalledWith("auth", JSON.stringify(LOGIN_DATA));
  });

  it("should not fail if auth data is already present", () => {
    authContextModule.useAuth = jest.fn().mockReturnValue([ ALT_DATA, mockSetAuth ]);

    const { result } = renderHook(() => useLogin());
    const login = result.current;

    expect(() => act(() => login(LOGIN_DATA.user, LOGIN_DATA.token))).not.toThrow();

    expect(mockSetAuth).toHaveBeenCalledWith(LOGIN_DATA);
    expect(localStorage.setItem).toHaveBeenCalledWith("auth", JSON.stringify(LOGIN_DATA));
  });

});

