'use client';

import { memo, useEffect, useState } from 'react';

import FloatingModal from '@/components/molecules/FloatingModal';
import useAuthText from '@/components/organisms/auth/useAuthText';
import LoginForm from '@/components/organisms/login/LoginForm';
import RegisterForm from '@/components/organisms/register/RegisterForm';

type AuthModalMode = 'login' | 'register';

type AuthModalProps = {
  isOpen: boolean;
  mode: AuthModalMode;
  onClose: () => void;
  onSuccess: (token: string) => void;
};

function AuthModal({ isOpen, mode, onClose, onSuccess }: AuthModalProps) {
  const text = useAuthText();
  const [currentMode, setCurrentMode] = useState<AuthModalMode>(mode);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  return (
    <FloatingModal
      isOpen={isOpen}
      title={currentMode === 'login' ? text.modal.loginTitle : text.modal.registerTitle}
      onClose={onClose}
      panelClassName="max-w-lg self-start mt-1 sm:mt-3"
      bodyClassName="auth-modal-body pr-1 pb-1"
      closeLabel={text.common.close}
    >
      {currentMode === 'login' ? (
        <LoginForm
          onSuccess={onSuccess}
          mode="modal"
          onSwitchToRegister={() => setCurrentMode('register')}
        />
      ) : (
        <RegisterForm
          onSuccess={onSuccess}
          mode="modal"
          onSwitchToLogin={() => setCurrentMode('login')}
        />
      )}
    </FloatingModal>
  );
}

export default memo(AuthModal);
export type { AuthModalMode };
