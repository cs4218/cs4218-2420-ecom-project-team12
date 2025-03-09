import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Register from "./Register";

// Mocking axios.post
jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));
jest.mock("../../hooks/useLogin", () => jest.fn(() => jest.fn()));
jest.mock("../../hooks/useLogout", () => jest.fn(() => jest.fn()));

jest.mock("../../components/Spinner", () => () => <div data-testid="spinner">Loading...</div>);

describe("Register Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders register form", () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("REGISTER FORM")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Phone")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your DOB")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("What is Your Favorite sports")).toBeInTheDocument();
    expect(screen.getByText("REGISTER")).toBeInTheDocument();
  });

  it("should have inputs be initially empty", () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("REGISTER FORM")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Name").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Password").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Address").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your DOB").value).toBe("");
    expect(screen.getByPlaceholderText("What is Your Favorite sports").value).toBe("");
  });

  it("should allow user to fill the form", () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "123 Street" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your DOB"), {
      target: { value: "2000-01-01" },
    });
    fireEvent.change(screen.getByPlaceholderText("What is Your Favorite sports"), {
      target: { value: "Football" },
    });

    expect(screen.getByPlaceholderText("Enter Your Name").value).toBe("John Doe");
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe("test@example.com");
    expect(screen.getByPlaceholderText("Enter Your Password").value).toBe("password123");
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe("1234567890");
    expect(screen.getByPlaceholderText("Enter Your Address").value).toBe("123 Street");
    expect(screen.getByPlaceholderText("Enter Your DOB").value).toBe("2000-01-01");
    expect(screen.getByPlaceholderText("What is Your Favorite sports").value).toBe("Football");
  });


  it("should register the user successfully", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "123 Street" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your DOB"), {
      target: { value: "2000-01-01" },
    });
    fireEvent.change(screen.getByPlaceholderText("What is Your Favorite sports"), {
      target: { value: "Football" },
    });

    fireEvent.click(screen.getByText("REGISTER"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(
      "Registered successfully, please login"
    );
  });


  const FAILURE_CASES = [
    {
      name: "API promise resolved with server reply",
      mockAxiosPost: () => axios.post.mockResolvedValueOnce({ data: { success: false, message: "User already exists (faked error)" } }),
      toastMessage: "User already exists (faked error)"
    },
    {
      name: "API promise rejected with server reply",
      mockAxiosPost: () => axios.post.mockRejectedValueOnce({ response: { data: { message: "User already exists (faked error)" } } }),
      toastMessage: "User already exists (faked error)"
    },
    {
      name: "API promise rejected with other error",
      mockAxiosPost: () => axios.post.mockRejectedValueOnce({ message: "Unexpected issue (faked error)" }),
      toastMessage: "Something went wrong"
    }
  ];

  FAILURE_CASES.forEach(({ name, mockAxiosPost, toastMessage }) => {
    it(`should display error message on failed registration where ${name}`, async () => {
      mockAxiosPost();

      render(
        <MemoryRouter initialEntries={["/register"]}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );
      fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
        target: { value: "John Doe" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
        target: { value: "1234567890" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
        target: { value: "123 Street" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter Your DOB"), {
        target: { value: "2000-01-01" },
      });
      fireEvent.change(screen.getByPlaceholderText("What is Your Favorite sports"), {
        target: { value: "Football" },
      });

      fireEvent.click(screen.getByText("REGISTER"));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith(toastMessage);
    });
  });

  it("should display Spinner to prepare redirect if user is already logged in", async () => {
    require("../../context/auth").useAuth.mockReturnValueOnce([{ token: "some-token" }, jest.fn()]);

    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
  });

});
