import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import ForgotPassword from "./ForgotPassword";

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

describe("ForgotPassword Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders forgot password form", () => {
    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("FORGOT PASSWORD FORM")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("What is Your Favorite sports")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your New Password")).toBeInTheDocument();
    expect(screen.getByText("RESET")).toBeInTheDocument();
  });

  it("should have inputs be initially empty", () => {
    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe("");
    expect(screen.getByPlaceholderText("What is Your Favorite sports").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your New Password").value).toBe("");
  });

  it("should allow user to fill the form", () => {
    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("What is Your Favorite sports"), {
      target: { value: "Football" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your New Password"), {
      target: { value: "password123" },
    });

    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe("test@example.com");
    expect(screen.getByPlaceholderText("What is Your Favorite sports").value).toBe("Football");
    expect(screen.getByPlaceholderText("Enter Your New Password").value).toBe("password123");
  });

  it("should allow a reset successfully", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, message: "Password reset successfully" } });

    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("What is Your Favorite sports"), {
      target: { value: "Football" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your New Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByText("RESET"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("Reset successfully, please login");
  });

  const FAILURE_CASES = [
    {
      name: "API promise resolved with server reply",
      mockAxiosPost: () => axios.post.mockResolvedValueOnce({ data: { success: false, message: "Invalid answer (faked error)" } }),
      toastMessage: "Invalid answer (faked error)"
    },
    {
      name: "API promise rejected with server reply",
      mockAxiosPost: () => axios.post.mockRejectedValueOnce({ response: { data: { message: "Invalid answer (faked error)" } } }),
      toastMessage: "Invalid answer (faked error)"
    },
    {
      name: "API promise rejected with other error",
      mockAxiosPost: () => axios.post.mockRejectedValueOnce({ message: "Unexpected issue (faked error)" }),
      toastMessage: "Something went wrong"
    }
  ];

  FAILURE_CASES.forEach(({ name, mockAxiosPost, toastMessage }) => {
    it(`should display error message on failed reset where ${name}`, async () => {
      mockAxiosPost();

      render(
        <MemoryRouter initialEntries={["/forgot-password"]}>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </MemoryRouter>
      );      fireEvent.click(screen.getByText("RESET"));

      fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("What is Your Favorite sports"), {
        target: { value: "Football" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your New Password"), {
        target: { value: "password123" },
      });

      fireEvent.click(screen.getByText("RESET"));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith(toastMessage);
    });
  });

  it("should display Spinner to prepare redirect if user is already logged in", async () => {
    require("../../context/auth").useAuth.mockReturnValueOnce([{ token: "some-token" }, jest.fn()]);

    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
  });

});

