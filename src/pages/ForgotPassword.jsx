import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import {
    Button, TextField, Box, Typography, Alert, Paper, Avatar, Stack
} from "@mui/material";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function ForgotPassword({ goLogin }) {
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");

    const handleReset = async (e) => {
        e.preventDefault();
        setError("");
        setMsg("");
        try {
            await sendPasswordResetEmail(auth, email);
            setMsg("Письмо с восстановлением пароля отправлено!");

            setTimeout(async () => {
                goLogin(email);
            },2000)
        } catch (err) {
            setError("Ошибка: " + err.message);
        }
    };

    return (
        <Box sx={{
            height: "100vh", display: "flex", justifyContent: "center", alignItems: "center",
            background: "linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)"
        }}>
            <Paper elevation={6} sx={{ p: 5, borderRadius: 4, minWidth: 340 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Avatar sx={{ m: 1, bgcolor: "warning.main" }}>
                        <HelpOutlineIcon />
                    </Avatar>
                    <Typography variant="h5" component="h1" fontWeight="bold" mb={1}>
                        Сброс пароля
                    </Typography>
                </Box>
                <form onSubmit={handleReset}>
                    <TextField fullWidth margin="normal" label="Email" type="email"
                               value={email} onChange={e => setEmail(e.target.value)} required />
                    <Button fullWidth type="submit" variant="contained" sx={{ mt: 2, borderRadius: 2 }}>
                        Восстановить
                    </Button>
                </form>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {msg && <Alert severity="success" sx={{ mt: 2 }}>{msg}</Alert>}

                <Stack direction="row" sx={{ mt: 3, justifyContent: "center" }}>
                    <Button variant="text" onClick={goLogin} sx={{ textTransform: "none" }}>
                        Назад к входу
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}
