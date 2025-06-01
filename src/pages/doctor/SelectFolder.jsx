import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, Button, Card, List, ListItem, ListItemText, Divider, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar } from "@mui/material";
import { db } from "../../firebase"; // Убедитесь, что этот путь правильный
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";

export default function SelectFolder() {
    const { id } = useParams();  // Получаем id пациента
    const navigate = useNavigate();
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false); // Состояние для открытия/закрытия диалога
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [existingFolder, setExistingFolder] = useState(null); // Состояние для проверки существующей папки
    const [openSnackbar, setOpenSnackbar] = useState(false); // Состояние для отображения Snackbar

    useEffect(() => {
        // Загрузка папок из Firestore
        const fetchFolders = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "video_folders"));
                const foldersData = [];
                querySnapshot.forEach((doc) => {
                    foldersData.push({ id: doc.id, name: doc.data().name });
                });
                setFolders(foldersData);
            } catch (error) {
                console.error("Error loading folders: ", error);
            } finally {
                setLoading(false);
            }
        };

        // Проверяем, есть ли уже папка у пациента
        const checkExistingFolder = async () => {
            const patientRef = doc(db, "Patient", id);
            const patientDoc = await getDoc(patientRef);
            if (patientDoc.exists()) {
                const folderId = patientDoc.data().folderId;
                if (folderId) {
                    const folderRef = doc(db, "video_folders", folderId);
                    const folderDoc = await getDoc(folderRef);
                    if (folderDoc.exists()) {
                        setExistingFolder(folderDoc.data().name); // Получаем имя текущей папки
                    }
                }
            }
        };

        fetchFolders();
        checkExistingFolder();
    }, [id]);

    const handleSelectFolder = (folderId) => {
        setSelectedFolderId(folderId);
        setOpenDialog(true); // Открытие диалогового окна
    };

    const handleDialogClose = (confirm) => {
        setOpenDialog(false); // Закрытие диалога

        if (confirm) {
            saveFolder(selectedFolderId); // Если подтверждено, сохраняем папку
        }
    };

    const saveFolder = async (folderId) => {
        try {
            // Сохраняем folderId в профиль пациента в коллекции "Patient"
            const patientRef = doc(db, "Patient", id);
            await updateDoc(patientRef, {
                folderId: folderId
            });

            // После успешного сохранения папки, показываем Snackbar
            setOpenSnackbar(true); // Показываем Snackbar
            setTimeout(() => {
                navigate(`/doctor/patient-profile/${id}`, { state: { selectedFolderId: folderId } });
            }, 2000); // Перенаправляем на страницу пациента после 2 секунд

        } catch (error) {
            console.error("Error saving folder ID: ", error);
            alert("Ошибка при сохранении папки");
        }
    };

    const handleSnackbarClose = () => {
        setOpenSnackbar(false); // Закрыть Snackbar
    };

    if (loading) {
        return <Box textAlign="center" mt={5}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
            <Typography variant="h4" gutterBottom align="center">
                Выберите папку для пациента
            </Typography>

            <Card sx={{ p: 2 }}>
                <List>
                    {folders.length === 0 ? (
                        <Typography variant="body1" color="text.secondary" align="center">
                            Нет доступных папок. Пожалуйста, создайте папки для загрузки видео.
                        </Typography>
                    ) : (
                        folders.map((folder) => (
                            <React.Fragment key={folder.id}>
                                <ListItem button onClick={() => handleSelectFolder(folder.id)}>
                                    <ListItemText primary={folder.name} />
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))
                    )}
                </List>
            </Card>

            <Button
                variant="contained"
                color="primary"
                sx={{ mt: 3 }}
                onClick={() => navigate(`/doctor/patient-profile/${id}`)}
            >
                Назад к профилю пациента
            </Button>

            {/* Диалоговое окно для подтверждения выбора папки */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
            >
                <DialogTitle>
                    {existingFolder ? `Изменить папку пациента?` : `Добавить видеопапку для пациента?`}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        {existingFolder
                            ? `Пациенту уже была назначена папка "${existingFolder}". Вы хотите заменить её на "${folders.find(folder => folder.id === selectedFolderId)?.name}"?`
                            : `Вы уверены, что хотите добавить эту видеопапку для пациента?`}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleDialogClose(false)} color="primary">
                        Нет
                    </Button>
                    <Button onClick={() => handleDialogClose(true)} color="primary">
                        Да
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar для уведомления об успешном сохранении папки */}
            <Snackbar
                open={openSnackbar}
                autoHideDuration={2000}
                onClose={handleSnackbarClose}
                message="Папка успешно назначена пациенту!"
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            />
        </Box>
    );
}
