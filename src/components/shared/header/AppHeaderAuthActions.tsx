import Button from '@/components/atoms/Button';
import LinkButton from '@/components/atoms/LinkButton';

import type { AuthEntryMode } from './appHeader.types';

type AppHeaderAuthActionsProps = {
  hasToken: boolean;
  authEntryMode: AuthEntryMode;
  onRequestLogin?: () => void;
  onRequestRegister?: () => void;
};

export default function AppHeaderAuthActions({
  hasToken,
  authEntryMode,
  onRequestLogin,
  onRequestRegister,
}: AppHeaderAuthActionsProps) {
  if (hasToken) {
    return null;
  }

  if (authEntryMode === 'route') {
    return (
      <>
        <LinkButton
          href="/login"
          variant="ghost"
          size="sm"
          uppercase
          className="px-2.5 text-[10px]"
        >
          Login
        </LinkButton>
        <LinkButton
          href="/register"
          variant="ghost"
          size="sm"
          uppercase
          className="px-2.5 text-[10px]"
        >
          Register
        </LinkButton>
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        uppercase
        className="px-2.5 text-[10px]"
        onClick={onRequestLogin}
      >
        Login
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        uppercase
        className="px-2.5 text-[10px]"
        onClick={onRequestRegister}
      >
        Register
      </Button>
    </>
  );
}
