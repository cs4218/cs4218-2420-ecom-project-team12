import bcrypt from "bcrypt";

export const isValidPhone = (phone) => {
    // We do not exhaustively evaluate the validity of phone numbers by country.
    // Any string of 3+ digits with an optional '+' in front is considered valid.
    const re = /^[+]?[0-9]{3,}$/;
    return re.test(phone);
};

export const isValidEmail = (email) => {
    // We do not exhaustively match emails w.r.t. RFC 822/5322/6532,
    // but rather focus on ensuring users entered something along the lines of "user@domain".
    // For instance, IP addresses, string escaping, and special symbol meanings won't be explicitly handled.
    const re = /^[^\s@.]+(\.[^\s@.]+)*@[^\s@.]+(\.[^\s@.]+)*$/;
    return re.test(email);
}

export const hashPassword = async (password) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
};

export const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
}
