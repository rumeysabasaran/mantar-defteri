/*
  ADAY LİSTESİ — Tanımanın önerdiği en olası 3 tür, güven yüzdesiyle.
  Kullanıcı birine dokunarak seçer.
*/
import { RARITY } from '../../data/gamification.js';
import { displayName } from '../../services/safety.js';

export default function CandidateList({ candidates, selectedIndex, onSelect }) {
  return (
    <ul className="candidates" role="radiogroup" aria-label="Olası türler">
      {candidates.map((c, i) => {
        const selected = i === selectedIndex;
        return (
          <li key={c.latinName}>
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              className={`paper candidate${selected ? ' is-selected' : ''}`}
              onClick={() => onSelect(i)}
            >
              <span className="candidate__radio" aria-hidden="true" />
              <span className="candidate__body">
                <span className="candidate__name">{displayName(c)}</span>
                {c.turkishName && <span className="candidate__latin">{c.latinName}</span>}
                {c.habitat && <span className="candidate__hint">{c.habitat}</span>}
                <span className="candidate__meta">
                  <span className="candidate__bar" aria-hidden="true">
                    <span style={{ width: `${c.confidence}%` }} />
                  </span>
                  <span className="candidate__pct">%{c.confidence}</span>
                  <span className="chip chip--small">{RARITY[c.rarity]?.label}</span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
