/*
  ONAY PENCERESİ — "Silinsin mi?" gibi sorular.
  Telefonda telefonun kendi penceresi, web önizlemesinde tarayıcınınki açılır.
  Kullanım: if (await confirmAsync('Başlık', 'Açıklama')) { ... }
*/
import { Alert, Platform } from 'react-native';

export function confirmAsync(title, message, okLabel = 'Sil') {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(false) },
        { text: okLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    )
  );
}
