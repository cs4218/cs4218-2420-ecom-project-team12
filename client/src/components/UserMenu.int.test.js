import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/extend-expect"; 
import UserMenu from "./UserMenu";

//reference: https://chatgpt.com/share/67df00ab-f880-800a-8b29-c48a1e93f601
const ProfilePage = () => <div data-testid="profile-page">Profile Page</div>;
const OrdersPage = () => <div data-testid="orders-page">Orders Page</div>;

describe("UserMenu Integration Tests", () => {
  test("navigates to Profile page on clicking Profile link", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<UserMenu />} />
          <Route path="/dashboard/user/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    userEvent.click(screen.getByText("Profile"));

    expect(await screen.findByTestId("profile-page")).toBeInTheDocument();
  });

  test("navigates to Orders page on clicking Orders link", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<UserMenu />} />
          <Route path="/dashboard/user/orders" element={<OrdersPage />} />
        </Routes>
      </MemoryRouter>
    );

    userEvent.click(screen.getByText("Orders"));

    expect(await screen.findByTestId("orders-page")).toBeInTheDocument();
  });
});
