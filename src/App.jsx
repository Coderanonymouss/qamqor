import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import DoctorPanel from "./pages/DoctorPanel";
import AdminPanel from "./pages/AdminPanel";
import UserProfile from "./pages/UserProfile";
import FolderVideos from "./pages/FolderVideos.jsx"; // Добавь этот компонент как выше



function App() {
    const [page, setPage] = useState("login");
    const [user, setUser] = useState(null);
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [resetEmail, setResetEmail] = useState(""); // email после сброса

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(true);

            if (firebaseUser) {
                const userRef = doc(db, "User", firebaseUser.uid);
                const snap = await getDoc(userRef);

                if (snap.exists()) {
                    const data = snap.data();
                    setRole(data.role || data.type || "");
                } else {
                    setRole("");
                }
            } else {
                setRole("");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div>Загрузка...</div>;
    }

    // Если пользователь не авторизован — показываем только auth-страницы
    if (!user) {
        switch (page) {
            case "login":
                return <Login
                    goRegister={() => setPage("register")}
                    goForgot={() => setPage("forgot")}
                    initialEmail={resetEmail}
                />;
            case "register":
                return <Register goLogin={(email) => {
                    setResetEmail(email);
                    setPage("login");
                }} />;
            case "forgot":
                return <ForgotPassword goLogin={(email) => {
                    setResetEmail(email);
                    setPage("login");
                }} />;
            default:
                return null;
        }
    }

    // После входа показываем роуты
    return (
            <Routes>
                {/* Для администратора */}
                {role === "Admin" && (
                    <>
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/admin/user-profile/:id" element={<UserProfile />} />
                        <Route path="/folders/:folderId" element={<FolderVideos />} />
                        <Route path="*" element={<Navigate to="/admin" />} />
                    </>
                )}

                {/* Для доктора */}
                {role === "Doctor" && (
                    <>
                        <Route path="/doctor" element={<DoctorPanel />} />
                        <Route path="*" element={<Navigate to="/doctor" />} />
                    </>
                )}

                {/* Для других ролей можно добавить здесь... */}

                {/* Если роль не определена — нет доступа */}
                {(!["Admin", "Doctor"].includes(role)) && (
                    <Route path="*" element={<div>Нет доступа. Обратитесь к администратору.</div>} />
                )}
            </Routes>
    );
}

export default App;
