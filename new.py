from flask import Flask, request, jsonify
import h5py
import json
import numpy as np
import matplotlib.pyplot as plt
import math
import os

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'output'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files or len(request.files) != 1:
        return jsonify({'error': 'Please upload exactly one file'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if allowed_file(file.filename):
        # Save the uploaded file
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        
        # Process the uploaded file
        path_to_dataset = process_hdf5_file(file_path)
        
        return jsonify({
            'message': 'File successfully uploaded and processed',
            'file_name': file.filename,
            'file_size': os.path.getsize(file_path),
            'file_path': file_path,
            'output_files': list(path_to_dataset.keys())
        }), 200
    else:
        return jsonify({'error': 'Invalid file type'}), 400

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'h5', 'hdf5', 'dcm', 'dicom', 'nii'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_hdf5_file(filename):
    path_to_dataset = {}
    with h5py.File(filename, 'r') as file:
        file.visititems(lambda name, obj: traverse_hdf5(name, obj, path_to_dataset))
    
    output_json_path = os.path.join(OUTPUT_FOLDER, 'nestedDict.json')
    with open(output_json_path, 'w') as json_file:
        json.dump(path_to_dataset, json_file, indent=True)
    
    return path_to_dataset

def traverse_hdf5(name, obj, path_to_dataset):
    print(f"Name: {name}")
    if isinstance(obj, h5py.Group):
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
        folders = name.split('/')
        for folder in folders[:-1]:
            current_dict = current_dict.setdefault(folder, {})
        dataset_name = folders[-1]
        
        if (("X" in name or "data" in name or "image" in name) and obj.ndim >= 2):
            image_folder = os.path.join(OUTPUT_FOLDER, dataset_name + "Images")
            os.makedirs(image_folder, exist_ok=True)
            image_dataset_handling(obj, image_folder)
            current_dict[dataset_name] = image_folder
        elif obj.ndim >= 2:
            data_path = os.path.join(OUTPUT_FOLDER, dataset_name + "Data.npy")
            np.save(data_path, np.array(obj))
            current_dict[dataset_name] = data_path
        elif obj.ndim == 1:
            labels_path = os.path.join(OUTPUT_FOLDER, dataset_name + "Labels.json")
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

def image_dataset_handling(dataset, folder_name):
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

if __name__ == '__main__':
    app.run(debug=True)
