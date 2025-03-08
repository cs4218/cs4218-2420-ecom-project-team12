import { jest } from "@jest/globals";

import React from "react";
import { act, renderHook } from "@testing-library/react";
import { useAuth, AuthProvider } from "./auth";
import axios from "axios";

jest.mock("axios", () => ({
  defaults: {
    headers: {
      common: {},
    },
  },
}));

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

describe("Auth Context and Hook Tests", () => {

    const DATA = { user: { id: 1, name: "John Doe" }, token: "12345" };

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.getItem.mockReturnValue(null);
    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it("should supply default auth context values if no past data, and configure headers appropriately", () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        const [ auth ] = result.current;

        expect(auth).toEqual({ user: null, token: "" });
        expect(axios.defaults.headers.common["Authorization"]).toBe("");
    });

    it("should retrieve auth context values from localStorage if present, and configure headers appropriately", () => {
        localStorage.getItem.mockReturnValue(JSON.stringify(DATA));

        const { result } = renderHook(() => useAuth(), { wrapper });
        const [ auth ] = result.current;

        expect(auth).toEqual(DATA);
        expect(axios.defaults.headers.common["Authorization"]).toBe(DATA.token);
    });

    it("should set auth context using input and configure headers appropriately", () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        const NEW_DATA = { user: { id: 2, name: "Alice Doe" }, token: "67890" };

        const [ , setAuth ] = result.current;
        act(() => setAuth(NEW_DATA));

        expect(axios.defaults.headers.common["Authorization"]).toBe(NEW_DATA.token);
    });

});
