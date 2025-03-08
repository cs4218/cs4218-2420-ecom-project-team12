import { useAuth } from "../context/auth";

export default function useLogout() {
    const [auth, setAuth] = useAuth();
    const logout = () => {
        setAuth({
            ...auth,
            user: null,
            token: "",
        });
        localStorage.removeItem("auth");
    }
    return logout;
};
