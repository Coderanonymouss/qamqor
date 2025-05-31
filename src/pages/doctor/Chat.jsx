    import React, { useEffect, useState, useRef } from "react";
    import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, CircularProgress, TextField, IconButton, Paper, Stack } from "@mui/material";
    import SendIcon from "@mui/icons-material/Send";
    import { db, auth } from "../../firebase";
    import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp } from "firebase/firestore";

    export default function MyChatsList() {
        const [patients, setPatients] = useState([]);
        const [loading, setLoading] = useState(true);
        const [selectedPatient, setSelectedPatient] = useState(null);
        const [messageText, setMessageText] = useState("");
        const [messages, setMessages] = useState([]);
        const bottomRef = useRef(null);

        useEffect(() => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const q = query(
                collection(db, "Patient"),
                where("doctorId", "==", currentUser.email)
            );

            const unsubscribe = onSnapshot(q, async (snapshot) => {
                const patientList = snapshot.docs.map((docSnap) => {
                    const data = docSnap.data();
                    return {
                        id: docSnap.id,
                        name: `${data.firstName} ${data.lastName}`,
                        photo: data.photoUrl || "/images/default_user.png",
                        email: data.email
                    };
                });
                setPatients(patientList);
                setLoading(false);
            });

            return () => unsubscribe();
        }, []);

        const openChat = (patient) => {
            setSelectedPatient(patient);
            loadMessages();
        };

        const loadMessages = () => {
            const chatId = [ selectedPatient.email,auth.currentUser.email].sort().join("_");

            const msgRef = collection(db, "chat", chatId, "message");
            const q = query(msgRef, orderBy("dateCreated"));

            const unsubscribe = onSnapshot(q, (snap) => {
                const data = snap.docs.map(doc => doc.data());
                console.log("Fetched messages: ", data);  // Debugging
                setMessages(data);
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            });

            return unsubscribe;
        };

        const sendMessage = async () => {
            if (!messageText.trim()) return;

            const doctorEmail = auth.currentUser.email;
            const patientEmail = selectedPatient.email;

            const chatId1 = [doctorEmail, patientEmail].join("_");
            const chatId2 = [patientEmail, doctorEmail].join("_");

            const message = {
                text: messageText,
                sender: doctorEmail,
                senderName: "Вы",
                dateCreated: serverTimestamp(),
                type: "text",
                duration: 0,
                fileUrl: null
            };

            const msgRef1 = collection(db, "chat", chatId1, "message");
            const msgRef2 = collection(db, "chat", chatId2, "message");

            await Promise.all([
                addDoc(msgRef1, message),
                addDoc(msgRef2, message)
            ]);

            setMessageText("");
        };

        if (loading) {
            return <Box textAlign="center" mt={5}><CircularProgress /></Box>;
        }

        return (
            <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f0f0f0" }}>
                <Box sx={{
                    width: 280,
                    borderRight: "1px solid #ccc",
                    overflowY: "auto",
                    p: 2,
                    backgroundColor: "#fff",
                    boxShadow: "2px 0px 5px rgba(0, 0, 0, 0.1)"
                }}>
                    <Typography variant="h5" mb={2}>Пациенты</Typography>
                    <List>
                        {patients.map((patient) => (
                            <ListItem button key={patient.id} onClick={() => openChat(patient)}>
                                <ListItemAvatar>
                                    <Avatar src={patient.photo} />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={patient.name}
                                    secondary={`Телефон: ${patient.tel || "Не указан"}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>

                <Box sx={{ flexGrow: 1, p: 3 }}>
                    {selectedPatient ? (
                        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                            <Typography variant="h5" fontWeight="bold" mb={2}>Чат с {selectedPatient.name}</Typography>
                            <Paper sx={{ flex: 1, p: 2, overflowY: "auto", boxShadow: "2px 0px 5px rgba(0, 0, 0, 0.1)", maxHeight: "80vh" }}>
                                {messages.map((msg, index) => (
                                    <Box key={index} sx={{
                                        display: "flex",
                                        justifyContent: msg.sender === auth.currentUser.email ? "flex-end" : "flex-start",
                                        mb: 1
                                    }}>
                                        <Paper
                                            elevation={3}
                                            sx={{
                                                p: 1.5,
                                                background: msg.sender === auth.currentUser.email ? "#1976d2" : "#ffffff",
                                                color: msg.sender === auth.currentUser.email ? "#fff" : "#000",
                                                borderRadius: 2,
                                                maxWidth: "70%",
                                                boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.1)"
                                            }}
                                        >
                                            <Typography>{msg.text}</Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                                {msg.sender === auth.currentUser.email ? "Вы" : selectedPatient.name}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                ))}
                                <div ref={bottomRef}></div>
                            </Paper>
                            <Box sx={{ p: 2, borderTop: "1px solid #ccc", background: "#fafafa" }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <TextField
                                        fullWidth
                                        placeholder="Введите сообщение..."
                                        value={messageText}
                                        onChange={e => setMessageText(e.target.value)}
                                        onKeyPress={e => e.key === "Enter" && sendMessage()}
                                    />
                                    <IconButton color="primary" onClick={sendMessage}>
                                        <SendIcon />
                                    </IconButton>
                                </Stack>
                            </Box>
                        </Box>
                    ) : (
                        <Typography variant="h6">Выберите пациента для чата</Typography>
                    )}
                </Box>
            </Box>
        );
    }
