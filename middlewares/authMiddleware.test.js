import { jest } from "@jest/globals";
import { requireSignIn, isAdmin } from "./authMiddleware";
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

describe("Auth Middleware Tests", () => {

    const USER_ID = "some-user-id";

    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            headers: {
                authorization: "some-token",
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });



    function expectAuthorized() {
        expect(res.status).not.toHaveBeenCalled();
        expect(res.send).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
    }

    function expectUnauthorized() { // 401, Unauthorized Access
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Unauthorized Access",
        });
        expect(next).not.toHaveBeenCalled();
    }

    function expectInternalError(e, m) { // 500, ?
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            error: e,
            message: m,
        });
        expect(next).not.toHaveBeenCalled();
    }




    describe("Require Sign-in Middleware Tests", () => {
        test("should have user id set and called next() without calling res.send() if token is valid", async () => {
            JWT.verify = jest.fn(_ => ({ _id: USER_ID }));

            await requireSignIn(req, res, next);

            expect(JWT.verify).toHaveBeenCalledTimes(1);
            expect(req.user?._id).toBe(USER_ID);
            expectAuthorized();
        });

        test("should have no user set and fail if token is invalid", async () => {
            JWT.verify = jest.fn(_ => { throw new Error("Expected invalid JWT in unit test") });

            await requireSignIn(req, res, next);

            expect(JWT.verify).toHaveBeenCalledTimes(1);
            expect(res.user).toBeUndefined();
            expectUnauthorized();
        });
    });

    describe("Is Admin Middleware Tests", () => {
        beforeEach(() => {
            req.user = { _id: USER_ID };
        });

        test("should call next() without calling res.send() if user is admin", async () => {
            userModel.findById = jest.fn(async x => ({ _id: x, role: 1 }));

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith(USER_ID);
            expectAuthorized();
        });

        test("should fail if user is not admin", async () => {
            userModel.findById = jest.fn(async x => ({ _id: x, role: 0 }));

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith(USER_ID);
            expectUnauthorized();
        });

        test("should fail if user is not found", async () => {
            userModel.findById = jest.fn(async _ => null);

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith(USER_ID);
            expectUnauthorized();
        });

        test("should fail if no user is set", async () => {
            req.user = undefined;
            userModel.findById = jest.fn(async _ => null);

            await isAdmin(req, res, next);

            expectUnauthorized();
        });

        test("should fail for unknown role", async () => {
            userModel.findById = jest.fn(async x => ({ _id: x, role: -1 }));

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith(USER_ID);
            expectUnauthorized();
        });

        test("should fail for missing role", async () => {
            userModel.findById = jest.fn(async x => ({ _id: x }));

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith(USER_ID);
            expectUnauthorized();
        });

        test("should fail with internal server error if user lookup fails", async () => {
            userModel.findById = jest.fn(_ => { throw new Error("Expected error in unit test") });

            await isAdmin(req, res, next);

            expectInternalError(
                new Error("Expected error in unit test"),
                "Internal error in admin middleware"
            );
        });
    });

});

