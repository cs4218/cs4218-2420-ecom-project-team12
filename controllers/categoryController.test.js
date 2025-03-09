import { jest } from "@jest/globals";
import { createCategoryController, updateCategoryController, categoryControlller, singleCategoryController, deleteCategoryCOntroller } from './categoryController';
import categoryModel from "../models/categoryModel.js";
import { describe } from "node:test";

jest.mock('../models/categoryModel.js');

let res;

beforeEach(() => {
    jest.resetAllMocks();
    res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
    }
    
})

describe('createCategoryController tests', () => {
    let req;
    beforeEach(() => {
        req = {
            body: {
                name: 'new category-Name'
            }
        }
    });
    
    describe('Given a normal name parameter', () => {

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
            req.body.name = null;
    
            await createCategoryController(req, res);
    
            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
        })
    
        test('Given empty string', async () => {
            req.body.name = '';

            await createCategoryController(req, res);

            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
        })
    
        test('Given whitespace character string', async () => {
            req.body.name = '  \n\t';
    
            await createCategoryController(req, res);

            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
        })

        test('Given integer instead of string', async () => {
            req.body.name = 1;
    
            await createCategoryController(req, res);

            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
        })

    })
});

describe('updateCategoryController tests', () => {
    let req;
    beforeEach(() => {
        req = {
            body: {
                name: 'new category-Name'
            },
            params: {
                id: 2
            }
        }
    })

    describe('Given a normal name parameter', () => {
        test('When id is in DB', async () => {
            categoryModel.findByIdAndUpdate.mockResolvedValue(1);

            await updateCategoryController(req, res);

            expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
                category: 1
            }));
        })

        test('When id is not in DB', async () => {
            categoryModel.findByIdAndUpdate.mockResolvedValue(null);

            await updateCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        })

        test('When id is not in DB but server error', async () => {
            categoryModel.findByIdAndUpdate.mockRejectedValue(new Error('Server Error'));

            await updateCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        })
    })
    

    describe('Given invalid name parameter', () => {    
        test('Given null', async () => {
            req.body.name = null;
    
            await updateCategoryController(req, res);
    
            expect(categoryModel.findByIdAndUpdate).not.toHaveBeenCalled();
        })

        test('Given empty string', async () => {
            req.body.name = '';

            await updateCategoryController(req, res);

            expect(categoryModel
                .findByIdAndUpdate).not.toHaveBeenCalled();
        })

        test('Given whitespace character string', async () => {
            req.body.name = '  \n\t';
    
            await updateCategoryController(req, res);

            expect(categoryModel
                .findByIdAndUpdate).not.toHaveBeenCalled();
        })

        test('Given integer instead of string', async () => {
            req.body.name = 1;
    
            await updateCategoryController(req, res);

            expect(categoryModel
                .findByIdAndUpdate).not.toHaveBeenCalled();
        })
    })
})

describe('categoryController tests', () => {
    let req;

    const positiveTestCases = [
        { description: 'When DB is empty', dbResult: []},
        { description: 'When DB has one value', dbResult: [1] },
        { description: 'When DB has multiple values', dbResult: [2, 3, 5, 7, 11]},
    ];

    positiveTestCases.forEach(({ description, dbResult}) => {
        test(description, async () => {
            categoryModel.find.mockResolvedValue(dbResult);

            await categoryControlller(req, res);

            expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
                category: dbResult
            }));
        });
    });

    test('When server error', async () => {
        categoryModel.find.mockRejectedValue(new Error('Server Error'));

        await createCategoryController(req, res);

        expect(categoryModel.prototype.save).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    })
})

describe('singleCategoryController tests', () => {
    let req;
    beforeEach(() => {
        req = {
            params: {
                slug: 'slug'
            }
        }
    });

    const positiveTestCases = [
        { description: 'When slug is in DB ', dbResult: 1},
        { description: 'When DB is empty', dbResult: null },
    ];

    test('When slug is in DB', async () => {
        categoryModel.findOne.mockResolvedValue(1);

        await singleCategoryController(req, res);

        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            category: 1
        }));
    })

    test('When slug is in DB', async () => {
        categoryModel.findOne.mockResolvedValue(null);

        await singleCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    })

    test('When server error', async () => {
        categoryModel.findOne.mockRejectedValue(new Error('Server Error'));

        await singleCategoryController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
    })
});

describe('deleteCategoryCOntroller test', () => {
    let req;
    beforeEach(() => {
        req = {
            params: {
                id: 1
            }
        }
    });


    test('When id in DB', async () => {
        categoryModel.findByIdAndDelete.mockResolvedValue(1);
        
        await deleteCategoryCOntroller(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    })

    test('When id not in DB', async () => {
        categoryModel.findByIdAndDelete.mockResolvedValue(null);
        
        await deleteCategoryCOntroller(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    })


    test('When server error', async () => {
        categoryModel.findByIdAndDelete.mockRejectedValue(new Error('Server Error'));

        await deleteCategoryCOntroller(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    })
});