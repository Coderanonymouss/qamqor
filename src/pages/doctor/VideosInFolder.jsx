import React, { useEffect, useState } from "react";
import {
    Box, Button, Typography, Card, CardMedia, CardContent, Stack,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { db, storage } from "../../firebase.jsx";
import {
    collection, addDoc, onSnapshot, serverTimestamp, query, orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function VideosInFolder({ folder, onBack }) {
    const [videos, setVideos] = useState([]);
    const [open, setOpen] = useState(false);
    const [videoTitle, setVideoTitle] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [videoFile, setVideoFile] = useState(null);

    // 🔒 Безопасность: не рендерим, пока folder не загружен
    if (!folder || !folder.id || !folder.name) {
        return (
            <Box textAlign="center" mt={5}>
                <Typography>Папка не выбрана или не загружена...</Typography>
            </Box>
        );
    }

    // 📥 Получение видео из подколлекции "Videos" внутри "video_folders/{folder.id}"
    useEffect(() => {
        const q = query(
            collection(db, "video_folders", folder.id, "Videos"),
            orderBy("createdAt", "desc")
        );
        const unsub = onSnapshot(q, snap => {
            setVideos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, [folder]);

    const handleUpload = async () => {
        if (!videoTitle.trim() || (!videoUrl && !videoFile)) return;

        let url = videoUrl;

        if (videoFile) {
            const storageRef = ref(storage, `videos/${folder.id}/${Date.now()}_${videoFile.name}`);
            await uploadBytes(storageRef, videoFile);
            url = await getDownloadURL(storageRef);
        }

        await addDoc(collection(db, "video_folders", folder.id, "Videos"), {
            title: videoTitle,
            videoUrl: url,
            createdAt: serverTimestamp()
        });

        setVideoTitle("");
        setVideoUrl("");
        setVideoFile(null);
        setOpen(false);
    };

    function convertToEmbedUrl(url) {
        if (url.includes("watch?v=")) {
            return url.replace("watch?v=", "embed/");
        }
        if (url.includes("youtu.be/")) {
            const videoId = url.split("youtu.be/")[1];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return url;
    }

    return (
        <Box maxWidth="900px" mx="auto" mt={2}>
            <Button startIcon={<ArrowBackIcon />} onClick={onBack}>Назад</Button>
            <Typography variant="h5" fontWeight="bold" mb={2}>
                Видео в папке: {folder.name}
            </Typography>

            <Button variant="contained" onClick={() => setOpen(true)}>Добавить видео</Button>

            <Stack direction="row" spacing={3} flexWrap="wrap" mt={2}>
                {videos.map(video => (
                    <Card key={video.id} sx={{ width: 260, mb: 2, boxShadow: 3 }}>
                        {video.videoUrl?.includes("youtube.com") || video.videoUrl?.includes("youtu.be") ? (
                            <Box sx={{ position: "relative", height: 140, backgroundColor: "#000" }}>
                                <iframe
                                    width="100%"
                                    height="140"
                                    src={convertToEmbedUrl(video.videoUrl)}
                                    title={video.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{ border: "none" }}
                                ></iframe>
                            </Box>
                        ) : (
                            <CardMedia
                                component="video"
                                controls
                                src={video.videoUrl}
                                height="140"
                                sx={{ backgroundColor: "#000" }}
                            />
                        )}
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold">{video.title}</Typography>
                        </CardContent>
                    </Card>
                ))}
            </Stack>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Добавить видео</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Название видео"
                        fullWidth
                        value={videoTitle}
                        onChange={e => setVideoTitle(e.target.value)}
                        margin="dense"
                    />
                    <Typography fontSize={14} mt={1}>YouTube ссылка или файл:</Typography>
                    <TextField
                        label="Ссылка на видео"
                        fullWidth
                        value={videoUrl}
                        onChange={e => setVideoUrl(e.target.value)}
                        margin="dense"
                    />
                    <input
                        type="file"
                        accept="video/*"
                        onChange={e => setVideoFile(e.target.files[0])}
                        style={{ marginTop: "8px" }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleUpload}>Сохранить</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}