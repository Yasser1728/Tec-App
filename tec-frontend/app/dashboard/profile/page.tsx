'use client';

import { useState } from 'react';
import { usePiAuth } from '@/hooks/usePiAuth';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { user } = usePiAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.piUsername || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // TODO: Save to backend
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // TODO: Call delete API
      console.log('Delete account');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.subtitle}>Manage your account information</p>
      </header>

      <section className={`${styles.section} fade-up`}>
        <div className={styles.profileCard}>
          <div className={styles.avatar}>
            <span className={styles.avatarText}>{user?.piUsername?.[0]?.toUpperCase()}</span>
          </div>
          <div className={styles.profileInfo}>
            <h2 className={styles.profileName}>@{user?.piUsername}</h2>
            <p className={styles.profileId}>Pi ID: {user?.piId?.substring(0, 16)}...</p>
            <div className={styles.badges}>
              <span className={styles.roleBadge}>{user?.role}</span>
              <span className={styles.planBadge}>{user?.subscriptionPlan || 'Free'}</span>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} fade-up-1`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Account Information</h2>
          {!isEditing && (
            <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
              Edit
            </button>
          )}
        </div>

        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              className={styles.input}
              value={formData.username}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Pi ID</label>
            <input
              type="text"
              className={styles.input}
              value={user?.piId || 'N/A'}
              disabled
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Member Since</label>
            <input
              type="text"
              className={styles.input}
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              disabled
            />
          </div>

          {isEditing && (
            <div className={styles.formActions}>
              <button className={styles.saveBtn} onClick={handleSave}>
                Save Changes
              </button>
              <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>

      <section className={`${styles.section} fade-up-2`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Connected Apps</h2>
        </div>
        <div className={styles.appsList}>
          <div className={styles.appItem}>
            <div className={styles.appIcon}>🔷</div>
            <div className={styles.appInfo}>
              <div className={styles.appName}>TEC Platform</div>
              <div className={styles.appStatus}>Connected</div>
            </div>
            <div className={styles.appDate}>Feb 16, 2026</div>
          </div>
        </div>
      </section>

      <section className={`${styles.dangerZone} fade-up-3`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Danger Zone</h2>
        </div>
        <div className={styles.dangerContent}>
          <div>
            <h3 className={styles.dangerTitle}>Delete Account</h3>
            <p className={styles.dangerDescription}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <button className={styles.deleteBtn} onClick={handleDelete}>
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
}
