// pages/DoctorPanel.jsx — версия с pages вместо табов и обновлённым дизайном
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import {
    Box, Paper, Avatar, Typography, Button, CircularProgress, Stack
} from "@mui/material";
import { Outlet, useNavigate, Routes, Route, Link } from "react-router-dom";
import GroupIcon from "@mui/icons-material/Group";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import ChatIcon from "@mui/icons-material/Chat";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";

import Dashboard from "./doctor/Dashboard";
import Patients from "./doctor/Patients";
import VideosTab from "./doctor/VideosTab";
import ChatTab from ".//doctor//Chat.jsx";
import EditProfileTab from "./doctor/EditProfileTab";
import PatientProfile from "./doctor/PatientProfile";
import AddPatientWeb from "./doctor/AddPatientWeb.jsx";
import PatientsAnalyticsPage from "./doctor/PatientsAnalyticsPage.jsx";
import SelectFolder from "./doctor/SelectFolder.jsx";


export default function DoctorPanel({ onLogout }) {
    const [user, setUser] = useState(null);
    

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            const fetchUser = async () => {
                const ref = doc(db, "User", currentUser.uid);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    setUser(snap.data());
                }
            };
            fetchUser();
        }
    }, []);

    if (!user) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    const navItems = [
        { label: "Главная", icon: <DashboardIcon />, path: "/doctor/dashboard", color: "info" },
        { label: "Пациенты", icon: <GroupIcon />, path: "/doctor/patients", color: "primary" },
        { label: "Видеоуроки", icon: <VideoLibraryIcon />, path: "/doctor/videos", color: "success" },
        { label: "Чат", icon: <ChatIcon />, path: "/doctor/chat", color: "secondary" },
        { label: "Аналитика", icon: <BarChartIcon />, path: "/doctor/analytics", color: "secondary" },
        { label: "Редактировать", icon: <EditIcon />, path: "/doctor/edit", color: "warning" },
    ];

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            <Box sx={{
                width: 350,
                background: "linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)",
                p: 2,
                minHeight: "100vh"
            }}>
                <Paper elevation={6} sx={{ p: 3, borderRadius: 4, mb: 4 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Avatar src={user.photoUrl} sx={{ width: 70, height: 70, mb: 2, fontSize: 36 }}>
                            {user.fullName ? user.fullName[0] : "D"}
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold" mb={1}>{user.fullName}</Typography>
                        <Typography color="primary" fontWeight={500} mb={1}>
                            {user.specialite || "Без специализации"}
                        </Typography>
                    </Box>
                    <Typography color="text.secondary" gutterBottom>Email: <b>{user.email}</b></Typography>
                    <Typography color="text.secondary" gutterBottom>Телефон: <b>{user.tel}</b></Typography>
                    <Typography color="text.secondary" gutterBottom>Дата рождения: <b>{user.birthday}</b></Typography>
                </Paper>

                <Stack spacing={1}>
                    {navItems.map((item, index) => (
                        <Button
                            key={index}
                            component={Link}
                            to={item.path}
                            fullWidth
                            variant="outlined"
                            color={item.color}
                            startIcon={item.icon}
                            sx={{ borderRadius: 3, fontWeight: 500 }}
                        >
                            {item.label}
                        </Button>
                    ))}
                    <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<LogoutIcon />}
                        sx={{ borderRadius: 3, mt: 1 }}
                        onClick={() => {
                            auth.signOut();
                            if (onLogout) onLogout();
                        }}
                    >
                        Выйти
                    </Button>
                </Stack>
            </Box>

            <Box
                sx={{
                    flexGrow: 1,
                    backgroundImage: `url("/images/photo.jpg")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    minHeight: "100vh",
                    p: 4
                }}
            >
                <Routes>

                    <Route path="/doctor/add-patient" element={<AddPatientWeb/>} />
                    <Route path="/select-folder/:id" element={<SelectFolder />} />
                    <Route path="/doctor/patient-profile/:id" element={<PatientProfile />} />
                    <Route path="/doctor/dashboard" element={<Dashboard />} />
                    <Route path="/doctor/patients" element={<Patients />} />
                    <Route path="/doctor/videos" element={<VideosTab />} />
                    <Route path="/doctor/chat" element={<ChatTab user={user} />} />
                    <Route path="/doctor/analytics" element={<PatientsAnalyticsPage user={user} />} />
                    <Route path="/doctor/edit" element={<EditProfileTab user={user} />} />
                </Routes>
                <Outlet />
            </Box>
        </Box>
    );
}