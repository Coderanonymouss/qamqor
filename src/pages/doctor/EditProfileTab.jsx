import React, { useState } from "react";
import { Typography, Box, TextField, Button, Avatar } from "@mui/material";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function EditProfileTab() {
    const [photo, setPhoto] = useState(null);
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);

    const handlePhotoChange = (e) => {
        if (e.target.files[0]) {
            setPhoto(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        setLoading(true);
        const userRef = doc(db, "User", currentUser.uid);

        const updates = {};

        if (phone.trim() !== "") {
            updates.phone = phone;
        }

        if (address.trim() !== "") {
            updates.address = address;
        }

        if (photo) {
            const photoRef = ref(storage, `user_photos/${currentUser.uid}`);
            await uploadBytes(photoRef, photo);
            const url = await getDownloadURL(photoRef);
            updates.photoUrl = url;
        }

        if (Object.keys(updates).length > 0) {
            await updateDoc(userRef, updates);
            alert("Профиль обновлен!");
        } else {
            alert("Нет данных для обновления");
        }

        setLoading(false);
    };

    return (
        <Box sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
            <Typography variant="h4" mb={2}>Редактирование профиля</Typography>

            <Button variant="contained" component="label" fullWidth sx={{ mb: 2 }}>
                Загрузить фото
                <input type="file" hidden onChange={handlePhotoChange} />
            </Button>

            {photo && (
                <Box sx={{ textAlign: "center", mb: 2 }}>
                    <Avatar src={URL.createObjectURL(photo)} sx={{ width: 100, height: 100, mx: "auto" }} />
                </Box>
            )}

            <TextField
                fullWidth
                label="Номер телефона"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                sx={{ mb: 2 }}
            />

            <TextField
                fullWidth
                label="Адрес проживания"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                sx={{ mb: 2 }}
            />

            <Button variant="contained" color="primary" fullWidth onClick={handleSubmit} disabled={loading}>
                Сохранить изменения
            </Button>
        </Box>
    );
}
