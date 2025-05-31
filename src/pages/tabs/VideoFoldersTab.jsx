import React, { useEffect, useState } from "react";
import {
    Box, Paper, Typography, Button, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { db, auth } from "../../../firebase.json";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import VideoListTab from "../doctor/VideoListTab.jsx";

export default function VideoFoldersTab() {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [editingFolder, setEditingFolder] = useState(null);
    const [selectedFolder, setSelectedFolder] = useState(null);

    // Загрузка папок
    useEffect(() => {
        const fetchFolders = async () => {
            setLoading(true);
            const q = query(collection(db, "video_folders"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        };
        fetchFolders();
    }, [openDialog]); // обновляем при изменениях

    // Добавить или редактировать папку
    const handleSave = async () => {
        if (!folderName.trim()) return;
        if (editingFolder) {
            // Редактирование
            await updateDoc(doc(db, "video_folders", editingFolder.id), { name: folderName });
        } else {
            // Добавление
            await addDoc(collection(db, "video_folders"), {
                name: folderName,
                createdBy: auth.currentUser?.email || "",
                createdAt: serverTimestamp(),
            });
        }
        setOpenDialog(false);
        setFolderName("");
        setEditingFolder(null);
    };

    // Удалить папку
    const handleDelete = async (id) => {
        if (window.confirm("Удалить папку и все видео в ней?")) {
            await deleteDoc(doc(db, "video_folders", id));
            setFolders(folders.filter(f => f.id !== id));
        }
    };

    // Если выбрана папка — показываем список видео
    if (selectedFolder) {
        return (
            <VideoListTab
                folder={selectedFolder}
                onBack={() => setSelectedFolder(null)}
            />
        );
    }

    return (
        <Box>
            <Typography variant="h5" mb={2}>Папки видеоуроков</Typography>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ mb: 2 }}
                onClick={() => { setOpenDialog(true); setEditingFolder(null); setFolderName(""); }}
            >
                Добавить папку
            </Button>
            {loading ? (
                <CircularProgress />
            ) : (
                <Paper>
                    <List>
                        {folders.map(folder => (
                            <ListItem
                                key={folder.id}
                                secondaryAction={
                                    <>
                                        <IconButton onClick={() => { setEditingFolder(folder); setFolderName(folder.name); setOpenDialog(true); }}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(folder.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </>
                                }
                                button
                                onClick={() => setSelectedFolder(folder)}
                            >
                                <ListItemText primary={folder.name} />
                            </ListItem>
                        ))}
                        {folders.length === 0 && (
                            <ListItem>
                                <ListItemText primary="Папок нет. Добавьте первую!" />
                            </ListItem>
                        )}
                    </List>
                </Paper>
            )}

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>{editingFolder ? "Редактировать папку" : "Создать папку"}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Название папки"
                        type="text"
                        fullWidth
                        value={folderName}
                        onChange={e => setFolderName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleSave}>Сохранить</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
