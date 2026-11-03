/*
  ROTALAR — Hangi adreste hangi ekranın açılacağı.
  Hash modu (#/kitap gibi) kullanılıyor; böylece uygulama her sunucuda
  ek ayar gerektirmeden çalışır.
*/
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import BookScreen from './screens/BookScreen.jsx';
import ScanScreen from './screens/ScanScreen.jsx';
import TripsScreen from './screens/TripsScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';
import PendingScreen from './screens/PendingScreen.jsx';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomeScreen />} />
          {/* :pageKey isteğe bağlı → /kitap ve /kitap/<tür> aynı ekranı açar */}
          <Route path="kitap/:pageKey?" element={<BookScreen />} />
          <Route path="tara" element={<ScanScreen />} />
          <Route path="geziler" element={<TripsScreen />} />
          <Route path="profil" element={<ProfileScreen />} />
          <Route path="bekleyenler" element={<PendingScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
