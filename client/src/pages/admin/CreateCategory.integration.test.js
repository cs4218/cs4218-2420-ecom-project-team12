import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import CreateCategory from './CreateCategory';
import axios from "axios";
import toast from "react-hot-toast";

// Mocking axios.post
jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock('../../components/Header', () => () => <div>Mocked Header</div>);
jest.mock('../../components/AdminMenu', () => () => <div>Mocked AdminMenu</div>);

describe('CreateCategory', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    test('renders CreateCategory component', () => {
        render(
            <MemoryRouter initialEntries={["/admin/create-category"]}>
              <Routes>
                <Route path="/admin/create-category" element={<CreateCategory />} />
              </Routes>
            </MemoryRouter>
          );
    
    
        expect(screen.getByPlaceholderText('Enter new category')).toBeInTheDocument();
        expect(screen.getByText('Submit')).toBeInTheDocument();
    });
    
    test('Given user is trying to create category, then it is created successfully.', async () => {
        axios.post.mockResolvedValue({ data: { success: true } });
        render(
            <MemoryRouter initialEntries={["/admin/create-category"]}>
              <Routes>
                <Route path="/admin/create-category" element={<CreateCategory />} />
              </Routes>
            </MemoryRouter>
          );
        
        fireEvent.change(screen.getByPlaceholderText('Enter new category'), {
            target: { value: "new category" },
        });
        fireEvent.click(screen.getByText("Submit"));
        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.success).toHaveBeenCalledWith("new category is created");        
    
    })

    test('Given user is trying to create category, when axios returns failure, it is not created.', async () => {
        axios.post.mockResolvedValue({ data: { success: false } });
        render(
            <MemoryRouter initialEntries={["/admin/create-category"]}>
              <Routes>
                <Route path="/admin/create-category" element={<CreateCategory />} />
              </Routes>
            </MemoryRouter>
          );
        
        fireEvent.change(screen.getByPlaceholderText('Enter new category'), {
            target: { value: "new category" },
        });
        fireEvent.click(screen.getByText("Submit"));
        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalled();
    
    })
})

