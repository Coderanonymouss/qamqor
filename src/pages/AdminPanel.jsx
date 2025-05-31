import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import {
    Box, Paper, Avatar, Typography, Grid, Card, CardContent, Button
} from "@mui/material";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from "@mui/icons-material/Group";
import PeopleIcon from "@mui/icons-material/People";
import ForumIcon from "@mui/icons-material/Forum";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LogoutIcon from '@mui/icons-material/Logout';

export default function AdminPanel() {
    const [admin, setAdmin] = useState(null);
    const [doctorsCount, setDoctorsCount] = useState(0);
    const [patientsCount, setPatientsCount] = useState(0);
    const [messagesCount, setMessagesCount] = useState(0);

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            // Можно загрузить профиль админа из Firestore, если нужно
            setAdmin({
                fullName: currentUser.displayName || currentUser.email || "Администратор",
                email: currentUser.email,
            });
        }

        // Загрузить статистику по ролям (пример, если есть коллекция "User")
        const fetchCounts = async () => {
            // Врачи
            const doctorsSnap = await getDocs(collection(db, "User"));
            let doctors = 0, patients = 0;
            doctorsSnap.forEach(doc => {
                const data = doc.data();
                if (data.type === "Doctor") doctors++;
                if (data.type === "Patient") patients++;
            });
            setDoctorsCount(doctors);
            setPatientsCount(patients);

            // Можно добавить подсчёт сообщений, если есть коллекция "Messages"
            // setMessagesCount(messagesSnap.size);
        };
        fetchCounts();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        window.location.reload();
    };

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)", p: 5 }}>
            <Paper elevation={6} sx={{ p: 5, borderRadius: 4, maxWidth: 650, mx: "auto" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Avatar sx={{ bgcolor: "error.main", width: 56, height: 56, mr: 2 }}>
                        <AdminPanelSettingsIcon sx={{ fontSize: 36 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Админ-панель {admin ? admin.fullName : ""}
                        </Typography>
                        <Typography color="text.secondary">{admin ? admin.email : ""}</Typography>
                    </Box>
                </Box>
                <Grid container spacing={3} mb={2}>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ textAlign: "center", borderRadius: 3 }}>
                            <CardContent>
                                <GroupIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h5">{doctorsCount}</Typography>
                                <Typography color="text.secondary">Врачей</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ textAlign: "center", borderRadius: 3 }}>
                            <CardContent>
                                <PeopleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h5">{patientsCount}</Typography>
                                <Typography color="text.secondary">Пациентов</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ textAlign: "center", borderRadius: 3 }}>
                            <CardContent>
                                <ForumIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="h5">{messagesCount}</Typography>
                                <Typography color="text.secondary">Cообщений</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<AddCircleOutlineIcon />}
                        sx={{ mr: 2, borderRadius: 2 }}
                        onClick={() => alert("Переход на добавление врача (реализуй свой роут)")}
                    >
                        Добавить врача
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<LogoutIcon />}
                        sx={{ borderRadius: 2 }}
                        onClick={handleLogout}
                    >
                        Выйти
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
