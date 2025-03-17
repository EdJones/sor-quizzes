import { useAuthStore } from '../stores/authStore';

export async function requireAuth(to, from, next) {
  const authStore = useAuthStore();

  try {
    // Always wait for auth state to be initialized
    await authStore.init();

    // Log auth state for debugging
    console.log('Auth guard state:', {
      loading: authStore.loading,
      isAuthenticated: authStore.isAuthenticated,
      canEdit: authStore.canEdit,
      user: authStore.user?.email,
      targetPath: to.fullPath
    });

    // Check if user can edit (non-anonymous user)
    if (!authStore.canEdit) {
      console.log('Auth guard: User cannot edit, redirecting to login');
      // Redirect to login page with return url
      return next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    }

    // User can edit, proceed
    console.log('Auth guard: User can edit, proceeding to:', to.fullPath);
    return next();
  } catch (error) {
    console.error('Auth guard error:', error);
    // On error, redirect to login
    return next({
      path: '/login',
      query: { redirect: to.fullPath }
    });
  }
}

export async function requireAdmin(to, from, next) {
  const authStore = useAuthStore();

  try {
    // Always wait for auth state to be initialized
    await authStore.init();

    // Log auth state for debugging
    console.log('Admin guard state:', {
      loading: authStore.loading,
      isAuthenticated: authStore.isAuthenticated,
      isAdmin: authStore.isAdmin,
      user: authStore.user?.email,
      targetPath: to.fullPath
    });

    // Check if user is admin
    if (!authStore.isAdmin) {
      console.log('Admin guard: User is not admin, redirecting to home');
      // Redirect to home page
      return next({ path: '/' });
    }

    // User is admin, proceed
    console.log('Admin guard: User is admin, proceeding to:', to.fullPath);
    return next();
  } catch (error) {
    console.error('Admin guard error:', error);
    // On error, redirect to home
    return next({ path: '/' });
  }
}
