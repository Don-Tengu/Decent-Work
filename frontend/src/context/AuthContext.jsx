import React, { createContext, useCallback, useEffect, useState, useContext } from 'react';
import { useMutation, useQuery, useApolloClient } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { LOGIN, REGISTER, GET_ME } from '../graphql/queries';
import { AUTH_LOGOUT_EVENT } from '../utils/authEvents';

const AuthContext = createContext(null);
const AUTH_ERROR_CODES = new Set(['1001', '1003', '1004']);

const readStoredUser = () => {
  const rawUser = localStorage.getItem('user');
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const persistSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem('token', token);
  }

  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const isAuthenticationError = (error) => {
  if (!error) {
    return false;
  }

  const hasAuthGraphQLError = error.graphQLErrors?.some((graphQLError) => {
    const code = graphQLError.extensions?.errorCode;
    return AUTH_ERROR_CODES.has(String(code));
  }) ?? false;

  return hasAuthGraphQLError || [401, 403].includes(error.networkError?.statusCode);
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => (localStorage.getItem('token') ? readStoredUser() : null));
  const client = useApolloClient();
  const navigate = useNavigate();

  const { data, loading, error } = useQuery(GET_ME, {
    skip: !token,
    fetchPolicy: 'network-only',
  });

  const [loginMutation] = useMutation(LOGIN);
  const [registerMutation] = useMutation(REGISTER);

  const clearAuthState = useCallback(async () => {
    clearSession();
    setToken(null);
    setUser(null);
    await client.clearStore();
  }, [client]);

  const redirectToLogin = useCallback(() => {
    if (window.location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (data?.me) {
      localStorage.setItem('user', JSON.stringify(data.me));
      setUser(data.me);
    }
  }, [data]);

  useEffect(() => {
    if (!token) {
      clearSession();
      setUser(null);
      return;
    }

    if (!loading && isAuthenticationError(error)) {
      void clearAuthState();
      redirectToLogin();
    }
  }, [token, loading, error, clearAuthState, redirectToLogin]);

  useEffect(() => {
    const handleAuthLogout = () => {
      void clearAuthState();
      redirectToLogin();
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);
  }, [clearAuthState, redirectToLogin]);

  const login = async (email, password) => {
    const { data } = await loginMutation({
      variables: { email, password },
    });
    const { token, user } = data.login;
    persistSession({ token, user });
    setUser(user);
    setToken(token);
    return user;
  };

  const register = async (input) => {
    const { data } = await registerMutation({
      variables: { input },
    });
    const { token, user } = data.register;
    persistSession({ token, user });
    setUser(user);
    setToken(token);
    return user;
  };

  const logout = async () => {
    await clearAuthState();
    redirectToLogin();
  };

  const authLoading = Boolean(token) && loading && !user;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading: authLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
