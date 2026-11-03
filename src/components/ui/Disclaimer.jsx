/*
  NAZİK NOT — Uygulamanın her yerinde aynı metin kullanılsın diye tek yerde tutulur.
  Bu metni değiştirme; projenin kesin kuralının bir parçası.
*/
import Icon from './Icon.jsx';
import './Disclaimer.css';

export const DISCLAIMER_TEXT =
  'Mantar Defteri bir keşif defteridir, tüketim rehberi değildir. Fotoğrafla tür tespiti kesin değildir.';

export default function Disclaimer({ compact = false }) {
  return (
    <p className={`disclaimer${compact ? ' disclaimer--compact' : ''}`}>
      <Icon name="info" size={compact ? 16 : 18} />
      <span>{DISCLAIMER_TEXT}</span>
    </p>
  );
}
