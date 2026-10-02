from flask import Flask, render_template, request, send_file, jsonify
from cryptography.fernet import Fernet, InvalidToken
import hashlib
from pathlib import Path
import os
import base64

app = Flask(__name__)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def make_key(password):
    """Create a Fernet key from the user's password."""
    password_hash = hashlib.sha256(password.encode()).digest()
    return base64.urlsafe_b64encode(password_hash)


@app.route("/")
def home():
    return render_template("index.html")


@app.post("/protect")
def protect():
    file = request.files.get("file")
    password = request.form.get("password", "")

    if not file or not file.filename:
        return jsonify({"error": "Please select a document."}), 400

    if not password:
        return jsonify({"error": "Please enter a security key."}), 400

    original_name = Path(file.filename).name
    data = file.read()

    # Encrypt the document before it is stored.
    encrypted = Fernet(make_key(password)).encrypt(data)

    output_name = original_name + ".veil"
    output_path = UPLOAD_DIR / output_name
    output_path.write_bytes(encrypted)

    return jsonify({
        "message": "Document sealed successfully.",
        "filename": output_name,
        "original_name": original_name,
        "size": len(encrypted)
    })


@app.get("/download/<path:filename>")
def download_protected(filename):
    safe_name = Path(filename).name
    file_path = UPLOAD_DIR / safe_name

    if not file_path.exists() or not safe_name.endswith(".veil"):
        return jsonify({"error": "Protected file not found."}), 404

    return send_file(file_path, as_attachment=True, download_name=safe_name)


@app.post("/unlock")
def unlock():
    file = request.files.get("file")
    password = request.form.get("password", "")

    if not file or not file.filename:
        return jsonify({"error": "Please select a protected .veil file."}), 400

    if not password:
        return jsonify({"error": "Please enter the security key."}), 400

    try:
        encrypted = file.read()
        decrypted = Fernet(make_key(password)).decrypt(encrypted)

        original_name = Path(file.filename).name
        if original_name.endswith(".veil"):
            original_name = original_name[:-5]

        output_path = UPLOAD_DIR / ("unlocked_" + original_name)
        output_path.write_bytes(decrypted)

        return send_file(output_path, as_attachment=True, download_name=original_name)

    except InvalidToken:
        return jsonify({"error": "Invalid security key. Document remains sealed."}), 401


if __name__ == "__main__":
    app.run(debug=True)
