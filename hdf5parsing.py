from flask import Flask, request, jsonify
import h5py
import json
import numpy as np
import matplotlib.pyplot as plt
import math
import os

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/upload', methods=['POST'])
def upload_file():
    # Check if the 'file' key is in the request and if multiple files are present
    if 'file' not in request.files or len(request.files) != 1:
        return jsonify({'error': 'Please upload exactly one file'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if allowed_file(file.filename):
        # Save the file
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        
        return jsonify({
            'message': 'File successfully uploaded',
            'file_name': file.filename,
            'file_size': os.path.getsize(file_path),
            'file_path': file_path
        }), 200
    else:
        return jsonify({'error': 'Invalid file type'}), 400

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'h5', 'hdf5', 'dcm', 'dicom', 'nii'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

if __name__ == '__main__':
    app.run(debug=True)

# Example function for processing HDF5 files (add your processing functions as needed)
pathToDataset = dict()

def traverse_hdf5(name, obj):
    """
    Function to print the name of the object and its type.
    """
    print(f"Name: {name}")
    if isinstance(obj, h5py.Group):
        # path
        if '/' in name:
            currentDict = pathToDataset
            i = 0
            folders = name.split('/')
            while i < len(folders) - 1:
                currentDict = pathToDataset[folders[i]]
                i += 1
            currentDict[folders[i]] = dict()
        else:
            pathToDataset[name] = dict()
    elif isinstance(obj, h5py.Dataset):
        currentDict = pathToDataset
        i = 0
        folders = name.split('/')
        nameForSaving = ""
        while i < len(folders) - 1:
            currentDict = currentDict[folders[i]]
            nameForSaving += folders[i]
            i += 1
        nameForSaving += folders[i]
        currentDict[folders[i]] = nameForSaving
        # could be for image data or corresponding labels
        if (("X" in name or "data" in name or "image" in name) and obj.ndim >= 2):
            currentDict[folders[i]] += "Images"
            # send to image handling
            imageDatasetHandling(obj, nameForSaving)
        # numpy data to be saved
        elif (obj.ndim >= 2):
            currentDict[folders[i]] += "Data.npy"
            np.save(currentDict[folders[i]], np.array(obj))
        # labeling purposes, is num classes needed
        elif (obj.ndim == 1):
            currentDict[folders[i]] += "Labels.json"
            labels = np.array(obj)
            labelsNew = []
            numImages = obj.shape[0]
            i = 0
            image_filenames = []
            label_dict = dict()
            while i < numImages:
                if isinstance(labels[0], bytes):
                    # print('entered successfully')
                    # labelsNew.append(labels[i].decode())
                    image_filenames.append(f"img{i}.jpg")
                    label_dict[image_filenames[i]] = labels[i].decode()
                elif isinstance(labels[i], str):
                    image_filenames.append(f"img{i}.jpg")
                    label_dict[image_filenames[i]] = labels[i]
                else:
                    image_filenames.append(f"img{i}.jpg")
                    label_dict[image_filenames[i]] = int(labels[i])
                i += 1
            with open(nameForSaving + "Labels.json", 'w') as json_file:
                json.dump(label_dict, json_file, indent=True)

    elif isinstance(obj, h5py.Datatype):
        print("This is a datatype.")
    print()  # For better readability

def imageDatasetHandling(dataset, folderName):
    if not os.path.exists(folderName):
        os.makedirs(folderName)

    dataset = np.array(dataset)
    dataset = np.abs(dataset)

    scaleDown = False

    # check if dataset values are in 0-1 range or 0-255 range, using random int
    if (dataset.ndim == 2):
        i = 0
        while (i < 10):
            r = np.random.randint(0, dataset.shape[0])
            c = np.random.randint(0, dataset.shape[1])
            value = dataset[r][c]
            if (value > 1):
                scaleDown = True
                break
            i += 1
    elif (dataset.ndim == 3):
        i = 0
        while (i < 10):
            r = np.random.randint(0, dataset.shape[0])
            c = np.random.randint(0, dataset.shape[1])
            d = np.random.randint(0, dataset.shape[2])
            value = dataset[r][c][d]
            if (value > 1):
                scaleDown = True
                break
            i += 1
    elif (dataset.ndim == 4):
        if (dataset.shape[3] == 1):
            dataset = np.repeat(dataset, 3, axis=-1)
        i = 0
        while (i < 10):
            r = np.random.randint(0, dataset.shape[0])
            c = np.random.randint(0, dataset.shape[1])
            d = np.random.randint(0, dataset.shape[2])
            z = np.random.randint(0, dataset.shape[3])
            value = dataset[r][c][d][z]
            if (value > 1):
                scaleDown = True
                break
            i += 1

    if (scaleDown):
        dataset = dataset/255
    sizeOfDataset = dataset.shape[0]
    i = 0
    while (i < sizeOfDataset):
        image = dataset[i]
        if (dataset.ndim == 2):
            image = dataset[i].reshape(int(math.sqrt(dataset.shape[1])), int(math.sqrt(dataset.shape[1])))
        plt.imsave(os.path.join(folderName, f"img{i}.jpg"), image)
        i += 1
        # cv2_imshow(trainData[i])
        # cv2.waitKey(4)

# Example usage (this would normally be in a separate script or triggered by a different endpoint)
pathToDataset = dict()
filename = "/content/usps.h5"
file = h5py.File(filename, 'r')
file.visititems(traverse_hdf5)

with open('nestedDict.json', 'w') as json_file:
    json.dump(pathToDataset, json_file, indent=True)
