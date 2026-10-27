
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

const DEPARTMENTS = [
  { value: 'home_affairs', label: 'Home Affairs' },
  { value: 'traffic', label: 'Traffic Services' },
  { value: 'finance', label: 'Finance and Tax Services' },
  { value: 'pension', label: 'Pension Services' },
  { value: 'police', label: 'Police Services' },
  { value: 'passport', label: 'Passport Services' },
];

const SERVICES = [
  { value: 'National ID Application', department: 'home_affairs' },
  { value: 'Birth Certificate Application', department: 'home_affairs' },
  { value: 'Identity Registration', department: 'home_affairs' },
  { value: 'Passport Application', department: 'passport' },
  { value: 'Driver Licence Application', department: 'traffic' },
  { value: 'Tax Services', department: 'finance' },
  { value: 'Pension Application', department: 'pension' },
  { value: 'Police Clearance', department: 'police' },
];

export default function NewRequest() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    service_type: '',
    department: '',
    notes: '',
  });

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [referenceNumber, setReferenceNumber] = useState('');

  const availableServices = SERVICES.filter(
    (service) =>
      !form.department || service.department === form.department
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setMsg({ type: '', text: '' });

    if (name === 'department') {
      setForm((previous) => ({
        ...previous,
        department: value,
        service_type: '',
      }));
      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleFiles = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    setMsg({ type: '', text: '' });

    if (files.length + selectedFiles.length > MAX_FILES) {
      setMsg({
        type: 'error',
        text: `You can upload a maximum of ${MAX_FILES} files.`,
      });
      event.target.value = '';
      return;
    }

    for (const file of selectedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setMsg({
          type: 'error',
          text: `${file.name}: only PDF, JPG and PNG files are allowed.`,
        });
        event.target.value = '';
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setMsg({
          type: 'error',
          text: `${file.name}: the file must not exceed 10 MB.`,
        });
        event.target.value = '';
        return;
      }

      const duplicate = files.some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified
      );

      if (duplicate) {
        setMsg({
          type: 'error',
          text: `${file.name} has already been selected.`,
        });
        event.target.value = '';
        return;
      }
    }

    setFiles((previous) => [...previous, ...selectedFiles]);
    event.target.value = '';
  };

  const removeFile = (indexToRemove) => {
    setFiles((previous) =>
      previous.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (!form.department || !form.service_type) {
      setMsg({
        type: 'error',
        text: 'Please select a department and service.',
      });
      return;
    }

    const matchingService = SERVICES.find(
      (service) => service.value === form.service_type
    );

    if (
      !matchingService ||
      matchingService.department !== form.department
    ) {
      setMsg({
        type: 'error',
        text: 'The selected service does not match the department.',
      });
      return;
    }

    if (files.length > MAX_FILES) {
      setMsg({
        type: 'error',
        text: `You can upload a maximum of ${MAX_FILES} files.`,
      });
      return;
    }

    try {
      setLoading(true);
      setMsg({ type: '', text: '' });
      setReferenceNumber('');

      const data = new FormData();

      data.append('service_type', form.service_type);
      data.append('department', form.department);
      data.append('notes', form.notes.trim());

      files.forEach((file) => {
        data.append('documents', file);
      });

      const response = await API.post('/requests', data);

      const reference =
        response.data?.reference_number ||
        response.data?.request?.reference_number ||
        response.data?.data?.reference_number ||
        '';

      if (!reference) {
        setMsg({
          type: 'success',
          text:
            'The server responded to your submission. Check your request history to confirm the reference number.',
        });
        return;
      }

      setReferenceNumber(reference);

      setMsg({
        type: 'success',
        text: 'Your request was submitted successfully.',
      });

      setForm({
        service_type: '',
        department: '',
        notes: '',
      });

      setFiles([]);
    } catch (error) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;

      setMsg({
        type: 'error',
        text:
          serverMessage ||
          (status === 401
            ? 'Your session may have expired. Please log in again.'
            : status === 403
            ? 'You do not have permission to submit this request.'
            : status === 413
            ? 'The uploaded files are too large.'
            : 'Request submission failed. Check your connection and try again.'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="request-page">
      <Sidebar />

      <main className="request-main">
        <header className="request-header">
          <div>
            <p className="eyebrow">MYGOV LESOTHO</p>
            <h1>New Request</h1>
            <p>
              Apply for a government service and track your application
              using its reference number.
            </p>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={() => navigate('/dashboard')}
          >
            Back to dashboard
          </button>
        </header>

        {msg.text && (
          <div
            className={`message ${msg.type}`}
            role={msg.type === 'error' ? 'alert' : 'status'}
          >
            <span>{msg.text}</span>

            {referenceNumber && (
              <div className="reference-result">
                <strong>Application reference</strong>
                <div className="reference-number">
                  {referenceNumber}
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    navigator.clipboard?.writeText(referenceNumber)
                  }
                >
                  Copy reference
                </button>
              </div>
            )}
          </div>
        )}

        <div className="request-layout">
          <section className="request-card">
            <div className="card-heading">
              <div className="heading-icon">📄</div>
              <div>
                <h2>Application details</h2>
                <p>Complete the form below.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="department">Government department *</label>
                <select
                  id="department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a department</option>
                  {DEPARTMENTS.map((department) => (
                    <option
                      key={department.value}
                      value={department.value}
                    >
                      {department.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="service_type">Service required *</label>
                <select
                  id="service_type"
                  name="service_type"
                  value={form.service_type}
                  onChange={handleChange}
                  disabled={!form.department}
                  required
                >
                  <option value="">
                    {form.department
                      ? 'Select a service'
                      : 'Select a department first'}
                  </option>

                  {availableServices.map((service) => (
                    <option key={service.value} value={service.value}>
                      {service.value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">
                  Application information
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={5}
                  maxLength={3000}
                  placeholder="Enter any additional information that may help the officer review your request."
                />
                <small>{form.notes.length}/3000 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="documents">
                  Supporting documents
                </label>

                <div className="upload-box">
                  <div className="upload-icon">⬆</div>
                  <p>Upload supporting files</p>
                  <small>PDF, JPG or PNG · Maximum 10 MB per file</small>
                  <small>Up to 5 files per request</small>

                  <input
                    id="documents"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    multiple
                    onChange={handleFiles}
                    disabled={files.length >= MAX_FILES || loading}
                  />
                </div>

                {files.length > 0 && (
                  <div className="file-list">
                    {files.map((file, index) => (
                      <div
                        className="file-item"
                        key={`${file.name}-${file.lastModified}-${index}`}
                      >
                        <div className="file-details">
                          <span className="file-icon">📎</span>
                          <div>
                            <strong>{file.name}</strong>
                            <small>
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </small>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="remove-file"
                          onClick={() => removeFile(index)}
                          disabled={loading}
                          aria-label={`Remove ${file.name}`}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit request →'}
                </button>
              </div>
            </form>
          </section>

          <aside className="request-card guide-card">
            <div className="card-heading">
              <div className="heading-icon">ℹ️</div>
              <div>
                <h2>Before you submit</h2>
                <p>Helpful reminders</p>
              </div>
            </div>

            <ul className="guide-list">
              <li>
                <span>✓</span>
                Select the correct government department and service.
              </li>
              <li>
                <span>✓</span>
                Make sure your supporting documents are readable.
              </li>
              <li>
                <span>✓</span>
                Provide accurate information in the application notes.
              </li>
              <li>
                <span>✓</span>
                Keep your reference number to track your request.
              </li>
            </ul>

            <div className="privacy-note">
              <strong>🔒 Protect your information</strong>
              <p>
                Submit only documents needed for your application.
                Do not share your password or login credentials.
              </p>
            </div>

            <button
              type="button"
              className="track-button"
              onClick={() => navigate('/track')}
            >
              Track an existing request →
            </button>
          </aside>
        </div>

        <footer className="request-footer">
          <p>
            MyGov Lesotho · Integrated Government Services
          </p>
          <p>For demonstration and service-request management.</p>
        </footer>
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .request-page {
          min-height: 100vh;
          background: #f3f6fa;
          color: #1e293b;
          font-family: Arial, Helvetica, sans-serif;
        }

        .request-main {
          margin-left: 260px;
          padding: 32px;
          min-height: 100vh;
        }

        .request-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .eyebrow {
          color: #13804a;
          font-weight: 800;
          letter-spacing: 1.5px;
          font-size: 12px;
          margin: 0 0 8px;
        }

        .request-header h1 {
          font-size: clamp(26px, 3vw, 36px);
          margin: 0 0 10px;
          color: #102b46;
        }

        .request-header p:not(.eyebrow) {
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }

        .request-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(250px, 0.8fr);
          align-items: start;
          gap: 24px;
        }

        .request-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 26px;
          box-shadow: 0 8px 25px rgba(15, 23, 42, 0.04);
          min-width: 0;
        }

        .card-heading {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 26px;
        }

        .heading-icon {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          background: #e8f7ee;
          border-radius: 12px;
          font-size: 21px;
        }

        .card-heading h2 {
          color: #102b46;
          font-size: 19px;
          margin: 0 0 6px;
        }

        .card-heading p {
          color: #64748b;
          margin: 0;
          font-size: 13px;
        }

        .form-group {
          margin-bottom: 22px;
        }

        .form-group label {
          display: block;
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 9px;
          color: #334155;
        }

        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 13px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          background: #fff;
          color: #1e293b;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #13804a;
          box-shadow: 0 0 0 3px rgba(19, 128, 74, 0.1);
        }

        .form-group select:disabled {
          background: #f1f5f9;
          cursor: not-allowed;
        }

        .form-group textarea {
          resize: vertical;
          line-height: 1.6;
        }

        .form-group > small {
          display: block;
          text-align: right;
          color: #64748b;
          font-size: 12px;
          margin-top: 6px;
        }

        .upload-box {
          border: 2px dashed #cbd5e1;
          background: #f8fafc;
          border-radius: 12px;
          padding: 24px 18px;
          text-align: center;
        }

        .upload-icon {
          font-size: 30px;
          color: #13804a;
          margin-bottom: 10px;
        }

        .upload-box p {
          font-weight: 700;
          margin: 0 0 8px;
        }

        .upload-box small {
          display: block;
          color: #64748b;
          margin: 5px 0;
          font-size: 12px;
        }

        .upload-box input {
          display: block;
          width: 100%;
          max-width: 340px;
          margin: 18px auto 0;
          font-size: 13px;
        }

        .file-list {
          margin-top: 14px;
          display: grid;
          gap: 10px;
        }

        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
        }

        .file-details {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .file-icon {
          font-size: 20px;
        }

        .file-details strong {
          display: block;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .file-details small {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 12px;
        }

        .remove-file {
          color: #b91c1c;
          background: transparent;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 10px;
        }

        .primary-button,
        .secondary-button,
        .track-button {
          min-height: 43px;
          padding: 11px 17px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .primary-button {
          border: 1px solid #13804a;
          background: #13804a;
          color: #fff;
        }

        .primary-button:hover:not(:disabled) {
          background: #0c673a;
        }

        .secondary-button {
          border: 1px solid #cbd5e1;
          color: #334155;
          background: #fff;
        }

        .secondary-button:hover:not(:disabled) {
          background: #f1f5f9;
        }

        .track-button {
          width: 100%;
          margin-top: 22px;
          color: #126b40;
          background: #e8f7ee;
          border: 1px solid #c8ebd5;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          padding: 15px 17px;
          border-radius: 10px;
          margin-bottom: 22px;
          font-size: 14px;
          line-height: 1.5;
        }

        .message.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .message.success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .reference-result {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid currentColor;
        }

        .reference-number {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 1px;
          margin: 8px 0 12px;
          overflow-wrap: anywhere;
        }

        .guide-card {
          position: sticky;
          top: 20px;
        }

        .guide-list {
          padding: 0;
          margin: 0;
          list-style: none;
          display: grid;
          gap: 18px;
        }

        .guide-list li {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          font-size: 13px;
          line-height: 1.6;
          color: #475569;
        }

        .guide-list li span {
          flex: 0 0 22px;
          height: 22px;
          display: grid;
          place-items: center;
          background: #dcfce7;
          color: #15803d;
          border-radius: 50%;
          font-weight: 800;
        }

        .privacy-note {
          margin-top: 26px;
          padding: 16px;
          border-radius: 10px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
        }

        .privacy-note strong {
          color: #075985;
          font-size: 13px;
        }

        .privacy-note p {
          color: #475569;
          font-size: 12px;
          line-height: 1.7;
          margin: 9px 0 0;
        }

        .request-footer {
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
          padding: 28px 0 8px;
        }

        .request-footer p {
          margin: 5px 0;
        }

        @media (max-width: 1100px) {
          .request-main {
            margin-left: 220px;
            padding: 24px;
          }

          .request-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .guide-card {
            position: static;
          }
        }

        @media (max-width: 700px) {
          .request-main {
            margin-left: 0;
            padding: 18px;
          }

          .request-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .request-card {
            padding: 19px;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .form-actions button {
            width: 100%;
          }

          .file-item {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
