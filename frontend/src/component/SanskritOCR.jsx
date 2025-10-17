// SanskritOCR.jsx (React UI)
import React, { useState } from "react";
import axios from "axios";

export default function SanskritOCR() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [sanskritText, setSanskritText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("http://localhost:5000/upload", formData);
      const { text, message, translation } = response.data;
      setSanskritText(text);
      setTranslatedText(translation);
      setMessage(message);
    } catch (error) {
      console.error(error);
      setMessage("An error occurred while uploading or translating the file.");
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sanskrit OCR & Translator</h1>
      <input type="file" onChange={handleFileChange} className="mb-4" />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Upload & Translate
      </button>
      {message && <p className="mt-4 text-green-700 font-medium">{message}</p>}
      {sanskritText && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Extracted Sanskrit Text:</h2>
          <p className="bg-gray-100 p-2 rounded whitespace-pre-wrap">{sanskritText}</p>
        </div>
      )}
      {translatedText && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">English Translation:</h2>
          <p className="bg-green-100 p-2 rounded whitespace-pre-wrap">{translatedText}</p>
        </div>
      )}
    </div>
  );
}
