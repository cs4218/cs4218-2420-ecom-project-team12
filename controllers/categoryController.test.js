import { expect, jest } from "@jest/globals";
import { createCategoryController, updateCategoryController, categoryControlller, singleCategoryController, deleteCategoryCOntroller } from './categoryController';
import categoryModel from "../models/categoryModel.js";
import { describe } from "node:test";
import { HTTP_MESSAGES } from "../utils/constants/httpMessages.js";

const checkFailureResponse = (res, errorCode, message) => {
    expect(res.status).toHaveBeenCalledWith(errorCode);
    expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: message,
    });
}
const check500Response = (res, error, message) => {
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: error,
        message: message,
    });
}

jest.mock('../models/categoryModel.js');

let res, errorStub, categoryStub;

beforeEach(() => {
    jest.resetAllMocks();
    res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        message: jest.fn()
    }
    errorStub = new Error('Server Error');
    categoryStub = {
        _id: "12345",
        name: "new category-Name",
        slug: "new-category-name",
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
            categoryModel.prototype.save = jest.fn().mockResolvedValue(categoryStub);

            await createCategoryController(req, res);

            expect(categoryModel.prototype.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                category: categoryStub,
                message: HTTP_MESSAGES.CATEGORY.CREATE.SUCCESS,
            });
        })

        test('When string is already in DB', async () => {
            categoryModel.findOne.mockResolvedValue(categoryStub);

            await createCategoryController(req, res);

            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
            checkFailureResponse(res, 409, HTTP_MESSAGES.CATEGORY.CREATE.ALREADY_EXISTS);
        })

        test('When string is not in DB but server error', async () => {
            categoryModel.findOne.mockRejectedValue(errorStub);

            await createCategoryController(req, res);

            check500Response(res, errorStub, HTTP_MESSAGES.CATEGORY.CREATE.GENERIC_ERROR);
        })

    })

    describe('Given invalid name parameter', () => {

        test('Given null', async () => {
            req.body.name = null;
    
            await createCategoryController(req, res);
    
            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
            checkFailureResponse(res, 400, HTTP_MESSAGES.NAME.REQUIRED);
        })
    
        test('Given empty string', async () => {
            req.body.name = '';

            await createCategoryController(req, res);

            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
            checkFailureResponse(res, 400, HTTP_MESSAGES.NAME.REQUIRED);
        })
    
        test('Given whitespace character string', async () => {
            req.body.name = '  \n\t';
    
            await createCategoryController(req, res);

            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
            checkFailureResponse(res, 400, HTTP_MESSAGES.NAME.EMPTY_STRING);
        })

        test('Given integer instead of string', async () => {
            req.body.name = 1;
    
            await createCategoryController(req, res);

            expect(categoryModel.prototype.save).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error : expect.any(Error),
                message: HTTP_MESSAGES.CATEGORY.CREATE.GENERIC_ERROR,
            });
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
                id: 12345
            }
        }
    })

    describe('Given a normal name parameter', () => {
        test('When id is in DB', async () => {
            categoryModel.findByIdAndUpdate.mockResolvedValue(categoryStub);

            await updateCategoryController(req, res);
            
            expect(categoryModel.findByIdAndUpdate).toHaveBeenCalled()
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: HTTP_MESSAGES.CATEGORY.UPDATE.SUCCESS,
                category: categoryStub,
            });
        })

        test('When id is not in DB', async () => {
            categoryModel.findByIdAndUpdate.mockResolvedValue(null);

            await updateCategoryController(req, res);
            
            checkFailureResponse(res, 404, HTTP_MESSAGES.CATEGORY.UPDATE.NOT_FOUND(req.params.id));
        })

        test('When id is not in DB but server error', async () => {
            categoryModel.findByIdAndUpdate.mockRejectedValue(errorStub);

            await updateCategoryController(req, res);

            check500Response(res, errorStub, HTTP_MESSAGES.CATEGORY.UPDATE.GENERIC_ERROR);
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

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                category: dbResult,
                message: HTTP_MESSAGES.CATEGORY.GETALL.SUCCESS,
            });
        })

    });

    test('When server error', async () => {
        categoryModel.find.mockRejectedValue(errorStub);

        await categoryControlller(req, res);

        check500Response(res, errorStub, HTTP_MESSAGES.CATEGORY.GETALL.GENERIC_ERROR);
    })
})

describe('singleCategoryController tests', () => {
    let req;
    beforeEach(() => {
        req = {
            params: {
                slug: 'new-category-name'
            }
        }
    });

    const positiveTestCases = [
        { description: 'When slug is in DB ', dbResult: categoryStub },
        { description: 'When DB is empty', dbResult: null },
    ];

    test('When slug is in DB', async () => {
        categoryModel.findOne.mockResolvedValue(categoryStub);

        await singleCategoryController(req, res);

        expect(res.send).toHaveBeenCalledWith({
            success: true,
            category: categoryStub,
            message: HTTP_MESSAGES.CATEGORY.GET.SUCCESS,
        });
    })

    test('When slug is not in DB', async () => {
        categoryModel.findOne.mockResolvedValue(null);

        await singleCategoryController(req, res);

        checkFailureResponse(res, 404, HTTP_MESSAGES.CATEGORY.GET.NOT_FOUND(req.params.slug));
    })

    test('When server error', async () => {
        categoryModel.findOne.mockRejectedValue(errorStub);

        await singleCategoryController(req, res);
        
        check500Response(res, errorStub, HTTP_MESSAGES.CATEGORY.GET.GENERIC_ERROR);
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
        expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: HTTP_MESSAGES.CATEGORY.DELETE.SUCCESS,
        });
    })

    test('When id not in DB', async () => {
        categoryModel.findByIdAndDelete.mockResolvedValue(null);
        
        await deleteCategoryCOntroller(req, res);

        checkFailureResponse(res, 404, HTTP_MESSAGES.CATEGORY.DELETE.NOT_FOUND(req.params.id));
    })


    test('When server error', async () => {
        categoryModel.findByIdAndDelete.mockRejectedValue(errorStub);

        await deleteCategoryCOntroller(req, res);

        check500Response(res, errorStub, HTTP_MESSAGES.CATEGORY.DELETE.GENERIC_ERROR);
    })
});