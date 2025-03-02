import { jest } from "@jest/globals";
import { createCategoryController, updateCategoryController, categoryControlller, singleCategoryController, deleteCategoryCOntroller } from './categoryController';
import categoryModel from "../models/categoryModel.js";
import { describe } from "node:test";

jest.mock('../models/categoryModel.js');

let req, res;
res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn()
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createCategoryController tests', () => {
    
    describe('Given a normal name parameter', () => {
        req = {
            body: {
                name: 'new category-Name'
            }
        }

        test('When string is not in DB', async () => {
            categoryModel.findOne.mockResolvedValue(null);
            categoryModel.prototype.save = jest.fn();

            await createCategoryController(req, res);

            expect(categoryModel.prototype.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        })

        test('When string is already in DB', async () => {
            categoryModel.findOne.mockResolvedValue(1);
            categoryModel.prototype.save = jest.fn();

            await createCategoryController(req, res);

            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        })

        test('When string is not in DB but server error', async () => {
            categoryModel.findOne.mockRejectedValue(new Error('Server Error'));

            await createCategoryController(req, res);

            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        })

    })

    describe('Given invalid name parameter', () => {

        test('Given null', async () => {
            req = {
                body: {
                    name: null
                }
            }
    
            await createCategoryController(req, res);
    
            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
        })
    
        test('Given empty string', async () => {
            req = {
                body: {
                    name: ''
                }
            }
    
            await createCategoryController(req, res);

            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
        })
    
        test('Given whitespace character string', async () => {
            req = {
                body: {
                    name: '  \n\t'
                }
            }
    
            await createCategoryController(req, res);

            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
        })

        test('Given integer instead of string', async () => {
            req = {
                body: {
                    name: 1
                }
            }
    
            await createCategoryController(req, res);
            
            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
        })

    })
});

