import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { apolloClient } from './apollo-client';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute';
import { privateRoutes, publicRoutes } from './routes/routes';

function App() {
  return (
    <ChakraProvider value={defaultSystem}>
      <ApolloProvider client={apolloClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {publicRoutes.map(({ path, element: Element }) => (
                <Route key={path} path={path} element={<Element />} />
              ))}
              {privateRoutes.map(({ path, element: Element }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <PrivateRoute>
                      <Element />
                    </PrivateRoute>
                  }
                />
              ))}
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ApolloProvider>
    </ChakraProvider>
  );
}

export default App;
