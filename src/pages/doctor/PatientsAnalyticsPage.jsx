import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase"; // auth — для текущего пользователя
import { collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent, Typography, Button, TextField, Box, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function PatientsAnalyticsPage() {
    const [patients, setPatients] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientStats, setPatientStats] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        async function fetchPatients() {
            setLoading(true);
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            const q = query(collection(db, "Patient"), where("doctorUid", "==", currentUser.uid));
            const snap = await getDocs(q);
            const pats = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setPatients(pats);
            setFiltered(pats);
            setLoading(false);
        }
        fetchPatients();
    }, []);

    useEffect(() => {
        if (!search) {
            setFiltered(patients);
        } else {
            const lower = search.toLowerCase();
            setFiltered(patients.filter(
                p =>
                    (p.iin && p.iin.includes(lower)) ||
                    (p.email && p.email.toLowerCase().includes(lower)) ||
                    ((p.lastName + " " + p.firstName + " " + (p.middleName || "")).toLowerCase().includes(lower))
            ));
        }
    }, [search, patients]);

    // Получаем аналитику для выбранного пациента
    async function fetchPatientStats(patientId) {
        const medsRef = collection(db, "users", patientId, "medicines");
        const medsSnap = await getDocs(medsRef);

        const medicinesData = [];
        for (const doc of medsSnap.docs) {
            const med = doc.data();
            const intakesRef = collection(db, "users", patientId, "medicines", doc.id, "intakes");
            const intakesSnap = await getDocs(intakesRef);

            // Подсчёт статистики приёмов
            const intakesList = intakesSnap.docs.map(intakeDoc => intakeDoc.data());

            // Считаем успешно принятые и всего
            let total = intakesList.length;
            let accepted = intakesList.filter(i => i.status === "accepted" || i.status === "✅").length;
            let missed = intakesList.filter(i => i.status === "missed" || i.status === "❌").length;

            medicinesData.push({
                ...med,
                id: doc.id,
                totalIntakes: total,
                accepted,
                missed,
                intakes: intakesList,
            });
        }

        setPatientStats({
            medicinesTaken: medicinesData.length,
            missedIntakes: medicinesData.reduce((acc, med) => acc + med.missed, 0),
            medicines: medicinesData,
        });
    }

    function handleSelectPatient(p) {
        setSelectedPatient(p);
        fetchPatientStats(p.id);
    }

    if (loading) return <CircularProgress />;

    return (
        <Box sx={{ p: 3 }}>
            <TextField
                label="Поиск по ИИН, ФИО или Email"
                value={search}
                onChange={e => setSearch(e.target.value)}
                fullWidth
                sx={{ mb: 3 }}
            />
            <div style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                marginBottom: 32
            }}>
                {filtered.map((p) => (
                    <Card
                        key={p.id}
                        variant={selectedPatient && selectedPatient.id === p.id ? "outlined" : "elevation"}
                        sx={{ cursor: "pointer", border: selectedPatient && selectedPatient.id === p.id ? "2px solid #22BE87" : "" }}
                        onClick={() => handleSelectPatient(p)}
                    >
                        <CardContent>
                            <Typography variant="h6">
                                {p.lastName || ""} {p.firstName || ""} {p.middleName || ""}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">ИИН: {p.iin}</Typography>
                            <Typography variant="body2">{p.email}</Typography>
                            <Button
                                variant="outlined"
                                sx={{ mt: 2 }}
                                onClick={e => {
                                    e.stopPropagation();
                                    navigate(`/analytics/patient/${p.id}`);
                                }}
                            >
                                Детально
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {filtered.length === 0 && <Typography>Пациентов не найдено.</Typography>}
            </div>

            {/* Аналитика выбранного пациента */}
            {selectedPatient && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Аналитика пациента:</Typography>
                        <Typography>
                            <strong>ФИО:</strong> {selectedPatient.lastName} {selectedPatient.firstName} {selectedPatient.middleName || ""}
                        </Typography>
                        <Typography>
                            <strong>Email:</strong> {selectedPatient.email}
                        </Typography>
                        <Typography>
                            <strong>ИИН:</strong> {selectedPatient.iin}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            {patientStats ? (
                                <>
                                    <Typography>
                                        <strong>Всего приемов лекарства:</strong> {patientStats.medicinesTaken}
                                    </Typography>
                                    <Typography>
                                        <strong>Пропущено приемов:</strong> {patientStats.missedIntakes}
                                    </Typography>
                                    {patientStats.medicines.map((medicine) => (
                                        <Box key={medicine.id} sx={{ mt: 2 }}>
                                            <Typography variant="h6">{medicine.name}</Typography>
                                            <Typography>Всего приёмов: {medicine.totalIntakes}</Typography>
                                            <Typography>
                                                Принято: {medicine.accepted} &nbsp;&nbsp;
                                                Пропущено: {medicine.missed}
                                            </Typography>
                                        </Box>
                                    ))}
                                </>
                            ) : (
                                <Typography>Загрузка аналитики...</Typography>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
