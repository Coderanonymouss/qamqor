import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, storage } from "../../firebase";
import { getDownloadURL, ref } from "firebase/storage";
import {
    Box, Typography, CircularProgress, Card, LinearProgress, Button
} from "@mui/material";

export default function PatientProfile() {
    const { id } = useParams();

    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [photoUrl, setPhotoUrl] = useState("/images/default_user.png");
    const [folderName, setFolderName] = useState("");

    // Загружаем данные пациента и имя папки
    useEffect(() => {
        const loadPatient = async () => {
            try {
                const refDoc = doc(db, "Patient", id);
                const snap = await getDoc(refDoc);
                if (snap.exists()) {
                    const patientData = { id: snap.id, ...snap.data() };
                    setPatient(patientData);

                    // Загружаем имя видеопапки
                    if (patientData.folderId) {
                        const folderRef = doc(db, "video_folders", patientData.folderId);
                        const folderSnap = await getDoc(folderRef);
                        if (folderSnap.exists()) {
                            setFolderName(folderSnap.data().name);
                        } else {
                            setFolderName("Папка не найдена");
                        }
                    } else {
                        setFolderName("Папка не назначена");
                    }
                }
            } catch (e) {
                console.error("Ошибка загрузки пациента:", e);
            } finally {
                setLoading(false);
            }
        };

        loadPatient();
    }, [id]);

    // Загружаем фото пациента
    useEffect(() => {
        if (patient?.id) {
            const path = ref(storage, `PatientProfile/${patient.id}.jpg`);
            getDownloadURL(path)
                .then(url => setPhotoUrl(url))
                .catch(() => setPhotoUrl("/images/default_user.png"));
        }
    }, [patient]);

    const handleAddFolderClick = () => {
        window.location.href = `/select-folder/${id}`;
    };

    if (loading || !patient) {
        return <Box textAlign="center" mt={5}><CircularProgress /></Box>;
    }

    return (
        <Card
            sx={{
                maxWidth: 1300,
                mx: "auto",
                mt: 8,
                display: "flex",
                overflow: "hidden",
                boxShadow: 6,
                borderRadius: 4
            }}
        >
            {/* Левая часть — прямоугольное фото */}
            <Box
                sx={{
                    flex: 1.5,
                    backgroundImage: `url(${photoUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    minHeight: 600
                }}
            />

            {/* Правая часть — скруглена справа */}
            <Box
                sx={{
                    flex: 2.2,
                    p: 6,
                    backgroundColor: "#f5f5f5",
                    borderTopRightRadius: 200,
                    borderBottomRightRadius: 200,
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
                <Typography variant="h6"><strong>Папка:</strong> {folderName}</Typography>

                <Box mt={5}>
                    <Typography gutterBottom variant="h6"><strong>Общий прогресс:</strong></Typography>
                    <LinearProgress variant="determinate" value={70} sx={{ height: 12, borderRadius: 6 }} />
                    <Typography variant="body2" color="text.secondary">70% просмотрено / выполнено</Typography>
                </Box>

                <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={handleAddFolderClick}
                >
                    {patient.folderId ? "Изменить видеопапку" : "Добавить видеопапку"}
                </Button>
            </Box>
        </Card>
    );
}
