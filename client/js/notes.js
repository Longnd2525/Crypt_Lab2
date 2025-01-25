class NotesService {
    static async uploadNote(file, expiryTime) {
        try {
            const key = EncryptionService.generateKey();
            const encryptedContent = await EncryptionService.encryptFile(file, key);

            const response = await fetch('http://localhost:3000/api/notes/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    encryptedContent: encryptedContent,
                    encryptedKey: key,
                    expiryTime: expiryTime,
                    filename: file.name,
                    fileSize: file.size
                })
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    static async getNotes() {
        try {
            const response = await fetch('http://localhost:3000/api/notes', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Get notes error:', error);
            return [];
        }
    }

    static async deleteNote(noteId) {
        const response = await fetch(`http://localhost:3000/api/notes/${noteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.ok;
    }
}

async function shareNote(noteId) {
    try {
        const response = await fetch(`http://localhost:3000/api/notes/${noteId}/share`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get share token');
        }

        const data = await response.json();
        const shareUrl = `${window.location.origin}/shared-note.html?token=${data.shareToken}`;
        
        showShareDialog(shareUrl);
    } catch (error) {
        console.error('Share note error:', error);
        alert(`Failed to share note: ${error.message}`);
    }
}

function showShareDialog(shareUrl) {
    const dialog = document.createElement('div');
    dialog.className = 'share-dialog';
    dialog.innerHTML = `
        <h3>Share Note</h3>
        <p>Share URL:</p>
        <input type="text" value="${shareUrl}" readonly>
        <button onclick="navigator.clipboard.writeText('${shareUrl}').then(() => alert('URL copied!'))">
            Copy URL
        </button>
        <button onclick="this.parentElement.remove()">Close</button>
    `;
    document.body.appendChild(dialog);
}

async function deleteNote(noteId) {
    try {
        if (confirm('Are you sure you want to delete this note?')) {
            await NotesService.deleteNote(noteId);
            await loadNotes();
        }
    } catch (error) {
        console.error('Delete note error:', error);
        alert('Failed to delete note');
    }
}


async function handleUploadNote() {
    try {
        const fileInput = document.getElementById('note-file');
        const expiryInput = document.getElementById('expiry-time');

        if (!fileInput.files[0]) {
            alert('Please select a file');
            return;
        }

        if (!expiryInput.value) {
            alert('Please select expiry time');
            return;
        }

        const file = fileInput.files[0];
        const expiryTime = new Date(expiryInput.value).toISOString();
        
        await NotesService.uploadNote(file, expiryTime);
        alert('Note uploaded successfully!');
        await loadNotes();
        
        // Clear inputs
        fileInput.value = '';
        expiryInput.value = '';
    } catch (error) {
        alert('Failed to upload note: ' + error.message);
    }
}

// async function loadNotes() {
//     const notes = await NotesService.getNotes();
//     const notesList = document.getElementById('notes-list');
//     notesList.innerHTML = '';
    
//     notes.forEach(note => {
//         const noteElement = document.createElement('div');
//         noteElement.className = 'note-item';
//         noteElement.innerHTML = `
//             <div>Created: ${new Date(note.created_at).toLocaleString()}</div>
//             <div>Expires: ${new Date(note.expires_at).toLocaleString()}</div>
//             <button onclick="shareNote('${note.id}')">Share</button>
//             <button onclick="deleteNote('${note.id}')">Delete</button>
//         `;
//         notesList.appendChild(noteElement);
//     });
// }

async function loadNotes() {
    const notes = await NotesService.getNotes();
    const notesList = document.getElementById('notes-list');
    notesList.innerHTML = '';
    
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.innerHTML = `
            <div class="note-header">
                <h3>${note.filename || 'Untitled Note'}</h3>
                <span class="note-size">${formatFileSize(note.file_size || 0)}</span>
            </div>
            <div class="note-info">
                <div>Created: ${new Date(note.created_at).toLocaleString()}</div>
                <div>Expires: ${new Date(note.expires_at).toLocaleString()}</div>
                <div>Access Count: ${note.access_count || 0}</div>
            </div>
            <div class="note-actions">
                <button onclick="shareNote('${note.id}')" class="share-btn">Share</button>
                <button onclick="deleteNote('${note.id}')" class="delete-btn">Delete</button>
            </div>
        `;
        notesList.appendChild(noteElement);
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}