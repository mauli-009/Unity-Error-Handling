"use client";
import { useState, useEffect } from "react";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [fileList, setFileList] = useState<{ name: string; url: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [analyzedErrors, setAnalyzedErrors] = useState<{ filename: string; errors: string[] } | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch("http://localhost:5000/logs");
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid response format: Expected an array");
      setFileList(data);
    } catch (error) {
      console.error("Error fetching files:", error);
      setFileList([]);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("logFile", selectedFile);

    try {
      setUploadProgress(0);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:5000/upload", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setUploadStatus("File uploaded successfully!");
          setSelectedFile(null);
          fetchFiles();
        } else {
          setUploadStatus("Upload failed. Ensure the file format is correct.");
        }
        setUploadProgress(0);
      };

      xhr.onerror = () => {
        setUploadStatus("An error occurred during upload.");
        setUploadProgress(0);
      };

      xhr.send(formData);
    } catch (error) {
      setUploadStatus("An error occurred during upload.");
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:5000/delete/${filename}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFileList((prevList) => prevList.filter((file) => file.name !== filename));
        if (analyzedErrors?.filename === filename) {
          setAnalyzedErrors(null);
        }
      } else {
        setUploadStatus("Failed to delete the file.");
      }
    } catch (error) {
      setUploadStatus("An error occurred while deleting the file.");
    }
  };

  const handleAnalyze = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:5000/analyze/${filename}`);
      if (!response.ok) throw new Error("Failed to analyze file.");

      const data = await response.json();
      setAnalyzedErrors(data);
    } catch (error) {
      console.error("Error analyzing file:", error);
      setAnalyzedErrors(null);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center p-6"
      style={{
        background: "linear-gradient(135deg,rgb(55, 61, 94),rgb(161, 130, 84))",
        color: "#F0ECE5",
        height: "100vh",
        width: "100vw",
      }}
    >
      <h1 className="text-3xl font-extrabold mb-6 text-Black">Unity Error Log Uploader</h1>

      <div className="bg-[#222831] p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <input
          type="file"
          accept=".log,.txt"
          onChange={handleFileChange}
          className="block w-full text-gray-300 bg-gray-700 border border-gray-600 rounded-md p-3"
        />
        {/* <button
          onClick={handleUpload}
          className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-black font-semibold py-2 px-4 rounded transition duration-200"
        >
          Upload File
        </button> */}

<button
  onClick={handleUpload}
  className="w-full mt-4 bg-red-200 text-black font-semibold py-2 px-4 rounded transition duration-200"
>
  Upload File
</button>



        {uploadStatus && <p className="mt-2 text-yellow-400">{uploadStatus}</p>}

        {uploadProgress > 0 && (
          <div className="w-full bg-gray-600 rounded mt-3">
            <div
              className="bg-green-400 text-xs font-medium text-white text-center p-1 leading-none rounded"
              style={{ width: `${uploadProgress}%` }}
            >
              {uploadProgress}%
            </div>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mt-6 text-white">Uploaded Files</h2>

      <ul className="mt-3 w-full max-w-2xl">
        {fileList.length > 0 ? (
          fileList.map((file, index) => (
            <li
              key={index}
              className="flex justify-between items-center bg-gray-800 p-4 rounded-lg mb-2 shadow-md"
            >
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition"
              >
                {file.name}
              </a>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleAnalyze(file.name)}
                  className="bg-orange-500 hover:bg-orange-400 text-black px-3 py-1 rounded transition"
                >
                  Analyze
                </button>
                <button
                  onClick={() => handleDelete(file.name)}
                  className="bg-red-600 hover:bg-red-500 text-black px-3 py-1 rounded transition"
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        ) : (
          <p className="text-gray-400">No files uploaded yet.</p>
        )}
      </ul>

      {analyzedErrors && (
        <div className="mt-6 bg-[#393E46] p-6 rounded-lg shadow-lg w-full max-w-2xl">
          <h2 className="text-lg font-bold text-white">Errors in {analyzedErrors.filename}</h2>
          {analyzedErrors.errors.length > 0 ? (
            <ul className="list-disc pl-5 text-red-400">
              {analyzedErrors.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          ) : (
            <p className="text-green-400">No errors found.</p>
          )}
        </div>
      )}
    </div>
  );
}
