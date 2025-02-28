import { jest } from "@jest/globals";
import { isValidEmail, isValidPhone, comparePassword, hashPassword } from "./authHelper";


describe("Auth Helper Tests", () => {

    describe("Email Validation", () => {
        // We do not exhaustively match emails w.r.t. RFC 822/5322/6532.
        // For instance, IP addresses and string escaping won't be handled.
        const VALID_EMAILS = [
            "test@example.com",         // Standard email
            "a@b.c",                    // Min characters
            "Test.Ing-mail@test.co",    // Case and some symbols does not matter
            "abc-def+ghi@x.org",        // Most symbols are allowed
            "用户@例子.ë.net",          // Internationalized emails
            "a.b.cd@bc",                // TLD-only is technically valid
        ];
        const INVALID_EMAILS = [
            // Domain and username is required
            "invalid-email",
            "invalid-email@",

            "@email.com",
            "email.com",

            // May not start and end with a dot
            "a@bc.de.",
            ".a@bc",
            "a@.bc",
            "a.@bc",

            // May not have more than one @ symbol
            "abc@@def.ghi",
            "abc@def@ghi.jkl",

            // Spaces are not allowed
            "a b @ c . d",
            "\"a b\"@c.d", // Note: Valid by RFC, but we reject it as this requires complex parsing, and there's a higher chance this is user error.
        ];

        test.each(VALID_EMAILS)("email '%s' is valid", (email) => {
            expect(isValidEmail(email)).toBe(true);
        });

        test.each(INVALID_EMAILS)("email '%s' is invalid", (email) => {
            expect(isValidEmail(email)).toBe(false);
        });
    });



    describe("Phone Validation", () => {
        // We do not exhaustively evaluate the validity of phone numbers by country.
        // Any string of 3+ digits with an optional '+' in front is considered valid.
        const VALID_PHONES = [
            "012",          // 3+ digits
            "01234567",     // 8 digits
            "1234567890",   // 10 digits
            "+11234567890", // With country code
        ];
        const INVALID_PHONES = [
            // Must be 3+ digits
            "12",

            // Brackets, dashes, spaces, and other symbols are not allowed
            "123-456-7890",
            "(123) 456-7890",
            "(123)4567890",
            "-123--456789",
            "123#45678",
            "12345*6789",
            "12345@7890",

            // Letters are not allowed
            "123456789a",
            "B123456789",
            "1234c56789",

            // + must be located at the front and appear only once max
            "1+234567890",
            "123+4567890",
            "++1234567890",
            "+1234+5678",
        ];

        test.each(VALID_PHONES)("phone number '%s' is valid", (phone) => {
            expect(isValidPhone(phone)).toBe(true);
        });

        test.each(INVALID_PHONES)("phone number '%s' is invalid", (phone) => {
            expect(isValidPhone(phone)).toBe(false);
        });
    });



    describe("Password Hashing and Validation", () => {
        function generateRandomPassword() {
            return Math.random().toString(36).substring(7);
        }

        test("hashed password compared with original password will succeed", async () => {
            const password = generateRandomPassword();
            const hashedPassword = await hashPassword(password);
            expect(await comparePassword(password, hashedPassword)).toBe(true);
        });

        test("hashed password compared with different password will fail", async () => {
            let password1 = "";
            let password2 = "";

            while (password1 === password2) {
                password1 = generateRandomPassword();
                password2 = generateRandomPassword();
            }

            const hashedPassword = await hashPassword(password1);
            expect(await comparePassword(password2, hashedPassword)).toBe(false);
        });

        test("hashed password should be salted and thus have distinct hashes", async () => {
            const password = generateRandomPassword();
            const hashedPassword1 = await hashPassword(password);
            const hashedPassword2 = await hashPassword(password);
            expect(hashedPassword1).not.toBe(hashedPassword2);
        });
    });
});
