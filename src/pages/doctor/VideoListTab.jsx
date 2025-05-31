import React, { useEffect, useState } from "react";
import {
    Box, Typography, Button, Paper, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { db } from "../../firebase.jsx";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";

export default function VideoListTab({ folder, onBack }) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [videoTitle, setVideoTitle] = useState("");
    const [videoUrl, setVideoUrl] = useState("");

    useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true);
            const q = query(collection(db, "video_folders", folder.id, "videos"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        };
        fetchVideos();
    }, [folder, openDialog]);

    // Добавить видео
    const handleSave = async () => {
        if (!videoTitle.trim() || !videoUrl.trim()) return;
        await addDoc(collection(db, "video_folders", folder.id, "videos"), {
            title: videoTitle,
            videoUrl,
            createdAt: serverTimestamp(),
        });
        setOpenDialog(false);
        setVideoTitle("");
        setVideoUrl("");
    };

    // Удалить видео
    const handleDelete = async (id) => {
        if (window.confirm("Удалить видео?")) {
            await deleteDoc(doc(db, "video_folders", folder.id, "videos", id));
            setVideos(videos.filter(v => v.id !== id));
        }
    };

    return (
        <Box>
            <Button startIcon={<ArrowBackIcon />} sx={{ mb: 2 }} onClick={onBack}>
                Назад к папкам
            </Button>
            <Typography variant="h6" mb={2}>
                Видеоуроки в папке: <b>{folder.name}</b>
            </Typography>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ mb: 2 }}
                onClick={() => setOpenDialog(true)}
            >
                Добавить видео
            </Button>
            {loading ? (
                <CircularProgress />
            ) : (
                <Paper>
                    <List>
                        {videos.map(video => (
                            <ListItem
                                key={video.id}
                                secondaryAction={
                                    <IconButton onClick={() => handleDelete(video.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                }
                                button
                                onClick={() => window.open(video.videoUrl, "_blank")}
                            >
                                <ListItemText primary={video.title} secondary={video.videoUrl} />
                            </ListItem>
                        ))}
                        {videos.length === 0 && (
                            <ListItem>
                                <ListItemText primary="Видеоуроков нет" />
                            </ListItem>
                        )}
                    </List>
                </Paper>
            )}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Добавить видео</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Название"
                        type="text"
                        fullWidth
                        value={videoTitle}
                        onChange={e => setVideoTitle(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="YouTube-ссылка или URL видео"
                        type="text"
                        fullWidth
                        value={videoUrl}
                        onChange={e => setVideoUrl(e.target.value)}
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
