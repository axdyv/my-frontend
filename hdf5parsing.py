from flask import Flask, request, send_from_directory, jsonify, send_file
from flask_cors import CORS, cross_origin
import h5py
import json
import numpy as np
import matplotlib.pyplot as plt
import math
import os
import shutil
from io import BytesIO
import zipfile

app = Flask(__name__)
CORS(app)
@cross_origin(origin='*')

@app.route('/output-files', methods=['GET'])
def list_output_files():
    UPLOAD_FOLDER = 'uploads'
    OUTPUT_FOLDER = 'output'
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)
    print("made into list output")
    files = os.listdir('output')
    return jsonify(files)

@app.route('/output-files/<filename>', methods=['GET'])
def get_output_file(filename):
    print("made into get output")
    return send_from_directory('output', filename)

@app.route('/output-files/download-folder', methods=['GET'])
def download_folder():
    folder_path = request.args.get('folder')
    if not folder_path:
        return jsonify({'error': 'Folder parameter is required'}), 400

    folder_path = os.path.join('output', folder_path)
    if not os.path.isdir(folder_path):
        return jsonify({'error': 'Folder not found'}), 404

    memory_file = BytesIO()
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)
                zf.write(file_path, os.path.relpath(file_path, folder_path))

    memory_file.seek(0)
    return send_file(memory_file, mimetype='application/zip', as_attachment=True, download_name=f'{os.path.basename(folder_path)}.zip')

@app.route('/upload', methods=['POST'])
def upload_file():
    print("Upload request received")
    if 'file' not in request.files or len(request.files) != 1:
        return jsonify({'error': 'Please upload exactly one file'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if allowed_file(file.filename):
        print("allowed file")
        # Save the uploaded file
        file_path = os.path.join('uploads', file.filename)
        print(file_path)
        file.save(file_path)
    
        mainHDF5Method(file_path)
        
        return jsonify({
            'message': 'File successfully uploaded and processed',
            'file_name': file.filename,
            'file_size': os.path.getsize(file_path),
            'file_path': file_path
        }), 200
    else:
        return jsonify({'error': 'Invalid file type'}), 400

def mainHDF5Method(file_path):
    path_to_dataset = {}
    with h5py.File(file_path, 'r') as file:
        file.visititems(lambda name, obj: traverse_hdf5(name, obj, path_to_dataset))
    
    output_json_path = os.path.join('output', 'nestedDict.json')
    with open(output_json_path, 'w') as json_file:
        json.dump(path_to_dataset, json_file, indent=True)

def traverse_hdf5(name, obj, path_to_dataset):
    print(f"Traversing: {name}")
    if isinstance(obj, h5py.Group):
        # Traverse the group and create a dictionary path
        if '/' in name:
            current_dict = path_to_dataset
            folders = name.split('/')
            for folder in folders[:-1]:
                current_dict = current_dict.setdefault(folder, {})
            current_dict[folders[-1]] = {}
        else:
            path_to_dataset[name] = {}
    elif isinstance(obj, h5py.Dataset):
        current_dict = path_to_dataset
        filePath = ""
        folders = name.split('/')
        for folder in folders[:-1]:
            current_dict = current_dict.setdefault(folder, {})
            filePath = filePath + folder
        dataset_name = folders[-1]

        if (("X" in name or "data" in name or "image" in name) and obj.ndim >= 2):
            image_folder = os.path.join('output', filePath + dataset_name + "Images")
            os.makedirs(image_folder, exist_ok=True)
            imageDatasetHandling(obj, image_folder)
            current_dict[dataset_name] = image_folder
        elif obj.ndim >= 2:
            data_path = os.path.join('output', filePath + dataset_name + "Data.npy")
            np.save(data_path, np.array(obj))
            current_dict[dataset_name] = data_path
        elif obj.ndim == 1:
            labels_path = os.path.join('output', filePath + dataset_name + "Labels.json")
            save_labels(obj, labels_path)
            current_dict[dataset_name] = labels_path

def save_labels(obj, labels_path):
    labels = np.array(obj)
    num_images = labels.shape[0]
    label_dict = {}

    for i in range(num_images):
        if isinstance(labels[i], bytes):
            label = labels[i].decode()
        elif isinstance(labels[i], str):
            label = labels[i]
        else:
            label = int(labels[i])
        label_dict[f"img{i}.jpg"] = label

    with open(labels_path, 'w') as json_file:
        json.dump(label_dict, json_file, indent=True)

def imageDatasetHandling(dataset, folder_name):
    dataset = np.array(dataset)
    dataset = np.abs(dataset)
    scale_down = np.max(dataset) > 1

    if scale_down:
        dataset = dataset / 255.0
    
    size_of_dataset = dataset.shape[0]
    for i in range(size_of_dataset):
        image = dataset[i]
        if dataset.ndim == 2:
            image = image.reshape(int(math.sqrt(dataset.shape[1])), int(math.sqrt(dataset.shape[1])))
        plt.imsave(os.path.join(folder_name, f"img{i}.jpg"), image)

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'h5', 'hdf5', 'dcm', 'dicom', 'nii'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# def extract_extension(filename):
#     hdf5_extensions = {'h5', 'hdf5'}
#     dcm_extensions = {'dcm', 'dicom', 'nii'}
#     return '.' in filename and filename.rsplit('.', 1)[1].lower() in hdf5_extensions

if __name__ == '__main__':
    app.run(debug=True)