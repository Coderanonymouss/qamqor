import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import DoctorPanel from "./pages/DoctorPanel";

function App() {
    const [page, setPage] = useState("login");
    const [user, setUser] = useState(null);
    const [resetEmail, setResetEmail] = useState(""); // Новый стейт для email после сброса

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
            setUser(firebaseUser);
        });
        return () => unsubscribe();
    }, []);

    if (!user) {
        switch (page) {
            case "login":
                return <Login
                    goRegister={() => setPage("register")}
                    goForgot={() => setPage("forgot")}
                    initialEmail={resetEmail} // передаём email в Login
                />;
            case "register":
                return <Register goLogin={(email) => {
                    setResetEmail(email); // передаём email после регистрации
                    setPage("login");
                }} />;

            case "forgot":
                return <ForgotPassword goLogin={(email) => {
                    setResetEmail(email); // сохраняем email
                    setPage("login");     // переходим на login
                }} />;
            default:
                return null;
        }
    }

    return <DoctorPanel />;
}

export default App;
