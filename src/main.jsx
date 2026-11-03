/*
  GİRİŞ NOKTASI — Yazı tiplerini ve stilleri yükler, uygulamayı sayfaya yerleştirir.
*/
import React from 'react';
import ReactDOM from 'react-dom/client';

// Yazı tipleri pakete gömülü gelir; internet olmadan da çalışır.
// Türkçe karakterler (ğ, ş, ı, İ...) "latin-ext" setinde.
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-ext-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-ext-600.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/cormorant-garamond/latin-ext-500-italic.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-ext-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-ext-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-ext-800.css';

import './styles/theme.css';
import './styles/global.css';
import './styles/polaroid.css';

import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
