import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Profile from "./Profile";
import "@testing-library/jest-dom/extend-expect";
import { useAuth } from "../../context/auth";
import axios from "axios";
import toast from "react-hot-toast";


jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

jest.mock("axios");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

describe("Profile Component", () => {
  beforeEach(() => {
    useAuth.mockReturnValue([
      { user: { name: "CS 4218 Test Account", 
        email: "cs4218@test.com", 
        password: "", 
        phone: "81234567", 
        address: "1 Computing Drive" } },
      jest.fn(),
    ]);
    jest.clearAllMocks();
    axios.put.mockReset();
  });

  it("renders the Profile component with initial values", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
    
    expect(screen.getByText("USER PROFILE")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Name").value).toBe("CS 4218 Test Account");
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe("cs4218@test.com");
    expect(screen.getByPlaceholderText("Enter Your Password").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe("81234567");
    expect(screen.getByPlaceholderText("Enter Your Address").value).toBe("1 Computing Drive");
  });

  it("allows changes in fields", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
    const nameInput = screen.getByPlaceholderText("Enter Your Name");
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    expect(nameInput.value).toBe("Jane Doe");

    const phoneInput = screen.getByPlaceholderText("Enter Your Phone");
    fireEvent.change(phoneInput, { target: { value: "9876543210" } });
    expect(phoneInput.value).toBe("9876543210");

    const addressInput = screen.getByPlaceholderText("Enter Your Address");
    fireEvent.change(addressInput, { target: {value: "5 Science Drive"}});
    expect(addressInput.value).toBe("5 Science Drive");

  });

  it("submits form and update user profile", async() => {
    axios.put.mockResolvedValue({
      data: { updatedUser: { name: "Jane Doe", email: "cs4218@test.com", phone: "9876543210", address: "456 Avenue" } }
    });
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText("Enter Your Name");
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    
    const phoneInput = screen.getByPlaceholderText("Enter Your Phone");
    fireEvent.change(phoneInput, { target: { value: "9876543210" } });
    
    const addressInput = screen.getByPlaceholderText("Enter Your Address");
    fireEvent.change(addressInput, { target: {value: "456 Avenue"}});
    
    fireEvent.click(screen.getByText("UPDATE"));
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        name: "Jane Doe",
        email: "cs4218@test.com",
        password: "",
        phone: "9876543210",
        address: "456 Avenue",
      });
    });
  
  });


  it("handles form submission error", async () => {
    axios.put.mockRejectedValue(new Error("Network Error"));

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("UPDATE"));
    
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });

  });
  
});


