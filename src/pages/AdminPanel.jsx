import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { secondaryAuth } from "../firebaseDoctor";
import {
    signOut, sendPasswordResetEmail, createUserWithEmailAndPassword
} from "firebase/auth";
import {
    collection, getDocs, doc, getDoc, setDoc, query, where
} from "firebase/firestore";
import {
    Box, Paper, Avatar, Typography, Grid, Card, CardContent, Button,
    CircularProgress, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Alert
} from "@mui/material";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from "@mui/icons-material/Group";
import PeopleIcon from "@mui/icons-material/People";
import ForumIcon from "@mui/icons-material/Forum";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LogoutIcon from "@mui/icons-material/Logout";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

export default function AdminPanel() {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [doctorsCount, setDoctorsCount] = useState(0);
    const [patientsCount, setPatientsCount] = useState(0);
    const [messagesCount, setMessagesCount] = useState(0);
    const navigate = useNavigate();

    // Для таблицы пользователей
    const [allUsers, setAllUsers] = useState([]);
    const [search, setSearch] = useState("");

    // Для модального окна добавления врача
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [newDoctor, setNewDoctor] = useState({
        email: "",
        fullName: "",
        specialite: ""
    });
    const [addError, setAddError] = useState("");
    const [addSuccess, setAddSuccess] = useState("");
    const [adding, setAdding] = useState(false);

    // Загрузка профиля админа, статистики и пользователей
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const currentUser = auth.currentUser;

            // Загружаем данные админа из Firestore
            let adminProfile = {
                fullName: currentUser.displayName || currentUser.email || "Администратор",
                email: currentUser.email,
            };
            try {
                const snap = await getDoc(doc(db, "User", currentUser.uid));
                if (snap.exists()) {
                    const data = snap.data();
                    adminProfile = {
                        fullName: data.firstName || data.fullName || data.email,
                        email: data.email,
                        tel: data.tel,
                        address: data.address,
                        type: data.type,
                    };
                }
            } catch (e) {}
            setAdmin(adminProfile);

            // Подсчёт ролей
            let doctors = 0, patients = 0;
            const doctorsSnap = await getDocs(collection(db, "User"));
            const usersArr = [];
            doctorsSnap.forEach(docu => {
                const data = docu.data();
                if (data.type === "Doctor") doctors++;
                if (data.type === "Patient") patients++;
                usersArr.push({
                    id: docu.id,
                    name: data.fullName
                        || `${data.firstName || ""} ${data.lastName || ""}`.trim()
                        || data.email,
                    email: data.email,
                    type: data.type,
                    tel: data.tel,
                });
            });
            setDoctorsCount(doctors);
            setPatientsCount(patients);

            setAllUsers(usersArr);
            setLoading(false);
        };
        fetchData();
    }, []);

    // Добавить нового врача (email + ФИО)
    const handleAddDoctor = async (e) => {
        e.preventDefault();
        setAddError("");
        setAddSuccess("");
        setAdding(true);

        const { email, fullName, specialite } = newDoctor;
        if (!email || !fullName || !specialite) {
            setAddError("Заполните все обязательные поля.");
            setAdding(false);
            return;
        }

        try {
            // Проверка, есть ли такой email в коллекции User
            const q = query(collection(db, "User"), where("email", "==", email));
            const snap = await getDocs(q);
            if (!snap.empty) {
                setAddError("Пользователь с таким email уже существует.");
                setAdding(false);
                return;
            }

            // --- Используем secondaryAuth ---
            const cred = await createUserWithEmailAndPassword(secondaryAuth, email, "temporary123");

            // Firestore User
            await setDoc(doc(db, "User", cred.user.uid), {
                email,
                fullName,
                specialite,
                type: "Doctor",
                uid: cred.user.uid,
                createdAt: new Date().toISOString()
            });

            // Firestore Doctor
            await setDoc(doc(db, "Doctor", cred.user.uid), {
                email,
                fullName,
                specialite,
                type: "Doctor",
                uid: cred.user.uid,
                firstSigninCompleted: false,

                createdAt: new Date().toISOString()
            });

            // Письмо для создания пароля
            await sendPasswordResetEmail(secondaryAuth, email);

            setAddSuccess("Врач добавлен! Ему отправлено письмо для установки пароля.");
            setNewDoctor({ email: "", fullName: "", specialite: "" });

            setTimeout(() => {
                setOpenAddDialog(false);
                setAddSuccess("");
                window.location.reload();
            }, 1600);

        } catch (e) {
            setAddError(e.message);
        }
        setAdding(false);
    };

    const handleLogout = async () => {
        await signOut(auth);
        window.location.reload();
    };

    const columns = [
        { field: "name", headerName: "ФИО", width: 170 },
        { field: "email", headerName: "Email", width: 210 },
        { field: "type", headerName: "Роль", width: 120 },
        { field: "tel", headerName: "Телефон", width: 140 },
        {
            field: "actions",
            headerName: "Действия",
            width: 120,
            renderCell: (params) => (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/admin/user-profile/${params.row.id}`)}
                >
                    Профиль
                </Button>
            ),
        },
    ];

    // Фильтрация по поиску
    const filteredUsers = allUsers.filter((u) =>
        (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.type || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.tel || "").toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: "100vh",
            background: "linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)",
            p: { xs: 1, sm: 5 }
        }}>
            {/* Диалог добавления врача */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Добавить нового врача</DialogTitle>
                <form onSubmit={handleAddDoctor}>
                    <DialogContent>
                        <TextField
                            margin="normal"
                            label="Email"
                            fullWidth
                            value={newDoctor.email}
                            onChange={e => setNewDoctor({ ...newDoctor, email: e.target.value })}
                            type="email"
                            required
                        />
                        <TextField
                            margin="normal"
                            label="ФИО"
                            fullWidth
                            value={newDoctor.fullName}
                            onChange={e => setNewDoctor({ ...newDoctor, fullName: e.target.value })}
                            required
                        />
                        <TextField
                            margin="normal"
                            label="Специализация"
                            fullWidth
                            value={newDoctor.specialite}
                            onChange={e => setNewDoctor({ ...newDoctor, specialite: e.target.value })}
                            required
                        />
                        {addError && <Alert severity="error" sx={{ mt: 2 }}>{addError}</Alert>}
                        {addSuccess && <Alert severity="success" sx={{ mt: 2 }}>{addSuccess}</Alert>}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenAddDialog(false)} color="inherit" disabled={adding}>Отмена</Button>
                        <Button type="submit" variant="contained" color="primary" disabled={adding}>
                            {adding ? "Добавление..." : "Добавить"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Paper elevation={6} sx={{
                p: { xs: 2, sm: 5 },
                borderRadius: 4,
                maxWidth: 900,
                mx: "auto",
                mt: { xs: 2, sm: 5 }
            }}>
                <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                    <Avatar sx={{ bgcolor: "error.main", width: 64, height: 64 }}>
                        <AdminPanelSettingsIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            {admin.fullName}
                        </Typography>
                        <Typography color="text.secondary">{admin.email}</Typography>
                        {admin.tel && (
                            <Typography color="text.secondary">Телефон: <b>{admin.tel}</b></Typography>
                        )}
                        {admin.address && (
                            <Typography color="text.secondary">Адрес: <b>{admin.address}</b></Typography>
                        )}
                        <Typography color="secondary" fontWeight={500}>
                            {admin.type === "Admin" ? "Администратор" : ""}
                        </Typography>
                    </Box>
                </Stack>

                <Grid container spacing={3} mb={2}>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ textAlign: "center", borderRadius: 3, boxShadow: 1 }}>
                            <CardContent>
                                <GroupIcon color="primary" sx={{ fontSize: 42, mb: 1 }} />
                                <Typography variant="h5">{doctorsCount}</Typography>
                                <Typography color="text.secondary">Врачей</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ textAlign: "center", borderRadius: 3, boxShadow: 1 }}>
                            <CardContent>
                                <PeopleIcon color="success" sx={{ fontSize: 42, mb: 1 }} />
                                <Typography variant="h5">{patientsCount}</Typography>
                                <Typography color="text.secondary">Пациентов</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{ textAlign: "center", borderRadius: 3, boxShadow: 1 }}>
                            <CardContent>
                                <ForumIcon color="secondary" sx={{ fontSize: 42, mb: 1 }} />
                                <Typography variant="h5">{messagesCount}</Typography>
                                <Typography color="text.secondary">Cообщений</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={3}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddCircleOutlineIcon />}
                        sx={{ borderRadius: 2, minWidth: 200 }}
                        onClick={() => setOpenAddDialog(true)}
                    >
                        Добавить врача
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<LogoutIcon />}
                        sx={{ borderRadius: 2, minWidth: 200 }}
                        onClick={handleLogout}
                    >
                        Выйти
                    </Button>
                </Stack>

                {/* Таблица пользователей */}
                <Box sx={{ mt: 6, p: 2, bgcolor: "#fff", borderRadius: 4, boxShadow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        Все пользователи системы
                    </Typography>
                    <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                        <SearchIcon sx={{ mr: 1 }} />
                        <input
                            type="text"
                            placeholder="Поиск по ФИО, email, роли, телефону"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                padding: 8,
                                borderRadius: 8,
                                border: "1px solid #ccc",
                                width: 300,
                                outline: "none"
                            }}
                        />
                    </Box>
                    <div style={{ height: 370, width: "100%" }}>
                        <DataGrid
                            rows={filteredUsers}
                            columns={columns}
                            pageSize={5}
                            rowsPerPageOptions={[5, 10]}
                            disableSelectionOnClick
                        />
                    </div>
                </Box>
            </Paper>
        </Box>
    );
}
