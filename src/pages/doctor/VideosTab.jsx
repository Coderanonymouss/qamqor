import React, { useEffect, useState } from "react";
import {
    Box, Card, CardContent, Typography, Button,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Menu, MenuItem, Alert
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FolderIcon from "@mui/icons-material/Folder";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
    collection, addDoc, onSnapshot, serverTimestamp,
    deleteDoc, doc, updateDoc
} from "firebase/firestore";
import { db } from "../../firebase.jsx";
import VideosInFolder from "./VideosInFolder.jsx";

export default function VideosTab({ user }) {
    const [folders, setFolders] = useState([]);
    const [filteredFolders, setFilteredFolders] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [open, setOpen] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [error, setError] = useState("");
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "video_folders"), snap => {
            const foldersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFolders(foldersData);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const lower = searchText.toLowerCase();
        const filtered = folders.filter(f =>
            f.name.toLowerCase().includes(lower)
        );
        setFilteredFolders(filtered);
    }, [searchText, folders]);

    const handleCreateOrEdit = async () => {
        setError("");
        if (!folderName.trim()) {
            setError("Введите название папки");
            return;
        }

        if (editMode && currentFolder) {
            await updateDoc(doc(db, "video_folders", currentFolder.id), {
                name: folderName
            });
        } else {
            await addDoc(collection(db, "video_folders"), {
                name: folderName,
                createdBy: user?.email || "",
                createdByName: user?.fullName || "Неизвестно",
                createdAt: serverTimestamp(),
            });
        }

        setFolderName("");
        setOpen(false);
        setEditMode(false);
    };

    const handleMenuOpen = (event, folder) => {
        setAnchorEl(event.currentTarget);
        setCurrentFolder(folder);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setCurrentFolder(null);
    };

    const handleEdit = () => {
        setEditMode(true);
        setFolderName(currentFolder.name);
        setOpen(true);
        handleMenuClose();
    };

    const handleDelete = (folder) => {
        setFolderToDelete(folder);
        setConfirmDeleteOpen(true);
        handleMenuClose();
    };

    const handleDeleteConfirmed = async () => {
        if (folderToDelete) {
            await deleteDoc(doc(db, "video_folders", folderToDelete.id));
            setConfirmDeleteOpen(false);
            setFolderToDelete(null);
        }
    };

    if (selectedFolder) {
        return <VideosInFolder folder={selectedFolder} onBack={() => setSelectedFolder(null)} />;
    }

    return (
        <Box sx={{ flexGrow: 1, minHeight: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ maxWidth: "100%", px: 3, py: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4" fontWeight="bold" color="white">
                        Папки с видеоуроками
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpen(true)}
                    >
                        Добавить папку
                    </Button>
                </Box>

                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Поиск по названию папки..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    sx={{ mb: 3 }}
                />

                {filteredFolders.length === 0 ? (
                    <Alert severity="info">Папок не найдено. Измените запрос или создайте новую.</Alert>
                ) : (
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
                        {filteredFolders.map(folder => (
                            <Card
                                key={folder.id}
                                sx={{
                                    width: 220,
                                    height: 160,
                                    p: 2,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    position: "relative",
                                    borderRadius: 3,
                                    boxShadow: 6,
                                    transition: "0.2s",
                                    cursor: "pointer",
                                    backgroundColor: "rgba(255,255,255,0.85)",
                                    "&:hover": {
                                        boxShadow: 12,
                                        backgroundColor: "rgba(240,248,255,0.95)"
                                    }
                                }}
                                onClick={() => setSelectedFolder(folder)}
                            >
                                <IconButton
                                    sx={{ position: "absolute", top: 6, right: 6 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMenuOpen(e, folder);
                                    }}
                                >
                                    <MoreVertIcon />
                                </IconButton>

                                <FolderIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                                <CardContent sx={{ textAlign: "center", p: 0 }}>
                                    <Typography fontWeight="bold" fontSize={16}>
                                        {folder.name}
                                    </Typography>
                                    <Typography fontSize={13} color="text.secondary">
                                        Создано: {folder.createdByName || folder.createdBy}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}
            </Box>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleEdit}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Изменить
                </MenuItem>
                <MenuItem onClick={() => handleDelete(currentFolder)}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Удалить
                </MenuItem>
            </Menu>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{editMode ? "Изменить папку" : "Создать папку"}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Название папки"
                        fullWidth
                        value={folderName}
                        onChange={e => setFolderName(e.target.value)}
                        error={!!error}
                        helperText={error}
                        autoFocus
                        margin="dense"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleCreateOrEdit}>
                        {editMode ? "Сохранить" : "Создать"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Удалить папку?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы уверены, что хотите удалить папку{" "}
                        <strong>{folderToDelete?.name}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDeleteOpen(false)}>Отмена</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteConfirmed}>
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
