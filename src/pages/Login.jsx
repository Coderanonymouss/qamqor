import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Button, TextField, Box, Typography, Alert, Paper, Avatar } from "@mui/material";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export default function Login({ goRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
                setError("Подтвердите email, прежде чем войти!");
                await auth.signOut();
                return;
            }
            // После успешного входа, App.jsx сам решает, куда дальше идти
        } catch (err) {
            setError("Ошибка входа: " + err.message);
        }
    };

    return (
        <Box sx={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
            <Paper elevation={6} sx={{ p: 5, borderRadius: 4, minWidth: 340 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Avatar sx={{ m: 1, bgcolor: "primary.main" }}><LockOutlinedIcon /></Avatar>
                    <Typography variant="h5" component="h1" fontWeight="bold" mb={1}>Вход</Typography>
                </Box>
                <form onSubmit={handleSubmit}>
                    <TextField fullWidth margin="normal" label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <TextField fullWidth margin="normal" label="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 2, borderRadius: 2 }}>Войти</Button>
                </form>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                <Box sx={{ mt: 2, textAlign: "center" }}>
                    <Button variant="text" onClick={goRegister} sx={{ textTransform: "none" }}>Регистрация</Button>
                </Box>
            </Paper>
        </Box>
    );
}
