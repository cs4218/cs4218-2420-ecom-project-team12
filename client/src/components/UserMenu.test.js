import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserMenu from "./UserMenu";
import "@testing-library/jest-dom/extend-expect";

//Reference: https://chatgpt.com/share/67b721dd-5858-800a-9fe1-c7dbe553259e

describe("UserMenu Component", () => {
  test("renders UserMenu with Dashboard title", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  test("renders navigation links", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    // Check Profile link
    const profileLink = screen.getByText("Profile");
    expect(profileLink).toBeInTheDocument();
    expect(profileLink.closest("a")).toHaveAttribute("href", "/dashboard/user/profile");

    // Check Orders link
    const ordersLink = screen.getByText("Orders");
    expect(ordersLink).toBeInTheDocument();
    expect(ordersLink.closest("a")).toHaveAttribute("href", "/dashboard/user/orders");
  });
});

