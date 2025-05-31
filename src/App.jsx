import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DoctorPanel from "./pages/DoctorPanel";

function App() {
    const [page, setPage] = useState("login");
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
            setUser(firebaseUser);
        });
        return () => unsubscribe();
    }, []);

    if (!user) {
        return page === "login"
            ? <Login goRegister={() => setPage("register")} />
            : <Register goLogin={() => setPage("login")} />;
    }

    return <DoctorPanel />;
}

export default App;