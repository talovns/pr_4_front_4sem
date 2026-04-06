import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import UsersPage from './pages/UsersPage';
import { getAccessToken, isGuestMode } from './auth/storage';

function RequireAuth({ children }) {
  const location = useLocation();
  const token = getAccessToken();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function RequireAuthOrGuest({ children }) {
  const location = useLocation();
  const token = getAccessToken();
  const isGuest = isGuestMode();
  if (!token && !isGuest) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/products"
          element={
            <RequireAuthOrGuest>
              <ProductsPage />
            </RequireAuthOrGuest>
          }
        />
        <Route
          path="/products/:id"
          element={
            <RequireAuthOrGuest>
              <ProductDetailsPage />
            </RequireAuthOrGuest>
          }
        />

        <Route
          path="/users"
          element={
            <RequireAuth>
              <UsersPage />
            </RequireAuth>
          }
        />

        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;