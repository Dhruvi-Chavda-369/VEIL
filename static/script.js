const tabs = document.querySelectorAll(".tab");
const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const dropzone = document.getElementById("dropzone");
const dropTitle = document.getElementById("dropTitle");
const dropSub = document.getElementById("dropSub");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const form = document.getElementById("docForm");
const actionText = document.getElementById("actionText");
const result = document.getElementById("result");
const processing = document.getElementById("processing");
const processTitle = document.getElementById("processTitle");
const meterBar = document.getElementById("meterBar");
const strength = document.getElementById("strength");

let mode = "protect";

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        mode = tab.dataset.mode;

        actionText.textContent = mode === "protect" ? "SEAL DOCUMENT" : "OPEN DOCUMENT";
        dropTitle.textContent = mode === "protect" ? "DROP PAPER HERE" : "DROP SEALED FILE HERE";
        dropSub.textContent = mode === "protect" ? "PDF, DOCX, TXT or any document" : "Select a .veil protected document";
        clearFile();
        hideResult();
    });
});

browseBtn.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("click", e => {
    if (!e.target.closest("button")) fileInput.click();
});

fileInput.addEventListener("change", () => setFile(fileInput.files[0]));

["dragenter", "dragover"].forEach(event => {
    dropzone.addEventListener(event, e => {
        e.preventDefault();
        dropzone.classList.add("drag");
    });
});
["dragleave", "drop"].forEach(event => {
    dropzone.addEventListener(event, e => {
        e.preventDefault();
        dropzone.classList.remove("drag");
    });
});
dropzone.addEventListener("drop", e => setFile(e.dataTransfer.files[0]));

function setFile(file) {
    if (!file) return;
    fileInput.files = (() => {
        const dt = new DataTransfer();
        dt.items.add(file);
        return dt.files;
    })();
    dropTitle.textContent = "DOCUMENT READY";
    dropSub.textContent = "Security channel prepared";
    fileName.textContent = file.name;
    fileSize.textContent = formatSize(file.size);
}

function clearFile() {
    fileInput.value = "";
    dropTitle.textContent = mode === "protect" ? "DROP PAPER HERE" : "DROP SEALED FILE HERE";
    dropSub.textContent = mode === "protect" ? "PDF, DOCX, TXT or any document" : "Select a .veil protected document";
    fileName.textContent = "—";
    fileSize.textContent = "—";
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

togglePassword.addEventListener("click", () => {
    password.type = password.type === "password" ? "text" : "password";
});

password.addEventListener("input", () => {
    const n = password.value.length;
    const percent = Math.min(100, n * 10);
    meterBar.style.width = percent + "%";
    strength.textContent = n === 0 ? "WAITING" : n < 6 ? "WEAK" : n < 10 ? "MEDIUM" : "STRONG";
});

form.addEventListener("submit", async e => {
    e.preventDefault();
    hideResult();

    const file = fileInput.files[0];
    if (!file) return showResult("Select a document first.", true);
    if (!password.value) return showResult("Enter a security key first.", true);

    showProcessing();

    const data = new FormData();
    data.append("file", file);
    data.append("password", password.value);

    try {
        const response = await fetch(mode === "protect" ? "/protect" : "/unlock", {
            method: "POST",
            body: data
        });

        if (mode === "protect") {
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || "Protection failed.");
            await wait(900);
            hideProcessing();
            showDownloadResult(json);
        } else {
            if (!response.ok) {
                const json = await response.json();
                throw new Error(json.error || "Unlock failed.");
            }
            const blob = await response.blob();
            const disposition = response.headers.get("Content-Disposition") || "";
            const match = disposition.match(/filename="?([^"]+)"?/);
            const name = match ? match[1] : "unlocked_document";
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = name;
            a.click();
            URL.revokeObjectURL(url);
            await wait(900);
            hideProcessing();
            showResult("✓ ACCESS GRANTED — original document released.");
        }
    } catch (err) {
        hideProcessing();
        showResult("✕ " + err.message, true);
    }
});

function showDownloadResult(data) {
    result.className = "result";
    result.style.display = "block";
    result.innerHTML = `
        <div style="margin-bottom:10px">✓ DOCUMENT SEALED</div>
        <div style="color:#788291;margin-bottom:10px">${data.filename}</div>
        <a class="download-btn" href="/download/${encodeURIComponent(data.filename)}">
            ↓ DOWNLOAD PROTECTED FILE
        </a>
    `;
}

function showProcessing() {
    processing.classList.add("show");
    const steps = [document.getElementById("s1"), document.getElementById("s2"), document.getElementById("s3")];
    steps.forEach(s => s.classList.remove("done"));
    processTitle.textContent = mode === "protect" ? "SEALING DOCUMENT" : "VERIFYING KEY";
    steps.forEach((s, i) => setTimeout(() => s.classList.add("done"), 350 + i * 400));
}
function hideProcessing(){ processing.classList.remove("show"); }
function wait(ms){ return new Promise(r => setTimeout(r, ms)); }
function showResult(msg, error=false){
    result.textContent = msg;
    result.className = "result" + (error ? " error" : "");
    result.style.display = "block";
}
function hideResult(){ result.style.display = "none"; }
