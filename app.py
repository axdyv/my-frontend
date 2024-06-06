from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if allowed_file(file.filename):
        # Process the file (e.g., save it, perform some operation)
        return jsonify({'message': 'File successfully uploaded'}), 200
    else:
        return jsonify({'error': 'Invalid file type'}), 400

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'h5', 'hdf5', 'dcm', 'dicom', 'nii'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

if __name__ == '__main__':
    app.run(debug=True)
