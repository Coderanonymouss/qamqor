import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import {
    Box, Card, CardContent, Avatar, Typography, CircularProgress,
    Divider, Stack, Chip, Button, List, ListItem, ListItemIcon, ListItemText,
    Dialog, DialogTitle, DialogContent, DialogActions, ListItemButton, Alert
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FolderIcon from "@mui/icons-material/Folder";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";

export default function UserProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [folders, setFolders] = useState([]);
    const [foldersLoading, setFoldersLoading] = useState(true);

    // Для выбора папки
    const [catalogFolders, setCatalogFolders] = useState([]);
    const [selectDialogOpen, setSelectDialogOpen] = useState(false);
    const [addError, setAddError] = useState("");

    // 1. Загрузка информации о пользователе и его враче (если это пациент)
    useEffect(() => {
        async function fetchData() {
            const userSnap = await getDoc(doc(db, "User", id));
            if (!userSnap.exists()) {
                setUser(null);
                setLoading(false);
                return;
            }
            const userData = userSnap.data();
            setUser(userData);
            if (userData.type === "Patient" && userData.doctorUid) {
                const doctorSnap = await getDoc(doc(db, "User", userData.doctorUid));
                if (doctorSnap.exists()) setDoctor(doctorSnap.data());
            }
            setLoading(false);
        }
        fetchData();
    }, [id]);

    // 2. Загрузка папок пользователя
    const loadFolders = async () => {
        setFoldersLoading(true);
        const q = query(collection(db, "video_folders"), where("ownerId", "==", id));
        const snap = await getDocs(q);
        const items = [];
        snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        setFolders(items);
        setFoldersLoading(false);
    };
    useEffect(() => { if (id) loadFolders(); }, [id]);

    // 3. Загрузка каталога всех папок (шаблонов)
    const loadCatalogFolders = async () => {
        const snap = await getDocs(collection(db, "video_folders"));
        const items = [];
        snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        setCatalogFolders(items);
    };

    // 4. Открыть диалог выбора папки
    const handleAddFolderDialog = async () => {
        await loadCatalogFolders();
        setSelectDialogOpen(true);
        setAddError("");
    };

    // 5. При выборе папки — привязать её пользователю
    const handleChooseCatalogFolder = async (catalogFolder) => {
        // Проверка: уже есть такая папка у пользователя?
        if (folders.some(f => f.catalogId === catalogFolder.id)) {
            setAddError("Эта папка уже добавлена пользователю.");
            return;
        }
        try {
            await addDoc(collection(db, "video_folders"), {
                name: catalogFolder.name,
                catalogId: catalogFolder.id,
                ownerId: id,
                createdAt: serverTimestamp()
            });
            setSelectDialogOpen(false);
            setAddError("");
            await loadFolders();
        } catch (e) {
            setAddError("Ошибка при добавлении папки: " + e.message);
        }
    };

    if (loading) {
        return <Box textAlign="center" mt={8}><CircularProgress /></Box>;
    }
    if (!user) {
        return <Box textAlign="center" mt={8}><Typography>Пользователь не найден.</Typography></Box>;
    }

    return (
        <Box display="flex" justifyContent="center" mt={6} px={2}>
            <Card sx={{
                maxWidth: 520, width: "100%", p: { xs: 2, md: 4 }, borderRadius: 5, boxShadow: 6,
                background: "linear-gradient(120deg,#f5f7fa 0%,#c3cfe2 100%)"
            }}>
                <Button
                    variant="text"
                    color="primary"
                    startIcon={<ArrowBackIcon />}
                    sx={{ mb: 2, fontWeight: 600, fontSize: 16 }}
                    onClick={() => navigate(-1)}
                >
                    Назад
                </Button>
                <Box display="flex" alignItems="center" mb={3}>
                    <Avatar sx={{
                        width: 72, height: 72,
                        bgcolor: user.type === "Patient" ? "primary.main" : "success.main",
                        fontSize: 38, mr: 2
                    }}>
                        {user.fullName?.[0] || user.firstName?.[0] || user.email?.[0] || <PersonIcon fontSize="large" />}
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            {user.fullName ||
                                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                user.email}
                        </Typography>
                        <Chip
                            label={user.type === "Patient" ? "Пациент" : user.type === "Doctor" ? "Врач" : user.type}
                            color={user.type === "Patient" ? "primary" : "success"}
                            size="small"
                            sx={{ mt: 1, fontWeight: 600, fontSize: 15, px: 1.5 }}
                        />
                        {user.specialite && (
                            <Typography color="text.secondary" fontSize={14} mt={1}>
                                {user.specialite}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <CardContent>
                    <Typography><b>Email:</b> {user.email}</Typography>
                    {user.tel && <Typography><b>Телефон:</b> {user.tel}</Typography>}
                    {user.address && <Typography><b>Адрес:</b> {user.address}</Typography>}
                    {user.type === "Patient" && doctor && (
                        <Box mt={3} mb={1}>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="h6" color="secondary" gutterBottom>
                                <LocalHospitalIcon fontSize="small" sx={{ mr: 1, mb: "-3px" }} />
                                Врач пациента
                            </Typography>
                            <Card variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: "#f6fafe" }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{ bgcolor: "info.light", width: 56, height: 56 }}>
                                        {doctor.fullName?.[0] || doctor.firstName?.[0] || <PersonIcon />}
                                    </Avatar>
                                    <Box>
                                        <Typography fontWeight={600}>
                                            {doctor.fullName || `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim()}
                                        </Typography>
                                        <Typography fontSize={14} color="text.secondary">{doctor.email}</Typography>
                                        {doctor.tel && <Typography fontSize={13} color="text.secondary">{doctor.tel}</Typography>}
                                    </Box>
                                </Stack>
                            </Card>
                        </Box>
                    )}

                    {/* Список папок */}
                    <Box mt={5} mb={1}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography variant="h6">
                                <FolderIcon sx={{ mb: "-5px", mr: 1, color: "primary.main" }} />
                                Загруженные папки пользователя
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<AddIcon />}
                                variant="outlined"
                                onClick={handleAddFolderDialog}
                            >
                                Добавить папку
                            </Button>
                        </Stack>
                        {foldersLoading ? (
                            <CircularProgress size={28} sx={{ mt: 2 }} />
                        ) : folders.length > 0 ? (
                            <List dense>
                                {folders.map(folder => (
                                    <ListItem
                                        key={folder.id}
                                        button
                                        onClick={() => navigate(`/folders/${folder.id}`)} // переход на просмотр папки
                                    >
                                        <ListItemIcon><FolderIcon color="primary" /></ListItemIcon>
                                        <ListItemText
                                            primary={folder.name || folder.id}
                                            secondary={"folderId: " + folder.id}
                                        />
                                    </ListItem>
                                ))}
                            </List>

                        ) : (
                            <Typography color="text.secondary" mt={2}>
                                У пользователя <b>нет добавленных папок</b>
                            </Typography>
                        )}
                    </Box>

                    {/* Диалог выбора папки */}
                    <Dialog open={selectDialogOpen} onClose={() => setSelectDialogOpen(false)} maxWidth="xs" fullWidth>
                        <DialogTitle>Выберите папку для добавления</DialogTitle>
                        <DialogContent>
                            {catalogFolders.length === 0 && (
                                <Typography color="text.secondary">Нет доступных папок для добавления.</Typography>
                            )}
                            <List>
                                {catalogFolders.map(folder => (
                                    <ListItemButton
                                        key={folder.id}
                                        onClick={() => handleChooseCatalogFolder(folder)}
                                        disabled={folders.some(f => f.catalogId === folder.id)}
                                    >
                                        <ListItemIcon><FolderIcon /></ListItemIcon>
                                        <ListItemText
                                            primary={folder.name}
                                            secondary={
                                                folders.some(f => f.catalogId === folder.id)
                                                    ? "Уже добавлена"
                                                    : ""
                                            }
                                        />
                                    </ListItemButton>
                                ))}
                            </List>
                            {addError && <Alert severity="warning" sx={{ mt: 1 }}>{addError}</Alert>}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectDialogOpen(false)} color="primary">
                                Отмена
                            </Button>
                        </DialogActions>
                    </Dialog>
                </CardContent>
            </Card>
        </Box>
    );
}
