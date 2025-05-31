import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, storage } from "../../firebase";
import { getDownloadURL, ref } from "firebase/storage";
import {
    Box, Typography, CircularProgress, Card, LinearProgress
} from "@mui/material";

export default function PatientProfile() {
    const { id } = useParams();
    const location = useLocation();
    const [patient, setPatient] = useState(location.state || null);
    const [loading, setLoading] = useState(!location.state);
    const [photoUrl, setPhotoUrl] = useState("/images/default_user.png");

    useEffect(() => {
        if (!patient) {
            const refDoc = doc(db, "Patient", id);
            getDoc(refDoc).then((snap) => {
                if (snap.exists()) {
                    setPatient({ id: snap.id, ...snap.data() });
                }
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [id, patient]);

    useEffect(() => {
        if (patient?.id) {
            const path = ref(storage, `PatientProfile/${patient.id}.jpg`);
            getDownloadURL(path)
                .then(url => setPhotoUrl(url))
                .catch(() => setPhotoUrl("/images/default_user.png"));
        }
    }, [patient]);

    if (loading || !patient) {
        return <Box textAlign="center" mt={5}><CircularProgress /></Box>;
    }

    return (
        <Card sx={{ maxWidth: 1300, mx: "auto", mt: 8, display: "flex", overflow: "hidden", boxShadow: 6 }}>
            {/* Фото справа */}
            <Box
                sx={{
                    flex: 1.5,
                    backgroundImage: `url(${photoUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    minHeight: 600
                }}
            />

            {/* Данные слева */}
            <Box
                sx={{
                    flex: 2.2,
                    p: 6,
                    backgroundColor: "#f5f5f5",
                    borderTopLeftRadius: 200,
                    borderBottomLeftRadius: 200,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center"
                }}
            >
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Профиль пациента: {patient.firstName} {patient.lastName}
                </Typography>
                <Typography variant="h6"><strong>ИИН:</strong> {patient.iin}</Typography>
                <Typography variant="h6"><strong>Email:</strong> {patient.email}</Typography>
                <Typography variant="h6"><strong>Телефон:</strong> {patient.tel}</Typography>
                <Typography variant="h6"><strong>Пол:</strong> {patient.gender}</Typography>
                <Typography variant="h6"><strong>Дата рождения:</strong> {patient.birthDate}</Typography>
                <Typography variant="h6"><strong>Диагноз:</strong> {patient.diagnosis}</Typography>
                <Typography variant="h6"><strong>Этап реабилитации:</strong> {patient.rehabStage}</Typography>
                <Typography variant="h6"><strong>Адрес:</strong> {patient.address}</Typography>
                <Typography variant="h6"><strong>Папка видео:</strong> {patient.folderId}</Typography>

                <Box mt={5}>
                    <Typography gutterBottom variant="h6"><strong>Общий прогресс:</strong></Typography>
                    <LinearProgress variant="determinate" value={70} sx={{ height: 12, borderRadius: 6 }} />
                    <Typography variant="body2" color="text.secondary">70% просмотрено / выполнено</Typography>
                </Box>
            </Box>
        </Card>
    );
}