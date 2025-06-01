import React, { useEffect, useState } from "react";
import {
    Box, Typography, Card, CardContent, CardMedia, Button, Stack,
    CircularProgress, TextField
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth, storage } from "../../firebase";
import { ref, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";

export default function PatientsList() {
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const q = query(
            collection(db, "Patient"),
            where("doctorId", "==", currentUser.email),
            orderBy("firstName", "asc")
        );

        const unsubscribe = onSnapshot(q, async (snap) => {
            const data = await Promise.all(
                snap.docs.map(async (doc) => {
                    const patient = doc.data();
                    const fullName = [patient.firstName, patient.lastName].filter(Boolean).join(" ");
                    let photoUrl = "";
                    try {
                        const imageRef = ref(storage, `PatientProfile/${doc.id}.jpg`);
                        photoUrl = await getDownloadURL(imageRef);
                    } catch {
                        photoUrl = "/images/default_user.png"; // fallback картинка
                    }
                    return { id: doc.id, ...patient, fullName, photoUrl };
                })
            );
            setPatients(data);
            setFilteredPatients(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const lowerSearch = searchText.toLowerCase();
        const filtered = patients.filter((p) =>
            p.fullName.toLowerCase().includes(lowerSearch) ||
            (p.iin || "").toLowerCase().includes(lowerSearch) ||
            (p.email || "").toLowerCase().includes(lowerSearch)
        );
        setFilteredPatients(filtered);
    }, [searchText, patients]);

    const openProfile = (patient) => {
        navigate(`/doctor/patient-profile/${patient.id}`, { state: patient });
    };

    const handleAddPatient = () => {
        navigate("/doctor/add-patient");
    };

    if (loading) {
        return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4">Пациенты</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddPatient}
                >
                    Добавить пациента
                </Button>
            </Box>

            <TextField
                fullWidth
                placeholder="Поиск по ФИО, ИИН или Email"
                variant="outlined"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                sx={{ mb: 3 }}
            />

            {filteredPatients.length === 0 ? (
                <Typography variant="body1">Пациенты не найдены.</Typography>
            ) : (
                <Stack spacing={2}>
                    {filteredPatients.map((patient) => (
                        <Card key={patient.id} sx={{ display: "flex", alignItems: "center", p: 2 }}>
                            <CardMedia
                                component="img"
                                image={patient.photoUrl}
                                alt={patient.fullName}
                                sx={{ width: 80, height: 80, borderRadius: "50%", mr: 2 }}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6">{patient.fullName}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    ИИН: {patient.iin || "—"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Email: {patient.email || "—"}
                                </Typography>
                            </CardContent>
                            <Button variant="contained" onClick={() => openProfile(patient)}>
                                Профиль
                            </Button>
                        </Card>
                    ))}
                </Stack>
            )}
        </Box>
    );
}
