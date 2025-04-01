"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [logFiles, setLogFiles] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch("http://localhost:5000/logs");
      const data = await response.json();
      setLogFiles(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("logFile", file);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setMessage(`Upload successful: ${result.filePath}`);
        fetchLogs(); // Refresh file list after upload
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage("Failed to upload file.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Unity Error Log Uploader</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
        Upload
      </button>
      {message && <p>{message}</p>}

      <h2>Uploaded Log Files:</h2>
      <ul>
        {logFiles.map((log, index) => (
          <li key={index}>
            <a href={log.url} target="_blank" rel="noopener noreferrer">
              {log.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
