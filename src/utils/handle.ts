const HANDLE_REGEX = /\/handle\/([^/?#]+\/[^/?#]+)/i;

export const extractHandleFromPath = (pathname: string): string => {
  const handleMatch = pathname.match(HANDLE_REGEX);
  return handleMatch?.[1] ?? '';
};

export const parseHandleFromUri = (uri?: string | null): string => {
  if (!uri) {
    return '';
  }

  const handleMatch = uri.match(HANDLE_REGEX);
  return handleMatch?.[1] ?? '';
};
