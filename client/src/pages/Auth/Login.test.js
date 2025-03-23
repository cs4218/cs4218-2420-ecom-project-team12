import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Login from "./Login";

// Mocking axios.post
jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../../hooks/useLogin", () => jest.fn(() => jest.fn()));
jest.mock("../../hooks/useLogout", () => jest.fn(() => jest.fn()));

jest.mock("../../components/Spinner", () => () => <div data-testid="spinner">Loading...</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div>{children}</div>);

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Password")).toBeInTheDocument();
  });

  it("should have inputs be initially empty", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Password").value).toBe("");
  });

  it("should allow typing email and password", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "password123" },
    });
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe(
      "test@example.com"
    );
    expect(screen.getByPlaceholderText("Enter Your Password").value).toBe(
      "password123"
    );
  });

  it("should login the user successfully", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: { id: 1, name: "John Doe", email: "test@example.com" },
        token: "mockToken",
      },
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("LOGIN"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(undefined, {
      duration: 5000,
      icon: "🙏",
      style: {
        background: "green",
        color: "white",
      },
    });
  });


  const FAILURE_CASES = [
    {
      name: "API promise resolved with server reply",
      mockAxiosPost: () => axios.post.mockResolvedValueOnce({ data: { success: false, message: "Invalid credentials (faked error)" } }),
      toastMessage: "Invalid credentials (faked error)"
    },
    {
      name: "API promise rejected with server reply",
      mockAxiosPost: () => axios.post.mockRejectedValueOnce({ response: { data: { message: "Invalid credentials (faked error)" } } }),
      toastMessage: "Invalid credentials (faked error)"
    },
    {
      name: "API promise rejected with other error",
      mockAxiosPost: () => axios.post.mockRejectedValueOnce({ message: "Unexpected issue (faked error)" }),
      toastMessage: "Something went wrong"
    }
  ];

  FAILURE_CASES.forEach(({ name, mockAxiosPost, toastMessage }) => {
    it(`should display error message on failed login where ${name}`, async () => {
      mockAxiosPost();

      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByText("LOGIN"));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith(toastMessage);
    });
  });

  it("should display Spinner to prepare redirect if user is already logged in", async () => {
    require("../../context/auth").useAuth.mockReturnValueOnce([{ token: "some-token" }, jest.fn()]);

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
  });

  it("should navigate to the forgot password page upon pressing the forgot password button", async () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<div data-testid="forgot-password">Forgot Password</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Forgot Password"));
    expect(await screen.findByTestId("forgot-password")).toBeInTheDocument();
  });

});
