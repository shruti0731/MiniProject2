from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import cv2
import numpy as np
import pytesseract as ocr
import traceback

from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Tesseract configuration
ocr.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
os.environ["TESSDATA_PREFIX"] = r"C:\Program Files\Tesseract-OCR\tessdata_best"

# Load Sanskrit-to-English translation model and tokenizer once
# tokenizer = AutoTokenizer.from_pretrained("Swamitucats/M2M100_Sanskrit_English")
# model = AutoModelForSeq2SeqLM.from_pretrained("Swamitucats/M2M100_Sanskrit_English")
custom_model_path = "./custom_model" 

tokenizer = AutoTokenizer.from_pretrained(custom_model_path)
model = AutoModelForSeq2SeqLM.from_pretrained(custom_model_path)


# Preprocessing of image for better OCR accuracy
def preprocess_image(image_path):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Unable to read image: {image_path}")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    blurred = cv2.GaussianBlur(resized, (3, 3), 0)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 31, 15)
    kernel = np.ones((2, 2), np.uint8)
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    final = cv2.bitwise_not(closed)
    return final

# Filter only valid Sanskrit characters
def filter_sanskrit_text(text):
    return ''.join([char for char in text if '\u0900' <= char <= '\u097F' or char in [' ', '\n', '.', '।', '-', ',', ':', ';']])

# Extract Sanskrit text from image using Tesseract OCR
def extract_sanskrit_text(image):
    try:
        config = "--oem 1 --psm 6"
        raw_text = ocr.image_to_string(image, lang="san", config=config)
        return filter_sanskrit_text(raw_text)
    except Exception as e:
        print(f"OCR error: {e}")
        return ""

# Translate Sanskrit to English using loaded model
def translate_sanskrit_to_english(sanskrit_text):
    inputs = tokenizer(sanskrit_text, return_tensors="pt")
    outputs = model.generate(**inputs)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

# API endpoint to handle file upload and translation
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        processed_image = preprocess_image(file_path)
        extracted_text = extract_sanskrit_text(processed_image)

        if not extracted_text.strip():
            return jsonify({"message": "No Sanskrit text detected. Try a clearer image."}), 200

        translated_text = translate_sanskrit_to_english(extracted_text)

        return jsonify({
            "message": "Sanskrit text extracted and translated successfully",
            "text": extracted_text,
            "translation": translated_text
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"OCR/Translation failed: {str(e)}"}), 500

# plain text translation api endpoint
@app.route('/translate', methods=['POST'])
def translate_text():
    try:
        data = request.get_json()
        raw_text = data.get('text', '')

        if not raw_text.strip():
            return jsonify({'error': 'No text provided'}), 400

        filtered_text = filter_sanskrit_text(raw_text)
        inputs = tokenizer(filtered_text, return_tensors="pt", padding=True, truncation=True)
        translated = model.generate(**inputs, max_length=512)
        translation = tokenizer.decode(translated[0], skip_special_tokens=True)

        return jsonify({'translation': translation})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)