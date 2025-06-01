import React, { useState, useEffect } from "react";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut
} from "firebase/auth";
import { auth, db } from "../firebase";
import {
    collection, query, where, getDocs
} from "firebase/firestore";
import {
    Button, TextField, Box, Typography, Alert,
    Paper, Avatar, Stack, IconButton, InputAdornment
} from "@mui/material";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function Register({ goLogin }) {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showRepeat, setShowRepeat] = useState(false);

    // Проверка email в Firestore (коллекция User)
    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (!email) return;

            try {
                const q = query(collection(db, "User"), where("email", "==", email));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    setEmailError("Пользователь с таким email уже существует");
                } else {
                    setEmailError("");
                }
            } catch (err) {
                console.error(err);
                setEmailError("Ошибка при проверке email");
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [email]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (emailError) {
            setError(emailError);
            return;
        }

        if (password !== repeatPassword) {
            setError("Пароли не совпадают");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            await signOut(auth);
            setSuccess("Проверьте email и подтвердите свою почту перед входом!");
            setTimeout(() => goLogin(email), 2000);
        } catch (err) {
            setError("Ошибка регистрации: " + err.message);
        }
    };

    return (
        <Box sx={{
            height: "100vh", display: "flex", justifyContent: "center", alignItems: "center",
            background: "linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)"
        }}>
            <Paper elevation={6} sx={{ p: 5, borderRadius: 4, minWidth: 340 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Avatar sx={{ m: 1, bgcolor: "success.main" }}>
                        <PersonAddIcon />
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold" mb={1}>
                        Регистрация
                    </Typography>
                </Box>
                <form onSubmit={handleRegister}>
                    <TextField
                        fullWidth margin="normal" label="Email" type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setEmailError("");
                        }}
                        error={Boolean(emailError)}
                        helperText={emailError}
                        required
                    />
                    <TextField
                        fullWidth margin="normal" label="Пароль"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)} required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <TextField
                        fullWidth margin="normal" label="Повторите пароль"
                        type={showRepeat ? "text" : "password"}
                        value={repeatPassword}
                        onChange={e => setRepeatPassword(e.target.value)} required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowRepeat(!showRepeat)} edge="end">
                                        {showRepeat ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <Button
                        fullWidth type="submit" variant="contained" size="large"
                        sx={{ mt: 2, borderRadius: 2 }}
                    >
                        Зарегистрироваться
                    </Button>
                </form>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
                <Stack direction="row" sx={{ mt: 3, justifyContent: "center" }}>
                    <Button variant="text" onClick={() => goLogin()} sx={{ textTransform: "none" }}>
                        Уже есть аккаунт? Войти
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}
