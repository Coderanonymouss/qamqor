import React, { useState, useEffect } from "react";
import {
    Box, Typography, TextField, Button, Alert, CircularProgress
} from "@mui/material";
import { auth, db } from "../../firebase";
import {
    collection, doc, getDocs, query, where, setDoc
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// 🔐 Вторичный экземпляр Firebase
const secondaryApp = initializeApp(auth.app.options, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export default function AddPatientWeb() {
    const [iin, setIIN] = useState("");
    const [email, setEmail] = useState("");
    const [fio, setFio] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [foundData, setFoundData] = useState(null);
    const [iinLoading, setIinLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            if (iin.length !== 12) {
                setFio("");
                setFoundData(null);
                return;
            }

            setIinLoading(true);
            setFio("Поиск...");
            setError("");
            setSuccess("");

            try {
                const res = await axios.get(`https://health-backend-d1ug.onrender.com/api/patient/${iin}`);
                setFoundData(res.data);
                const fullName = `${res.data.lastName} ${res.data.firstName} ${res.data.middleName || ""}`.trim();
                setFio(fullName);
            } catch (e) {
                setFoundData(null);
                setFio("");
                setError("Пациент не найден по ИИН");
            } finally {
                setIinLoading(false);
            }
        };

        fetchData();
    }, [iin]);

    const handleAdd = async () => {
        setError("");
        setSuccess("");

        if (!foundData || iin !== foundData.iin) {
            setError("Сначала введите корректный ИИН (12 цифр)");
            return;
        }

        if (!email) {
            setError("Email обязателен");
            return;
        }

        const doctorUid = auth.currentUser?.uid;
        const doctorEmail = auth.currentUser?.email;

        if (!doctorUid || !doctorEmail) {
            setError("Ошибка: не удалось определить врача");
            return;
        }

        setLoading(true);

        try {
            const existingIin = await getDocs(query(collection(db, "Patient"), where("iin", "==", iin)));
            if (!existingIin.empty) {
                setError("Пациент с таким ИИН уже зарегистрирован");
                setLoading(false);
                return;
            }

            const existingEmail = await getDocs(query(collection(db, "Patient"), where("email", "==", email)));
            if (!existingEmail.empty) {
                setError("Пациент с таким email уже зарегистрирован");
                setLoading(false);
                return;
            }

            const tempPassword = Math.random().toString(36).slice(-8);

            // 👇 Создание пациента через вторичный экземпляр
            const cred = await createUserWithEmailAndPassword(secondaryAuth, email, tempPassword);
            await sendPasswordResetEmail(secondaryAuth, email);

            const uid = cred.user.uid;

            const patientData = {
                type: "Patient",
                uid,
                email,
                iin,
                doctorUid: doctorUid,
                doctorId: doctorEmail,
                firstName: foundData.firstName,
                lastName: foundData.lastName,
                middleName: foundData.middleName,
                birthDate: foundData.birthDate,
                gender: foundData.gender,
                diagnosis: foundData.diagnosis,
                rehabStage: foundData.rehabStage,
                address: foundData.address || "",
                tel: foundData.tel || "",
                firstSigninCompleted: false
            };

            await setDoc(doc(db, "Patient", uid), patientData);
            await setDoc(doc(db, "User", uid), patientData);

            setSuccess("Пациент успешно добавлен! Ссылка для входа отправлена.");
            setTimeout(() => navigate("/doctor/patients"), 1000);
        } catch (err) {
            setError("Ошибка: " + err.message);
        }

        setLoading(false);
    };

    return (
        <Box maxWidth="sm" mx="auto" mt={4} p={3} bgcolor="white" borderRadius={2} boxShadow={3}>
            <Typography variant="h5" mb={2}>Добавить пациента</Typography>

            <TextField
                label="ИИН"
                fullWidth
                value={iin}
                onChange={(e) => setIIN(e.target.value)}
                margin="normal"
            />
            {iinLoading && <Typography sx={{ mt: 1 }}>Поиск по ИИН...</Typography>}
            {fio && <Typography>ФИО: <strong>{fio}</strong></Typography>}

            <TextField
                label="Email пациента"
                fullWidth
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
            />

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

            <Box mt={2}>
                <Button variant="contained" onClick={handleAdd} disabled={loading || iinLoading}>
                    {loading ? <CircularProgress size={24} /> : "Добавить пациента"}
                </Button>
            </Box>
        </Box>
    );
}
