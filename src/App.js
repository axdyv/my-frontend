import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      axios.post('http://127.0.0.1:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(response => {
        console.log('File upload successful:', response.data);
      })
      .catch(error => {
        console.error('Error uploading file:', error);
      });
    } else {
      console.log('No file selected');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to My Single-Page Website</h1>
        <p>This is a simple single-page application built with React.</p>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".h5,.hdf5,.dcm,.dicom"
        />
        <button onClick={handleUpload}>Upload File</button>
      </header>
    </div>
  );
}

export default App;
