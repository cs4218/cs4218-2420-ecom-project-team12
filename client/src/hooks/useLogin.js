import { useAuth } from "../context/auth";

export default function useLogin() {
    const [auth, setAuth] = useAuth();
    const login = (user, token) => {
        const result = {
            ...auth,
            user,
            token
        };
        setAuth(result);
        localStorage.setItem("auth", JSON.stringify(result));
    }
    return login;
};
