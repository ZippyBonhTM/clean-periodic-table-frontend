import Button from '@/components/atoms/Button';
import LinkButton from '@/components/atoms/LinkButton';
import type { AppHeaderTextCatalog } from '@/components/shared/header/appHeaderText';

import type { AuthEntryMode } from './appHeader.types';

type AppHeaderAuthActionsProps = {
  hasToken: boolean;
  authEntryMode: AuthEntryMode;
  documentNavigation?: boolean;
  loginHref: string;
  registerHref: string;
  text: AppHeaderTextCatalog['auth'];
  onRequestLogin?: () => void;
  onRequestRegister?: () => void;
};

export default function AppHeaderAuthActions({
  hasToken,
  authEntryMode,
  documentNavigation = false,
  loginHref,
  registerHref,
  text,
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
          href={loginHref}
          variant="ghost"
          size="sm"
          uppercase
          documentNavigation={documentNavigation}
          className="px-2.5 text-[10px]"
        >
          {text.login}
        </LinkButton>
        <LinkButton
          href={registerHref}
          variant="ghost"
          size="sm"
          uppercase
          documentNavigation={documentNavigation}
          className="px-2.5 text-[10px]"
        >
          {text.register}
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
        {text.login}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        uppercase
        className="px-2.5 text-[10px]"
        onClick={onRequestRegister}
      >
        {text.register}
      </Button>
    </>
  );
}
