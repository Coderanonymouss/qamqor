import React, { useState } from "react";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import {
    Box, TextField, Button, Typography, Paper, Avatar, Alert
} from "@mui/material";
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

export default function FirstSignin({ user, afterFinish }) {
    const [fullName, setFullName] = useState("");
    const [birthday, setBirthday] = useState("");
    const [tel, setTel] = useState("");
    const [specialite, setSpecialite] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Обновляем профиль пользователя в Firestore (коллекция User)
            await setDoc(doc(db, "User", user.uid), {
                uid: user.uid,
                email: user.email,
                fullName,
                birthday,
                tel,
                specialite,
                type: "Doctor", // Или "Admin", если это админ
                firstSigninCompleted: true,
            }, { merge: true });

            setLoading(false);
            // Вызов afterFinish — App заново загрузит профиль и откроет DoctorPanel/AdminPanel
            if (afterFinish) await afterFinish();

        } catch (err) {
            setError("Ошибка сохранения: " + err.message);
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            height: "100vh", display: "flex", justifyContent: "center", alignItems: "center",
            background: "linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)"
        }}>
            <Paper elevation={6} sx={{ p: 5, borderRadius: 4, minWidth: 450 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
                        <AssignmentIndIcon />
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold" mb={1} align="center">
                        Первый вход: заполните профиль врача
                    </Typography>
                </Box>
                <form onSubmit={handleSave}>
                    <TextField fullWidth label="ФИО" margin="normal" value={fullName} onChange={e => setFullName(e.target.value)} required />
                    <TextField fullWidth label="Дата рождения" margin="normal" value={birthday} onChange={e => setBirthday(e.target.value)} required />
                    <TextField fullWidth label="Телефон" margin="normal" value={tel} onChange={e => setTel(e.target.value)} required />
                    <TextField fullWidth label="Специализация" margin="normal" value={specialite} onChange={e => setSpecialite(e.target.value)} required />
                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        sx={{ mt: 3 }}
                        disabled={loading}
                    >
                        СОХРАНИТЬ ПРОФИЛЬ
                    </Button>
                </form>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Paper>
        </Box>
    );
}
