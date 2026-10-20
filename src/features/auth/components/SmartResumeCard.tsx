import React from 'react';
import type { SmartResumeCardProps } from '../types';
import styles from './SmartResumeCard.module.css';

export const SmartResumeCard: React.FC<SmartResumeCardProps> = ({
  name,
  email,
  onContinue,
  onChangeAccount,
  isLoading = false,
}) => {
  const getInitials = (fullName: string): string => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div className={styles.resumeCard} data-testid="smart-resume-card">
      <div className={styles.profileRow}>
        <div className={styles.avatar} aria-hidden="true">
          {initials}
        </div>
        <div className={styles.info}>
          <h3 className={styles.title}>Continuar como {name}</h3>
          <p className={styles.email}>{email}</p>
        </div>
      </div>

      <button
        type="button"
        className={styles.continueBtn}
        onClick={onContinue}
        disabled={isLoading}
        data-testid="smart-resume-continue-btn"
      >
        {isLoading ? 'Iniciando sesión...' : 'Continuar'}
      </button>

      <button
        type="button"
        className={styles.changeAccountBtn}
        onClick={onChangeAccount}
        data-testid="smart-resume-change-account-btn"
      >
        ¿No eres tú? Ingresar con otra cuenta
      </button>
    </div>
  );
};
