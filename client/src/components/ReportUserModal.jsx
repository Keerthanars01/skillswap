import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';

const ReportUserModal = ({ reportedUser, session, onClose }) => {
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview local
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target.result);
            reader.readAsDataURL(file);
        } else {
            setPreview('video_or_file');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) {
            return toast.error('Please describe the issue');
        }

        const formData = new FormData();
        formData.append('reportedUserId', reportedUser._id);
        if (session) {
            formData.append('sessionId', session._id);
        }
        formData.append('description', description);

        const file = fileRef.current?.files[0];
        if (file) {
            formData.append('evidence', file);
        }

        setLoading(true);
        try {
            await api.post('/api/reports', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Report submitted successfully. We will review it shortly.');
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
                <h2 style={{ fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center', color: 'var(--color-danger)' }}>Report User</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                    You are reporting <strong>{reportedUser.name}</strong>. Please provide details of the issue.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="input-label">Describe the issue (Required)</label>
                        <textarea
                            className="input-field"
                            placeholder="Please describe exactly what happened..."
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <label className="input-label" style={{ marginBottom: '0.5rem' }}>Evidence (Optional Image/Video)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => fileRef.current?.click()}
                                disabled={loading}
                                style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                            >
                                📎 Select File
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*,video/mp4"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            {preview === 'video_or_file' ? (
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-accent)' }}>File selected</span>
                            ) : preview ? (
                                <img src={preview} alt="Evidence preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px' }} />
                            ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No file selected</span>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button type="submit" className="btn-danger" disabled={loading || !description.trim()} style={{ flex: 1, justifyContent: 'center' }}>
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportUserModal;
