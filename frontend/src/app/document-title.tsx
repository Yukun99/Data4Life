import { PAGES } from '@/features/navigation/pages';
import { useEffect } from 'react';
import { useLocation } from 'react-router';

const GUEST_LABELS: Record<string, string> = { '/login': 'Login', '/create': 'Create Account' };

const DocumentTitle = () => {
  const { pathname } = useLocation();
  const label = PAGES.find((page) => page.path === pathname)?.label ?? GUEST_LABELS[pathname];

  useEffect(() => {
    document.title = label ? `Library - ${label}` : 'Library';
  }, [label]);

  return null;
};

export default DocumentTitle;
