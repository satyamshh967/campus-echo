import React, { useState } from 'react';
import api from '../api/client';

const REPORT_REASONS = [
  'Harassment',
  'Hate Speech',
  'Spam',
  'Inappropriate Content',
  'Misinformation',
  'Other'
];

export default function ReportModal({ isOpen, onClose, letterId, onReportSuccess }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post(`/letters/${letterId}/report`, {
        reason,
        details
      });
      setSuccess(res.data.message || 'Report submitted successfully.');
      if (onReportSuccess) {
        onReportSuccess(res.data);
      }
      setTimeout(() => {
        onClose();
        setSuccess('');
        setDetails('');
      }, 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-card report-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Report Shoutout</h3>
          <p className="modal-subtitle">Help keep our campus community safe and respectful.</p>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        {!success && (
          <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: '14px' }}>
            <div className="form-group">
              <label htmlFor="report-reason">Reason for reporting</label>
              <select
                id="report-reason"
                className="form-input form-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="report-details">Additional Details (Optional)</label>
              <textarea
                id="report-details"
                className="form-input form-textarea"
                rows={3}
                placeholder="Describe why this post violates community guidelines..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                type="submit"
                className="btn-primary btn-danger-action"
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
