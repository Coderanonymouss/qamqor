import React, { useEffect, useState } from "react";
import {
    Box, Typography, Table, TableHead, TableBody, TableRow,
    TableCell, Paper, CircularProgress, TextField, Button
} from "@mui/material";
import { db, auth } from "../../firebase";
import { collection, getDocs, query, where, setDoc, doc } from "firebase/firestore";
import { Pie } from "react-chartjs-2";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

export default function PatientMedicineAnalyticsTable() {
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [medicineRows, setMedicineRows] = useState([]);
    const [videoStats, setVideoStats] = useState({ viewed: 0, total: 0 });

    useEffect(() => {
        const fetchPatients = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            const q = query(collection(db, "Patient"), where("doctorUid", "==", currentUser.uid));
            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPatients(list);
            setFilteredPatients(list);
            setLoading(false);
        };
        fetchPatients();
    }, []);

    useEffect(() => {
        if (!search) {
            setFilteredPatients(patients);
        } else {
            const lower = search.toLowerCase();
            setFilteredPatients(patients.filter(p =>
                (p.iin && p.iin.includes(lower)) ||
                (p.email && p.email.toLowerCase().includes(lower)) ||
                ((p.lastName + " " + p.firstName + " " + (p.middleName || "")).toLowerCase().includes(lower))
            ));
        }
    }, [search, patients]);

    const getTodayKey = () => {
        const now = new Date();
        return now.toISOString().split("T")[0];
    };

    const fetchMedicineAnalytics = async (patientId) => {
        const medsRef = collection(db, "users", patientId, "medicines");
        const medsSnap = await getDocs(medsRef);

        const rows = [];
        let totalAccepted = 0;
        let totalMissed = 0;
        let totalToday = 0;
        let takenToday = 0;

        for (const docSnap of medsSnap.docs) {
            const med = docSnap.data();
            const intakesRef = collection(db, "users", patientId, "medicines", docSnap.id, "intakes");
            const intakesSnap = await getDocs(intakesRef);
            const intakes = intakesSnap.docs.map(d => d.data());

            const todayTaken = intakes.filter(i => i.status === true && i.datetime?.startsWith(getTodayKey())).length;
            const todayMissed = intakes.filter(i => i.status === false && i.datetime?.startsWith(getTodayKey())).length;

            const total = intakes.length;
            const accepted = intakes.filter(i => i.status === true).length;
            const missed = intakes.filter(i => i.status === false).length;

            takenToday += todayTaken;
            totalToday += todayTaken + todayMissed;
            totalAccepted += accepted;
            totalMissed += missed;

            rows.push({
                name: med.name,
                takenToday: todayTaken,
                accepted,
                missed,
                total
            });
        }

        const videosRef = collection(db, "users", patientId, "video_progress");
        const videosSnap = await getDocs(videosRef);
        const viewedCount = videosSnap.docs.filter(doc => doc.data().status === true).length;
        setVideoStats({ viewed: viewedCount, total: videosSnap.docs.length });

        await setDoc(doc(db, "users", patientId, "progress_summary", getTodayKey()), {
            uid: patientId,
            date: getTodayKey(),
            taken: takenToday,
            missed: totalToday - takenToday,
            total: totalToday,
            timestamp: new Date()
        });

        await setDoc(doc(db, "analytics", patientId), {
            patientId,
            accepted: totalAccepted,
            missed: totalMissed,
            medicines: rows,
            updatedAt: new Date()
        });

        setMedicineRows(rows);
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(medicineRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Medicine Analytics");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const file = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(file, "analytics.xlsx");
    };

    if (loading) return <Box textAlign="center"><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" mb={2}>Аналитика приёма лекарств</Typography>

            <TextField
                fullWidth
                value={search}
                onChange={e => setSearch(e.target.value)}
                label="Поиск пациента по ИИН, Email или ФИО"
                sx={{ mb: 3 }}
            />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 4 }}>
                {filteredPatients.map(p => (
                    <Paper
                        key={p.id}
                        onClick={() => {
                            setSelectedPatient(p);
                            fetchMedicineAnalytics(p.id);
                        }}
                        sx={{ p: 2, cursor: "pointer", border: selectedPatient?.id === p.id ? "2px solid #22BE87" : "1px solid #ccc" }}
                    >
                        <Typography variant="subtitle1">{p.lastName} {p.firstName}</Typography>
                        <Typography variant="body2">ИИН: {p.iin}</Typography>
                        <Typography variant="body2">{p.email}</Typography>
                    </Paper>
                ))}
            </Box>

            {selectedPatient && (
                <>
                    <Typography variant="h6" gutterBottom>
                        Таблица приёма лекарств для {selectedPatient.lastName} {selectedPatient.firstName}
                    </Typography>

                    <Button variant="outlined" onClick={exportToExcel} sx={{ mb: 2 }}>
                        📥 Экспорт в Excel
                    </Button>

                    <Paper sx={{ overflowX: "auto" }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Название</TableCell>
                                    <TableCell>Принято сегодня</TableCell>
                                    <TableCell>Принято всего</TableCell>
                                    <TableCell>Пропущено всего</TableCell>
                                    <TableCell>Всего приёмов</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {medicineRows.map((row, idx) => (
                                    <TableRow key={idx} hover>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell>{row.takenToday}</TableCell>
                                        <TableCell>{row.accepted}</TableCell>
                                        <TableCell>{row.missed}</TableCell>
                                        <TableCell>{row.total}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>

                    {videoStats.total > 0 && (
                        <Box mt={4} width={300}>
                            <Typography variant="h6" gutterBottom>Просмотр видео</Typography>
                            <Pie
                                data={{
                                    labels: ["Просмотрено", "Не просмотрено"],
                                    datasets: [{
                                        label: "Видео",
                                        data: [videoStats.viewed, videoStats.total - videoStats.viewed],
                                        backgroundColor: ["#2196f3", "#eeeeee"]
                                    }]
                                }}
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}
