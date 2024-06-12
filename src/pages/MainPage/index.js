import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomFileUpload from '../../components/CustomFIleUploadField';
import Button from '@mui/material/Button';

function MainPage() {
  
  const [selectedHDF5File, setSelectedHDF5File] = useState(null);
  const [selectedDICOMFolder, setSelectedDICOMFolder] = useState(null);
  const [outputHDF5Files, setOutputHDF5Files] = useState([]);
  const [outputDICOMFiles, setOutputDICOMFiles] = useState([]);
  const [currentHDF5Path, setCurrentHDF5Path] = useState('');
  const [currentDICOMPath, setCurrentDICOMPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleHDF5FileChange = (files) => {
    setSelectedHDF5File(files);
  };

  const handleDICOMFolderChange = (files) => {
    setSelectedDICOMFolder(files);
  };

  const handleHDF5Upload = () => {
    if (selectedHDF5File) {
      const formData = new FormData();
      formData.append('file', selectedHDF5File[0]);

      setLoading(true);
      axios.post('http://127.0.0.1:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      })
      .then(response => {
        console.log('HDF5 file upload successful:', response.data);
        fetchOutputHDF5Files(); // Refresh the output files list after upload
      })
      .catch(error => {
        console.error('Error uploading HDF5 file:', error);
        setError('Error uploading HDF5 file.');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      alert('No HDF5 file selected');
    }
  };

  const handleDICOMUpload = () => {
    if (selectedDICOMFolder) {
      const formData = new FormData();
      formData.append('file', selectedDICOMFolder[0]);

      setLoading(true);
      axios.post('http://127.0.0.1:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      })
      .then(response => {
        console.log('DICOM folder upload successful:', response.data);
        fetchOutputDICOMFiles(); // Refresh the output files list after upload
      })
      .catch(error => {
        console.error('Error uploading DICOM folder:', error);
        setError('Error uploading DICOM folder.');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      alert('No DICOM folder selected');
    }
  };

  const fetchOutputHDF5Files = (path = '') => {
    setLoading(true);
    axios.get(`http://127.0.0.1:5000/output-files?path=${path}`)
      .then(response => {
        console.log('Fetched HDF5 output files:', response.data);
        setOutputHDF5Files(response.data);
        setCurrentHDF5Path(path);
        setError(null);
      })
      .catch(error => {
        console.error('Error fetching HDF5 output files:', error);
        setError('Error fetching HDF5 output files.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchOutputDICOMFiles = (path = '') => {
    setLoading(true);
    axios.get(`http://127.0.0.1:5000/output-files?path=${path}`)
      .then(response => {
        console.log('Fetched DICOM output files:', response.data);
        setOutputDICOMFiles(response.data);
        setCurrentDICOMPath(path);
        setError(null);
      })
      .catch(error => {
        console.error('Error fetching DICOM output files:', error);
        setError('Error fetching DICOM output files.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const downloadFile = (filename) => {
    setLoading(true);
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
      setError('Error downloading file.');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const downloadFolder = (foldername) => {
    setLoading(true);
    axios.get(`http://127.0.0.1:5000/output-files/download-folder?folder=${foldername}`, {
      responseType: 'blob',
    })
    .then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${foldername}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch(error => {
      console.error('Error downloading folder:', error);
      setError('Error downloading folder.');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchOutputHDF5Files();
    fetchOutputDICOMFiles();
  }, []);

  const handleHDF5DirectoryClick = (dir) => {
    fetchOutputHDF5Files(`${currentHDF5Path}/${dir}`);
  };

  const handleDICOMDirectoryClick = (dir) => {
    fetchOutputDICOMFiles(`${currentDICOMPath}/${dir}`);
  };

  const handleHDF5BackClick = () => {
    const parentPath = currentHDF5Path.split('/').slice(0, -1).join('/');
    fetchOutputHDF5Files(parentPath);
  };

  const handleDICOMBackClick = () => {
    const parentPath = currentDICOMPath.split('/').slice(0, -1).join('/');
    fetchOutputDICOMFiles(parentPath);
  };

  const renderHDF5Breadcrumbs = () => {
    const paths = currentHDF5Path.split('/').filter(path => path);
    return (
      <div className="breadcrumbs">
        <span onClick={() => fetchOutputHDF5Files('')}>Home</span>
        {paths.map((path, index) => (
          <span key={index} onClick={() => fetchOutputHDF5Files(paths.slice(0, index + 1).join('/'))}>
            {path}
          </span>
        ))}
      </div>
    );
  };

  const renderDICOMBreadcrumbs = () => {
    const paths = currentDICOMPath.split('/').filter(path => path);
    return (
      <div className="breadcrumbs">
        <span onClick={() => fetchOutputDICOMFiles('')}>Home</span>
        {paths.map((path, index) => (
          <span key={index} onClick={() => fetchOutputDICOMFiles(paths.slice(0, index + 1).join('/'))}>
            {path}
          </span>
        ))}
      </div>
    );
  };

  return (
    <React.Fragment>
      
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>} 
      
      <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
      
        <div style={{width: '100%', margin: '0px 12px'}}>
          <div>
            <h2>Upload HDF5 File</h2>
            <CustomFileUpload files={selectedHDF5File} setFiles={handleHDF5FileChange} accept={'.h5,.hdf5'}/>
            <Button onClick={() => handleHDF5Upload()} variant="contained">Upload HDF5 File</Button>    
          </div>
          <div className="output-section">
            <h2>Output HDF5 Files</h2>
            {renderHDF5Breadcrumbs()}
            {currentHDF5Path && <button onClick={handleHDF5BackClick}>Back</button>}
            <ul>
              {outputHDF5Files.map((file, index) => {
                const isDirectory = !file.includes('.');
                return (
                  <li key={index}>
                    {isDirectory ? (
                      <span onClick={() => handleHDF5DirectoryClick(file)} style={{ cursor: 'pointer', color: 'blue' }}>{file}</span>
                    ) : (
                      <>
                        {file} <button onClick={() => downloadFile(file)}>Download</button>
                      </>
                    )}
                    {isDirectory && (
                      <button onClick={() => downloadFolder(file)}>Download Folder</button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>      
        </div>    
            
        <div style={{width: '100%', margin: '0px 12px'}}>
          <div>
            <h2>Upload DICOM Folder</h2>
            <CustomFileUpload files={selectedDICOMFolder} setFiles={handleDICOMFolderChange} accept={'.dcm,.dicom'}/>
            <Button onClick={() => handleDICOMUpload()} variant="contained">Upload DICOM Folder</Button>  
          </div>
          <div className="output-section">
            <h2>Output DICOM Files</h2>
            {renderDICOMBreadcrumbs()}
            {currentDICOMPath && <button onClick={handleDICOMBackClick}>Back</button>}
            <ul>
              {outputDICOMFiles.map((file, index) => {
                const isDirectory = !file.includes('.');
                return (
                  <li key={index}>
                    {isDirectory ? (
                      <span onClick={() => handleDICOMDirectoryClick(file)} style={{ cursor: 'pointer', color: 'blue' }}>{file}</span>
                    ) : (
                      <>
                        {file} <button onClick={() => downloadFile(file)}>Download</button>
                      </>
                    )}
                    {isDirectory && (
                      <button onClick={() => downloadFolder(file)}>Download Folder</button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div> 
        </div>

      </div>
    </React.Fragment>
  );
}

export default MainPage