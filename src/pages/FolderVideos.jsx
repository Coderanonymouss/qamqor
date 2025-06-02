// src/pages/FolderVideos.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Box, Typography, Card, CardContent, CircularProgress, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";

export default function FolderVideos() {
    const { folderId } = useParams();
    const navigate = useNavigate();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchVideos() {
            setLoading(true);
            const snap = await getDocs(collection(db, "video_folders", folderId, "Videos"));
            const vids = [];
            snap.forEach(doc => vids.push({ id: doc.id, ...doc.data() }));
            setVideos(vids);
            setLoading(false);
        }
        fetchVideos();
    }, [folderId]);

    if (loading) return <Box textAlign="center" mt={6}><CircularProgress /></Box>;

    return (
        <Box maxWidth={600} mx="auto" mt={5} p={2}>
            <Button
                startIcon={<ArrowBackIcon />}
                variant="text"
                sx={{ mb: 2, fontWeight: 600 }}
                onClick={() => navigate(-1)}
            >
                Назад к папкам
            </Button>
            <Typography variant="h5" gutterBottom>
                <VideoLibraryIcon sx={{ mb: "-5px", mr: 1 }} />
                Видео в папке
            </Typography>
            {videos.length === 0 ? (
                <Typography color="text.secondary" mt={2}>В этой папке нет видео.</Typography>
            ) : (
                videos.map(video => (
                    <Card key={video.id} sx={{ mb: 2, borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6">{video.title || video.id}</Typography>
                            {video.url && (
                                <video controls width="100%" src={video.url} style={{ marginTop: 10, borderRadius: 8 }} />
                            )}
                        </CardContent>
                    </Card>
                ))
            )}
        </Box>
    );
}
