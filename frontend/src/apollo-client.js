import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { dispatchAuthLogout } from './utils/authEvents';

const httpLink = createHttpLink({
  uri: 'http://localhost:8080/graphql',
});

const publicOperations = new Set(['Login', 'Register']);
const authErrorCodes = new Set(['1001', '1003', '1004']);

const clearStoredSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const isAuthError = (error) => authErrorCodes.has(String(error?.extensions?.errorCode));

const errorLink = onError(({ graphQLErrors, networkError }) => {
  const networkErrors = networkError?.result?.errors ?? [];
  const hasAuthError = graphQLErrors?.some(isAuthError) || networkErrors.some(isAuthError);
  const hasAuthStatus = [401, 403].includes(networkError?.statusCode);

  if (hasAuthError || hasAuthStatus) {
    clearStoredSession();
    dispatchAuthLogout();
  }
});

const authLink = setContext((operation, { headers }) => {
  if (publicOperations.has(operation.operationName)) {
    const { authorization, ...publicHeaders } = headers ?? {};

    return {
      headers: publicHeaders,
    };
  }

  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
