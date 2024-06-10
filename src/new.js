import React, { useState } from 'react';
import axios from 'axios';

function App() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [results, setResults] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setMessage('');
        setResults(null);
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:5000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage(response.data.message);
            setResults(response.data);
        } catch (error) {
            if (error.response) {
                setMessage(error.response.data.error);
            } else {
                setMessage('An error occurred while uploading the file.');
            }
        }
    };

    const renderResults = () => {
        if (results && results.file_name) {
            return (
                <div>
                    <h3>File Information:</h3>
                    <p><strong>File Name:</strong> {results.file_name}</p>
                    <p><strong>File Size:</strong> {results.file_size} bytes</p>
                    <p><strong>File Path:</strong> {results.file_path}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="App">
            <h1>Upload File</h1>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
            {message && <p>{message}</p>}
            {renderResults()}
        </div>
    );
}

export default App;
