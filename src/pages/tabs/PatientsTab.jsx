import React from "react";
import { Typography } from "@mui/material";

export default function PatientsTab({ user }) {
    return (
        <div>
            <Typography variant="h4" mb={2}>Список пациентов</Typography>
            <Typography>Здесь будет отображаться список пациентов, прикреплённых к врачу: {user.fullName}</Typography>
        </div>
    );
}
