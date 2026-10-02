# VEIL — Private Document Protection 🔐

VEIL is a small cybersecurity web application designed around one problem:

> Sensitive exam papers and documents can be exposed during digital transfer before the intended receiver accesses them.

VEIL protects a document with password-based encryption before transfer. The protected `.veil` file cannot be recovered without the correct security key.

## Features

- Futuristic compact cybersecurity UI
- Drag-and-drop document selection
- Password-based document encryption
- Protected `.veil` file generation
- Direct download of the protected file for transfer
- Password verification and document recovery
- No database
- No login/signup
- Flask backend
- Responsive layout

## Tech Stack

- HTML
- CSS
- JavaScript
- Python Flask
- Cryptography (Fernet)

## Run locally

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Install:

```bash
pip install -r requirements.txt
```

Run:

```bash
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

## Important project explanation

VEIL does not magically prevent a document from being leaked after someone has legitimately opened it. Its purpose is to reduce unauthorized access **before and during transfer** by keeping the transferred file encrypted.

## GitHub

Do not upload real confidential documents or generated `.veil` files.

The `uploads/` folder is intentionally kept for local runtime use.
