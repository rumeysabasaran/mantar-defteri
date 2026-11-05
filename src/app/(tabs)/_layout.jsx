/*
  ALT MENÜLÜ EKRANLAR
  Sekmeler arasında geçerken ekranlar hafızada kalır (ör. kitap kaldığın sayfada durur).
*/
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import TabBar from '../../components/layout/TabBar';
import Backdrop from '../../components/layout/Backdrop';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Backdrop />
      <Tabs
        tabBar={() => <TabBar />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' }, animation: 'fade' }}
      >
        <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} />
        <Tabs.Screen name="kitap" options={{ title: 'Kitap' }} />
        <Tabs.Screen name="tara" options={{ title: 'Mantar tara' }} />
        <Tabs.Screen name="geziler" options={{ title: 'Geziler' }} />
        <Tabs.Screen name="profil" options={{ title: 'Profil' }} />
      </Tabs>
    </View>
  );
}
