/*
  SAHA NOTU FORMU — Kitabı "senin" yapan kısım. Hepsi isteğe bağlı.
  Tarih, yer, hava, kimlerle olduğun ve serbest not.

  initial: düzenleme için mevcut buluş ({ foundAt, notes }). Yoksa boş form açılır.
*/
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import Paper from '../ui/Paper';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import DateField from './DateField';
import { type } from '../ui/Typography';
import { WEATHER } from '../../data/fieldNotes';
import { colors, fonts, radius } from '../../theme';

/** Seçilen günü korur; bugün seçildiyse şimdiki saati kullanır */
function normalizeDay(time, original) {
  const picked = new Date(time);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (original && sameDay(picked, new Date(original))) return original; // gün değişmediyse saati koru
  if (sameDay(picked, new Date())) return Date.now();
  picked.setHours(12, 0, 0, 0);
  return picked.getTime();
}

function Label({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}

export default function FieldNotesForm({ initial, onSubmit, onBack, submitLabel = 'Deftere kaydet', busy = false, bare = false }) {
  const n = initial?.notes ?? {};
  const initialCoords = n.location?.lat != null ? { lat: n.location.lat, lng: n.location.lng, accuracy: n.location.accuracy } : null;

  const [foundAt, setFoundAt] = useState(initial?.foundAt ?? Date.now());
  const [placeName, setPlaceName] = useState(n.location?.placeName ?? '');
  const [coords, setCoords] = useState(initialCoords); // { lat, lng, accuracy }
  const [geoState, setGeoState] = useState('idle'); // idle | loading | denied | error
  const [weather, setWeather] = useState(n.weather ?? '');
  const [companions, setCompanions] = useState(n.companions ?? '');
  const [note, setNote] = useState(n.note ?? '');

  async function addLocation() {
    setGeoState('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGeoState('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({
        lat: Number(pos.coords.latitude.toFixed(5)),
        lng: Number(pos.coords.longitude.toFixed(5)),
        accuracy: Math.round(pos.coords.accuracy ?? 0),
      });
      setGeoState('idle');
    } catch (err) {
      console.warn('[konum]', err);
      setGeoState('error');
    }
  }

  function submit() {
    onSubmit({
      foundAt,
      notes: {
        weather,
        companions: companions.trim(),
        note: note.trim(),
        location: placeName.trim() || coords ? { placeName: placeName.trim(), ...(coords ?? {}) } : null,
      },
    });
  }

  const Wrapper = bare ? View : Paper;

  return (
    <Wrapper style={styles.form}>
      {!initial && (
        <View>
          <Text style={type.h3}>Saha notu</Text>
          <Text style={[type.small, { marginTop: 2 }]}>Hepsi isteğe bağlı. Sonra kitaptan da düzenleyebilirsin.</Text>
        </View>
      )}

      <View style={styles.field}>
        <Label>Tarih</Label>
        <DateField value={foundAt} onChange={(t) => setFoundAt(normalizeDay(t, initial?.foundAt))} />
      </View>

      <View style={styles.field}>
        <Label>Yer</Label>
        <TextInput
          style={styles.input}
          placeholder="ör. Belgrad Ormanı, göl kıyısı"
          placeholderTextColor={colors.inkFaint}
          value={placeName}
          onChangeText={setPlaceName}
          returnKeyType="done"
        />
        <Pressable onPress={addLocation} disabled={geoState === 'loading'} style={styles.linkBtn} accessibilityRole="button">
          <Icon name="pin" size={16} color={colors.forest} />
          <Text style={styles.linkText}>
            {coords ? `Konum eklendi (±${coords.accuracy} m)` : geoState === 'loading' ? 'Konum alınıyor…' : 'Konumumu ekle'}
          </Text>
        </Pressable>
        {geoState === 'denied' && <Text style={styles.error}>Konum izni verilmedi. Telefon ayarlarından izin verebilirsin.</Text>}
        {geoState === 'error' && <Text style={styles.error}>Konum alınamadı. Konum servisi açık mı?</Text>}
      </View>

      <View style={styles.field}>
        <Label>Hava</Label>
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Hava durumu">
          {WEATHER.map((w) => {
            const on = weather === w.key;
            return (
              <Pressable
                key={w.key}
                onPress={() => setWeather(on ? '' : w.key)}
                style={[styles.pick, on && styles.pickOn]}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
              >
                <Text style={[styles.pickText, on && styles.pickTextOn]}>{w.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Label>Kimlerle?</Label>
        <TextInput
          style={styles.input}
          placeholder="ör. Ayşe ve köpeğimiz Pamuk"
          placeholderTextColor={colors.inkFaint}
          value={companions}
          onChangeText={setCompanions}
          returnKeyType="done"
        />
      </View>

      <View style={styles.field}>
        <Label>Not</Label>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Nerede, nasıl gördün? Aklında kalan küçük bir ayrıntı…"
          placeholderTextColor={colors.inkFaint}
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.actions}>
        <Button block title={busy ? 'Kaydediliyor…' : submitLabel} onPress={submit} disabled={busy} />
        {onBack && <Button variant="text" title="← Seçime dön" onPress={onBack} disabled={busy} />}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontFamily: fonts.sansHeavy, fontSize: 13, letterSpacing: 0.5, color: colors.earth },
  input: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    borderRadius: radius.sm,
    backgroundColor: colors.paperWhite,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
  },
  textarea: { minHeight: 92 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6 },
  linkText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.forest },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.earth },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pick: {
    minHeight: 38,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    backgroundColor: colors.paperWhite,
  },
  pickOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  pickText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.inkSoft },
  pickTextOn: { color: colors.cream },
  actions: { gap: 6, marginTop: 4 },
});
