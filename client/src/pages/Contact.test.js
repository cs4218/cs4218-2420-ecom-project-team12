import React from "react";
import { render, screen } from "@testing-library/react";
import Contact from "./Contact";
import "@testing-library/jest-dom";

// Mock the Layout component
jest.mock("./../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

describe("Contact Component", () => {
  test("renders contact page with all essential elements", () => {
    render(<Contact />);

    // Check if Layout component is rendered with correct title
    const layout = screen.getByTestId("layout");
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("data-title", "Contact us");

    // Check if heading is displayed
    expect(screen.getByText("CONTACT US")).toBeInTheDocument();

    // Check if description text is displayed
    expect(
      screen.getByText(
        "For any query or info about product, feel free to call anytime. We are available 24X7."
      )
    ).toBeInTheDocument();

    // Check if contact information is displayed
    expect(
      screen.getByText("✉️ : www.help@ecommerceapp.com")
    ).toBeInTheDocument();
    expect(screen.getByText("📞 : 012-3456789")).toBeInTheDocument();
    expect(
      screen.getByText("🧑‍💻 : 1800-0000-0000 (toll free)")
    ).toBeInTheDocument();

    // Check if image is displayed
    const contactImage = screen.getByAltText("contactus");
    expect(contactImage).toBeInTheDocument();
    expect(contactImage).toHaveAttribute("src", "/images/contactus.jpeg");
  });
});
