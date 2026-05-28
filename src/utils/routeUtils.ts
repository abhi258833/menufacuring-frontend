export const isPublicRoute = (pathname: string): boolean => {
  const publicPaths = [
    /^\/$/,                   // home page
    /^\/search\b/,
    /^\/adminSearch\b/,       // search pages
    /^\/advanceSearch\b/,     // advance search
    /^\/browse\b/,
    /^\/items\//,             // book details page
    /^\/about\b/,
    /^\/contact\b/,
    /^\/login\b/,
    /^\/signUp\b/,
    /^\/forgotPassword\b/
  ];
  return publicPaths.some((regex) => regex.test(pathname));
};

export const isProtectedRoute = (pathname: string): boolean => {
  return !isPublicRoute(pathname);
};
