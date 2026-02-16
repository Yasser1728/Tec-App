'use client';

import { useState } from 'react';
import styles from './kyc.module.css';

type KycStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export default function KycPage() {
  const [kycStatus, setKycStatus] = useState<KycStatus>('NONE');
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    country: '',
    documentType: 'passport',
    documentId: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Integrate with backend API
    setTimeout(() => {
      setKycStatus('PENDING');
      setLoading(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getStatusBadge = () => {
    const statusConfig = {
      NONE: { label: 'Not Started', className: styles.statusNone },
      PENDING: { label: 'Pending Review', className: styles.statusPending },
      VERIFIED: { label: 'Verified', className: styles.statusVerified },
      REJECTED: { label: 'Rejected', className: styles.statusRejected },
    };
    const config = statusConfig[kycStatus];
    return (
      <span className={`${styles.statusBadge} ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>KYC Verification</h1>
          <p className={styles.subtitle}>Complete your identity verification</p>
        </div>
        {getStatusBadge()}
      </header>

      <div className={`${styles.stepper} fade-up`}>
        <div className={`${styles.step} ${kycStatus !== 'NONE' ? styles.stepComplete : styles.stepActive}`}>
          <div className={styles.stepNumber}>1</div>
          <div className={styles.stepLabel}>Submit Documents</div>
        </div>
        <div className={styles.stepLine}></div>
        <div className={`${styles.step} ${kycStatus === 'VERIFIED' ? styles.stepComplete : kycStatus === 'PENDING' ? styles.stepActive : ''}`}>
          <div className={styles.stepNumber}>2</div>
          <div className={styles.stepLabel}>Review</div>
        </div>
        <div className={styles.stepLine}></div>
        <div className={`${styles.step} ${kycStatus === 'VERIFIED' ? styles.stepComplete : ''}`}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.stepLabel}>Verified</div>
        </div>
      </div>

      {kycStatus === 'NONE' && (
        <form onSubmit={handleSubmit} className={`${styles.form} fade-up-1`}>
          <div className={styles.formSection}>
            <h2 className={styles.formTitle}>Personal Information</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name</label>
              <input
                type="text"
                name="fullName"
                className={styles.input}
                value={formData.fullName}
                onChange={handleChange}
                placeholder="As shown on your ID"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                className={styles.input}
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Country</label>
              <input
                type="text"
                name="country"
                className={styles.input}
                value={formData.country}
                onChange={handleChange}
                placeholder="Country code (e.g., US)"
                maxLength={2}
                required
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.formTitle}>Document Information</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Document Type</label>
              <select
                name="documentType"
                className={styles.select}
                value={formData.documentType}
                onChange={handleChange}
                required
              >
                <option value="passport">Passport</option>
                <option value="national_id">National ID</option>
                <option value="driver_license">Driver's License</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Document ID Number</label>
              <input
                type="text"
                name="documentId"
                className={styles.input}
                value={formData.documentId}
                onChange={handleChange}
                placeholder="Enter document number"
                required
              />
            </div>

            <div className={styles.uploadBox}>
              <div className={styles.uploadIcon}>📄</div>
              <p className={styles.uploadText}>Upload Document Photo</p>
              <p className={styles.uploadHint}>Drag and drop or click to browse</p>
              <input type="file" className={styles.fileInput} accept="image/*" />
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </form>
      )}

      {kycStatus === 'PENDING' && (
        <div className={`${styles.statusCard} fade-up-1`}>
          <div className={styles.statusIcon}>⏳</div>
          <h3 className={styles.statusTitle}>Verification in Progress</h3>
          <p className={styles.statusText}>
            Your documents are being reviewed. This usually takes 1-3 business days.
          </p>
        </div>
      )}

      {kycStatus === 'VERIFIED' && (
        <div className={`${styles.statusCard} ${styles.statusCardSuccess} fade-up-1`}>
          <div className={styles.statusIcon}>✓</div>
          <h3 className={styles.statusTitle}>Verification Complete</h3>
          <p className={styles.statusText}>
            Your identity has been successfully verified. You can now make payments over 1000 π.
          </p>
        </div>
      )}

      {kycStatus === 'REJECTED' && (
        <div className={`${styles.statusCard} ${styles.statusCardError} fade-up-1`}>
          <div className={styles.statusIcon}>✕</div>
          <h3 className={styles.statusTitle}>Verification Failed</h3>
          <p className={styles.statusText}>
            Your verification was rejected. Please review the feedback and try again.
          </p>
          <button className={styles.retryBtn} onClick={() => setKycStatus('NONE')}>
            Resubmit Documents
          </button>
        </div>
      )}

      <div className={`${styles.infoBox} fade-up-2`}>
        <h3 className={styles.infoTitle}>Why KYC?</h3>
        <p className={styles.infoText}>
          KYC (Know Your Customer) verification is required for payments over 1000 π to comply
          with Pi Network regulations and prevent fraud. Your information is encrypted and securely stored.
        </p>
      </div>
    </div>
  );
}
