import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomFileUpload from '../../components/CustomFIleUploadField';
import Button from '@mui/material/Button';
import { Paper, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import Modal from 'react-modal';

function MainPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [outputHDF5Files, setOutputHDF5Files] = useState([]);
  const [outputDICOMFiles, setOutputDICOMFiles] = useState([]);
  const [currentHDF5Path, setCurrentHDF5Path] = useState('');
  const [currentDICOMPath, setCurrentDICOMPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileType, setFileType] = useState('');

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [imageGalleryModalIsOpen, setImageGalleryModalIsOpen] = useState(false);
  const [imageGallery, setImageGallery] = useState([]);

  const handleFileChange = (files) => {
    setSelectedFile(files);
  };

  const handleUpload = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile[0]);

      setLoading(true);
      axios.post(`http://127.0.0.1:5000/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      })
      .then(response => {
        console.log(`${fileType} file upload successful:`, response.data);
        fileType === 'HDF5' ? fetchOutputHDF5Files() : fetchOutputDICOMFiles(); // Refresh the output files list after upload
      })
      .catch(error => {
        console.error(`Error uploading ${fileType} file:`, error);
        setError(`Error uploading ${fileType} file.`);
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setError('No file selected');
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

  const openModal = (file) => {
    setPreviewFile(file);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setPreviewFile(null);
    setModalIsOpen(false);
  };

  const openImageGalleryModal = (folder) => {
    // Assuming we fetch images from the server based on the folder path
    axios.get(`http://127.0.0.1:5000/output-files/folder-images?folder=${folder}`)
      .then(response => {
        setImageGallery(response.data);
        setImageGalleryModalIsOpen(true);
      })
      .catch(error => {
        console.error('Error fetching folder images:', error);
        setError('Error fetching folder images.');
      });
  };

  const closeImageGalleryModal = () => {
    setImageGallery([]);
    setImageGalleryModalIsOpen(false);
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
      {loading && <CircularProgress />}
      {error && <p className="error">{error}</p>}

      <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>

        <Paper elevation={3} style={{width: '100%', margin: '0px 12px', padding: '12px'}}>
          <div>
            <h2>Upload File</h2>
            <CustomFileUpload files={selectedFile} setFiles={handleFileChange} accept={fileType === 'HDF5' ? '.h5,.hdf5' : '.zip'}/>
            <FormControl fullWidth margin="normal">
              <InputLabel id="file-type-label">File Type</InputLabel>
              <Select
                labelId="file-type-label"
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
              >
                <MenuItem value="HDF5">HDF5</MenuItem>
                <MenuItem value="DICOM">DICOM</MenuItem>
              </Select>
            </FormControl>
            <Button onClick={handleUpload} variant="contained" style={{width: '100%'}} disabled={!fileType}>
              Upload File
            </Button>
          </div>
          <div className="output-section">
            <h2>Output {fileType === 'HDF5' ? 'HDF5' : 'DICOM'} Files</h2>
            {fileType === 'HDF5' ? renderHDF5Breadcrumbs() : renderDICOMBreadcrumbs()}
            {fileType === 'HDF5' && currentHDF5Path && <button onClick={handleHDF5BackClick}>Back</button>}
            {fileType === 'DICOM' && currentDICOMPath && <button onClick={handleDICOMBackClick}>Back</button>}
            {fileType === 'HDF5' ? (
              outputHDF5Files.length === 0 ? (
                <p>No HDF5 files available.</p>
              ) : (
                <ul>
                  {outputHDF5Files.map((file, index) => {
                    const isDirectory = !file.includes('.');
                    return (
                      <li key={index}>
                        {isDirectory ? (
                          <span onClick={() => handleHDF5DirectoryClick(file)} style={{ cursor: 'pointer', color: 'blue' }}>{file}</span>
                        ) : (
                          <>
                            <span onClick={() => openModal(`http://127.0.0.1:5000/output-files/${file}`)} style={{ cursor: 'pointer', color: 'blue' }}>{file}</span>
                            <button onClick={() => downloadFile(file)}>Download</button>
                          </>
                        )}
                        {isDirectory && (
                          <>
                            <button onClick={() => downloadFolder(file)}>Download Folder</button>
                            <button onClick={() => openImageGalleryModal(file)}>View Folder Images</button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )
            ) : (
              outputDICOMFiles.length === 0 ? (
                <p>No DICOM files available.</p>
              ) : (
                <ul>
                  {outputDICOMFiles.map((file, index) => {
                    const isDirectory = !file.includes('.');
                    return (
                      <li key={index}>
                        {isDirectory ? (
                          <span onClick={() => handleDICOMDirectoryClick(file)} style={{ cursor: 'pointer', color: 'blue' }}>{file}</span>
                        ) : (
                          <>
                            <span onClick={() => openModal(`http://127.0.0.1:5000/output-files/${file}`)} style={{ cursor: 'pointer', color: 'blue' }}>{file}</span>
                            <button onClick={() => downloadFile(file)}>Download</button>
                          </>
                        )}
                        {isDirectory && (
                          <>
                            <button onClick={() => downloadFolder(file)}>Download Folder</button>
                            <button onClick={() => openImageGalleryModal(file)}>View Folder Images</button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )
            )}
          </div>
        </Paper>

      </div>

      <Modal isOpen={modalIsOpen} onRequestClose={closeModal} contentLabel="File Preview">
        <div style={{ textAlign: 'center' }}>
          {previewFile && (
            <div>
              {previewFile.match(/.(jpeg|jpg|png|gif)$/i) ? (
                <img src={previewFile} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />
              ) : (
                <iframe src={previewFile} style={{ width: '100%', height: '80vh' }} title="File Preview"></iframe>
              )}
            </div>
          )}
          <button onClick={closeModal} style={{ marginTop: '20px' }}>Close</button>
        </div>
      </Modal>

      <Modal isOpen={imageGalleryModalIsOpen} onRequestClose={closeImageGalleryModal} contentLabel="Image Gallery">
        <div style={{ textAlign: 'center' }}>
          <h2>Image Gallery</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {imageGallery.map((image, index) => (
              <LazyLoadImage key={index} src={image} alt={`Gallery ${index}`} style={{ width: '200px', margin: '10px' }} />
            ))}
          </div>
          <button onClick={closeImageGalleryModal} style={{ marginTop: '20px' }}>Close</button>
        </div>
      </Modal>
    </React.Fragment>
  );
}

export default MainPage;
