import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import useLogout from "../../hooks/useLogout";
import { Outlet } from "react-router-dom";
import axios from 'axios';
import Spinner from "../Spinner";

export default function PrivateRoute() {
    const [ ok, setOk ] = useState(false)
    const [ auth ] = useAuth()
    const logout = useLogout();

    useEffect(()=> {
        const authCheck = async () => {
            const res = await axios.get("/api/v1/auth/user-auth")
                .catch(err => err.response ?? { data: { ok: false } });

            if (res.data?.ok) {
                setOk(true);
            } else {
                setOk(false);

                switch (res.status) {
                    case 200:
                    case 401:
                    case 403:
                        // Unauthorized || OK is not true.
                        // Auth token is invalid, we should logout.
                        logout();
                        break;

                    default:
                        break;
                }
            }
        };
        if (auth?.token) authCheck();
    }, [auth?.token, logout]);

    return ok ? <Outlet /> : <Spinner />;
}
