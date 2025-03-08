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
                .catch(_ => ({ data: { ok: false } }));

            if (res.data?.ok) {
                setOk(true);
            } else {
                setOk(false);
                logout();
            }
        };
        if (auth?.token) authCheck();
    }, [auth?.token, logout]);

    return ok ? <Outlet /> : <Spinner />;
}
