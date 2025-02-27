import bcrypt from "bcrypt";

export const isValidPhone = (phone) => {
    // Any string of 3+ digits with an optional '+' in front is considered valid.
    const re = /^[+]?[0-9]{3,}$/;
    return re.test(phone);
};

export const isValidEmail = (email) => {
    // We do not exhaustively match emails w.r.t. RFC 822/5322/6532,
    // but rather focus on ensuring users entered something along the lines of "user@domain".
    // For instance, IP addresses and string escaping won't be handled.
    const re = /^[^\s@.]+(\.[^\s@.]+)*@[^\s@.]+(\.[^\s@.]+)*$/;
    return re.test(email);
}

export const hashPassword = async (password) => {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;

    } catch (error) {
        console.log(error);
    }
};

export const comparePassword = async (password,hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
}
