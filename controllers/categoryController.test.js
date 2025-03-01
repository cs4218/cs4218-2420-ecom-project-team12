import { createCategoryController } from './categoryController';
import categoryModel from "../models/categoryModel.js";
import { beforeEach } from 'node:test';

jest.mock('../models/categoryModel.js');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createCategoryController', () => {
    let req, res;
    
    res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
    }
    
    describe('Given alphanumeric string', () => {

        req = {
            body: {
                name: 'categoryName'
            }
        }

        test('When string is not in DB', async () => {
            categoryModel.findOne.mockResolvedValue(null);
            categoryModel.prototype.save = jest.fn();
    
            await createCategoryController(req, res);
            expect(categoryModel.prototype.save).toHaveBeenCalled();
        })


    })

});

