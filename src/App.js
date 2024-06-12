import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [outputFiles, setOutputFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');

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
        }
      })
      .then(response => {
        console.log('File upload successful:', response.data);
        fetchOutputFiles(); // Refresh the output files list after upload
      })
      .catch(error => {
        console.error('Error uploading file:', error);
      });
    } else {
      console.log('No file selected');
    }
  };

  const fetchOutputFiles = (path = '') => {
    axios.get(`http://127.0.0.1:5000/output-files?path=${path}`)
      .then(response => {
        console.log('Fetched output files:', response.data);
        setOutputFiles(response.data);  // Update the state with the response data
        setCurrentPath(path);
      })
      .catch(error => {
        console.error('Error fetching output files:', error);
      });
  };

  const downloadFile = (filename) => {
    axios.get(`http://127.0.0.1:5000/output-files/${filename}`, {
      responseType: 'blob',
    })
    .then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch(error => {
      console.error('Error downloading file:', error);
    });
  };

  useEffect(() => {
    fetchOutputFiles();  // Fetch the list of output files when the component mounts
  }, []);

  const handleDirectoryClick = (dir) => {
    fetchOutputFiles(`${currentPath}/${dir}`);
  };

  const handleBackClick = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    fetchOutputFiles(parentPath);
  };

  console.log('outputFiles:', outputFiles); // Debugging: Log outputFiles state

  return (
    <div className="App">
      <header className="App-header">
        <h1>HDF5/DICOM File Viewer</h1>
        <p>Please upload an HDF5 or DICOM file</p>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".h5,.hdf5,.dcm,.dicom,.nii"
        />
        <button onClick={handleUpload}>Upload File</button>
        <h2>Output Files</h2>
        {currentPath && <button onClick={handleBackClick}>Back</button>}
        <ul>

          {outputFiles.map((file, index) => {
            const isDirectory = !file.includes('.');
            return (
              <li key={index}>
                {isDirectory ? (
                  <span onClick={() => downloadFile(file)} style={{cursor: 'pointer', color: 'blue'}}>{file}</span>
                ) : (
                  <>
                    {file} <button onClick={() => downloadFile(file)}>Download</button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </header>
    </div>
  );
}

export default App;

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './App.css';

// function App() {
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [outputFiles, setOutputFiles] = useState([]);

//   const handleFileChange = (event) => {
//     setSelectedFile(event.target.files[0]);
//   };

//   const handleUpload = () => {
//     if (selectedFile) {
//       const formData = new FormData();
//       formData.append('file', selectedFile);

//       axios.post('http://127.0.0.1:5000/upload', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       })
//       .then(response => {
//         console.log('File upload successful:', response.data);
//          // Optionally refresh the output files list
//         fetchOutputFiles();
//       })
//       .catch(error => {
//         console.error('Error uploading file:', error);
//       });
//     } else {
//       console.log('No file selected');
//     }
//   };

//   const fetchOutputFiles = () => {
//     axios.get('http://127.0.0.1:5000/output-files')
//       .then(response => {
//         setOutputFiles(response.data);
//       })
//       .catch(error => {
//         console.error('Error fetching output files:', error);
//       });
//   };

//   const downloadFile = (filename) => {
//     axios.get(`http://127.0.0.1:5000/output-files/${filename}`, {
//       responseType: 'blob',
//     })
//     .then(response => {
//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', filename);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//     })
//     .catch(error => {
//       console.error('Error downloading file:', error);
//     });
//   };

//   useEffect(() => {
//     fetchOutputFiles();
//   }, []);

//  return (
//     <div className="App">
//       <header className="App-header">
//         <h1>Welcome to My Single-Page Website</h1>
//         <p>This is a simple single-page application built with React.</p>
//         <input
//           type="file"
//           onChange={handleFileChange}
//           accept=".h5,.hdf5,.dcm,.dicom,.nii"
//         />
//         <button onClick={handleUpload}>Upload File</button>
//         <h2>Output Files</h2>
//         <ul>
//           {outputFiles.map((file, index) => (
//             <li key={index}>
//               {file} <button onClick={() => downloadFile(file)}>Download</button>
//             </li>
//           ))}
//         </ul>
//       </header>
//     </div>
//   );
// }

// export default App;
