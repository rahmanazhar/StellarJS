import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export interface RouteConfig {
  path: string;
  element: React.ReactElement;
  children?: RouteConfig[];
  index?: boolean;
  protected?: boolean;
  redirect?: string;
}

export interface StellarRouterProps {
  routes: RouteConfig[];
  basePath?: string;
  fallback?: React.ReactElement;
  authGuard?: () => boolean;
  onNavigate?: (path: string) => void;
}

/**
 * StellarRouter - Enhanced routing component with authentication and nested routes
 *
 * @example
 * ```typescript
 * const routes = [
 *   {
 *     path: '/',
 *     element: <Home />,
 *   },
 *   {
 *     path: '/dashboard',
 *     element: <Dashboard />,
 *     protected: true,
 *     children: [
 *       { path: 'profile', element: <Profile /> },
 *       { path: 'settings', element: <Settings /> },
 *     ],
 *   },
 * ];
 *
 * <StellarRouter
 *   routes={routes}
 *   authGuard={() => isAuthenticated}
 *   fallback={<NotFound />}
 * />
 * ```
 */
export const StellarRouter: React.FC<StellarRouterProps> = ({
  routes,
  basePath = '',
  fallback = <div>404 - Page Not Found</div>,
  authGuard,
  onNavigate,
}) => {
  const renderRoute = (route: RouteConfig) => {
    // Handle redirects
    if (route.redirect) {
      return <Navigate to={route.redirect} replace />;
    }

    // Handle protected routes
    if (route.protected && authGuard && !authGuard()) {
      return <Navigate to="/login" replace />;
    }

    // Call navigation callback
    if (onNavigate) {
      onNavigate(route.path);
    }

    return route.element;
  };

  const buildRoutes = (routeConfigs: RouteConfig[], parentPath = '') => {
    return routeConfigs.map((route, index) => {
      const fullPath = `${parentPath}${route.path}`;
      const element = renderRoute(route);

      if (route.children && route.children.length > 0) {
        return (
          <Route key={fullPath || index} path={route.path} element={element}>
            {buildRoutes(route.children, '')}
          </Route>
        );
      }

      return (
        <Route key={fullPath || index} path={route.path} element={element} index={route.index} />
      );
    });
  };

  return (
    <BrowserRouter basename={basePath}>
      <Routes>
        {buildRoutes(routes)}
        <Route path="*" element={fallback} />
      </Routes>
    </BrowserRouter>
  );
};

/**
 * Create route configurations with type safety
 */
export function createRoutes(routes: RouteConfig[]): RouteConfig[] {
  return routes;
}

/**
 * Protected route wrapper component
 */
export interface ProtectedRouteProps {
  children: React.ReactElement;
  isAllowed: boolean;
  redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  isAllowed,
  redirectPath = '/login',
}) => {
  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

/**
 * Route guard hook for checking permissions
 */
export function useRouteGuard(condition: boolean, redirectPath = '/login'): boolean {
  React.useEffect(() => {
    if (!condition) {
      window.location.href = redirectPath;
    }
  }, [condition, redirectPath]);

  return condition;
}

/**
 * Navigation hook with type-safe paths
 */
export function useTypedNavigation<T extends Record<string, string>>() {
  const navigate = (path: keyof T, params?: Record<string, string>) => {
    let finalPath = path as string;

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        finalPath = finalPath.replace(`:${key}`, value);
      });
    }

    window.location.href = finalPath;
  };

  return { navigate };
}
