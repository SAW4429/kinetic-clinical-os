// ============================================================
//  AuthGuard — 앱 로드 시 스토리지에서 Auth 상태 복원
//  새로고침 시 깜빡임 없이 이전 세션 유지 보장
// ============================================================
import { useEffect, useState, type ReactNode } from 'react';
import { installGlobalStorageErrorHandler } from '../../lib/storageManager';
import { useUserAuth } from '../../context/UserAuthContext';

interface AuthGuardProps {
  children:   ReactNode;
  onRestored: (isLoggedIn: boolean) => void;
}

export function AuthGuard({ children, onRestored }: AuthGuardProps) {
  const { isLoggedIn } = useUserAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 전역 localStorage 에러 핸들러 설치
    installGlobalStorageErrorHandler();

    // 세션 복원은 UserAuthContext useState 초기화 시 이미 완료됨.
    // 여기서는 복원 결과를 부모에 알리고 ready 상태를 설정.
    onRestored(isLoggedIn);
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    // 복원 중 스플래시
    return (
      <div style={{
        minHeight: '100vh',
        background: '#020617',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        color: '#94a3b8',
      }}>
        <div style={{ fontSize: '32px' }}>⚗</div>
        <p style={{ fontSize: '14px', fontWeight: 600 }}>Kinetic Clinical OS</p>
        <div style={{
          width: '120px', height: '3px',
          background: '#1e293b',
          borderRadius: '99px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: '#38bdf8',
            borderRadius: '99px',
            animation: 'progress 0.6s ease-in-out forwards',
            width: '100%',
          }}/>
        </div>
        <style>{`
          @keyframes progress {
            from { transform: translateX(-100%); }
            to   { transform: translateX(0); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
