/*
  UYGULAMA İSKELETİ — Her ekranın etrafındaki sabit çerçeve:
  ortada ekranın kendisi, altta menü ve ortada büyük kamera butonu.
*/
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';

export default function AppShell() {
  return (
    <>
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}
