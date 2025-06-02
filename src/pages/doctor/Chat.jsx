import React, { useState, useEffect, useRef } from "react";
import {
    Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText,
    CircularProgress, TextField, IconButton, Paper, Stack
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import MicIcon from '@mui/icons-material/Mic';
import { db, auth, storage } from "../../firebase";
import {
    collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function MyChatsList() {
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [messageText, setMessageText] = useState("");
    const [messages, setMessages] = useState([]);
    const bottomRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        const q = query(collection(db, "Patient"), where("doctorId", "==", auth.currentUser.email));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map((doc) => {
                const d = doc.data();
                return {
                    id: doc.id,
                    name: `${d.firstName} ${d.lastName}`,
                    photo: d.photoUrl || "/images/default_user.png",
                    email: d.email || "",
                    iin: d.iin || ""
                };
            });
            setPatients(list);
            setFilteredPatients(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const f = searchText.toLowerCase();
        setFilteredPatients(patients.filter(p =>
            p.name.toLowerCase().includes(f) ||
            p.email.toLowerCase().includes(f) ||
            p.iin.toLowerCase().includes(f)
        ));
    }, [searchText, patients]);

    const openChat = (patient) => {
        setSelectedPatient(patient);
        const chatId = [patient.email, auth.currentUser.email].sort().join("_");
        const msgRef = collection(db, "chat", chatId, "message");
        const q = query(msgRef, orderBy("dateCreated"));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => doc.data());
            setMessages(data);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        });
    };

    const sendMessage = async (type, content, extra = {}) => {
        if (type === "text" && !content.trim()) return;

        const doctor = auth.currentUser.email;
        const patient = selectedPatient.email;
        const chatId = [doctor, patient].sort().join("_");

        const msg = {
            text: type === "text" ? content.trim() : "",
            sender: doctor,
            type,
            fileUrl: extra.fileUrl || null,
            duration: extra.duration || null,
            dateCreated: serverTimestamp()
        };

        const msgRef = collection(db, "chat", chatId, "message");
        await addDoc(msgRef, msg);
        setMessageText("");
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const path = `chat_images/${Date.now()}_${file.name}`;
        const imageRef = ref(storage, path);
        await uploadBytes(imageRef, file);
        const url = await getDownloadURL(imageRef);
        sendMessage("image", "", { fileUrl: url });
    };

    const handleAudioRecord = async () => {
        if (!mediaRecorderRef.current) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

            recorder.onstop = async () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const path = `chat_audio/${Date.now()}.webm`;
                const audioRef = ref(storage, path);
                await uploadBytes(audioRef, blob, { contentType: "audio/webm" });
                const url = await getDownloadURL(audioRef);
                sendMessage("audio", "", { fileUrl: url });
                audioChunksRef.current = [];
            };

            recorder.start();
        } else {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }
    };

    if (loading) return <Box textAlign="center" mt={5}><CircularProgress /></Box>;

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            {/* Список пациентов */}
            <Box sx={{ width: 280, borderRight: "1px solid #ccc", p: 2, background: "#fff" }}>
                <Typography variant="h5" mb={2}>Пациенты</Typography>
                <TextField
                    fullWidth placeholder="Поиск"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <List>
                    {filteredPatients.map(p => (
                        <ListItem button key={p.id} onClick={() => openChat(p)}>
                            <ListItemAvatar><Avatar src={p.photo} /></ListItemAvatar>
                            <ListItemText primary={p.name} secondary={`ИИН: ${p.iin}`} />
                        </ListItem>
                    ))}
                </List>
            </Box>

            {/* Окно чата */}
            <Box sx={{ flexGrow: 1, p: 3 }}>
                {selectedPatient ? (
                    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        <Typography variant="h5" fontWeight="bold" mb={2}>
                            Чат с {selectedPatient.name}
                        </Typography>
                        <Paper sx={{ flex: 1, p: 2, overflowY: "auto", maxHeight: "75vh" }}>
                            {messages.map((msg, idx) => (
                                <Box key={idx} sx={{ display: "flex", justifyContent: msg.sender === auth.currentUser.email ? "flex-end" : "flex-start", mb: 1 }}>
                                    <Paper sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        maxWidth: "70%",
                                        background: msg.sender === auth.currentUser.email ? "#1976d2" : "#f0f0f0",
                                        color: msg.sender === auth.currentUser.email ? "#fff" : "#000"
                                    }}>
                                        {msg.type === "text" && <Typography>{msg.text}</Typography>}
                                        {msg.type === "image" && (
                                            <img
                                                src={msg.fileUrl}
                                                alt="Фото"
                                                style={{ maxWidth: 200, borderRadius: 8 }}
                                            />
                                        )}
                                        {msg.type === "audio" && (
                                            <audio
                                                style={{ width: "100%", marginTop: 6 }}
                                                controls
                                                src={msg.fileUrl}
                                            >
                                                Ваш браузер не поддерживает аудио.
                                            </audio>
                                        )}
                                        <Typography variant="caption" sx={{ mt: 1, display: "block", textAlign: "right", opacity: 0.7 }}>
                                            {msg.dateCreated?.seconds
                                                ? new Date(msg.dateCreated.seconds * 1000).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })
                                                : "⏳"}
                                        </Typography>
                                    </Paper>
                                </Box>
                            ))}
                            <div ref={bottomRef} />
                        </Paper>

                        {/* Отправка сообщений */}
                        <Box sx={{ p: 2, borderTop: "1px solid #ccc", background: "#fafafa" }}>
                            <Stack direction="row" spacing={1}>
                                <TextField
                                    fullWidth
                                    placeholder="Введите сообщение"
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                    onKeyPress={e => e.key === "Enter" && sendMessage("text", messageText)}
                                />
                                <input type="file" accept="image/*" hidden id="upload-image" onChange={handleImageUpload} />
                                <label htmlFor="upload-image">
                                    <IconButton color="primary" component="span">
                                        <AddPhotoAlternateIcon />
                                    </IconButton>
                                </label>
                                <IconButton color="primary" onClick={handleAudioRecord}>
                                    <MicIcon />
                                </IconButton>
                                <IconButton color="primary" onClick={() => sendMessage("text", messageText)}>
                                    <SendIcon />
                                </IconButton>
                            </Stack>
                        </Box>
                    </Box>
                ) : (
                    <Typography variant="h6">Выберите пациента</Typography>
                )}
            </Box>
        </Box>
    );
}
