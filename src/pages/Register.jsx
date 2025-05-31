import React, { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Button, TextField, Box, Typography, Alert, Paper, Avatar, Stack } from "@mui/material";
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function Register({ goLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (password !== repeatPassword) {
            setError("Пароли не совпадают");
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            await signOut(auth);
            setSuccess("Проверьте email и подтвердите свою почту перед входом!");
        } catch (err) {
            setError("Ошибка регистрации: " + err.message);
        }
    };

    return (
        <Box sx={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
            <Paper elevation={6} sx={{ p: 5, borderRadius: 4, minWidth: 340 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Avatar sx={{ m: 1, bgcolor: "success.main" }}><PersonAddIcon /></Avatar>
                    <Typography variant="h5" component="h1" fontWeight="bold" mb={1}>Регистрация</Typography>
                </Box>
                <form onSubmit={handleRegister}>
                    <TextField fullWidth margin="normal" label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <TextField fullWidth margin="normal" label="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <TextField fullWidth margin="normal" label="Повторите пароль" type="password" value={repeatPassword} onChange={e => setRepeatPassword(e.target.value)} required />
                    <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 2, borderRadius: 2 }}>Зарегистрироваться</Button>
                </form>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
                <Stack direction="row" sx={{ mt: 3, justifyContent: "center" }}>
                    <Button variant="text" onClick={goLogin} sx={{ textTransform: "none" }}>Уже есть аккаунт? Войти</Button>
                </Stack>
            </Paper>
        </Box>
    );
}
