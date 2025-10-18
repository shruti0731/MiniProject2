

import React, { useState } from 'react';
import axios from 'axios';

function FileUpload() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [text, setText] = useState("");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file first!");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://127.0.0.1:5000/upload', formData);
            setMessage(response.data.message);
            setText(response.data.text);
        } catch (error) {
            console.error("Error uploading file:", error);
            setMessage("Error uploading file!");
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2>Ancient Text Recognition</h2>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
            <p>{message}</p>
            {text && <div style={{ marginTop: "20px" }}><h3>Extracted Text:</h3><pre>{text}</pre></div>}
        </div>
    );
}

export default FileUpload;
// src/FileUpload.js





