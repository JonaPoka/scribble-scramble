import { AVATAR_LIMITS, NAME_MAX_LENGTH, ROOM_CODE_LENGTH, sanitizeDrawing, type Drawing } from '@scribble/shared';
import { useCallback, useState, type CSSProperties, type FormEvent } from 'react';
import { CharacterEditor, randomTemplate } from '../drawing';
import { actions } from '../store';

const PROFILE_KEY = 'scribble-scramble:profile:v2';

interface Profile {
  name: string;
  avatar: Drawing;
}

function loadProfile(): Profile {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? '{}');
    return {
      name: typeof saved.name === 'string' ? saved.name : '',
      avatar: sanitizeDrawing(saved.avatar, AVATAR_LIMITS) ?? randomTemplate().drawing,
    };
  } catch {
    return { name: '', avatar: randomTemplate().drawing };
  }
}

function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Storage can be blocked (private windows) or full; the profile just isn't remembered.
  }
}

export function Home() {
  const [initial] = useState(loadProfile);
  const [name, setName] = useState(initial.name);
  const [avatar, setAvatar] = useState(initial.avatar);
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get('room')?.toUpperCase() ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onAvatarChange = useCallback((drawing: Drawing) => setAvatar(drawing), []);

  async function run(action: (profile: Profile) => ReturnType<typeof actions.createRoom>) {
    if (!name.trim()) {
      setError('Pick a name first.');
      return;
    }
    const profile = { name, avatar };
    setBusy(true);
    setError(null);
    saveProfile(profile);
    const result = await action(profile);
    setBusy(false);
    if (!result.ok) setError(result.error);
    else history.replaceState(null, '', `/?room=${result.data.code}`);
  }

  const create = () => run((p) => actions.createRoom(p));
  const join = (e: FormEvent) => {
    e.preventDefault();
    void run((p) => actions.joinRoom({ ...p, code }));
  };

  return (
    <main className="screen home">
      <header className="home__hero">
        <h1 className="logo">Scribble Scramble</h1>
        <p className="tagline">draw fast. guess faster. a new minigame every few seconds.</p>
      </header>

      <section className="ss-panel ss-panel--tape home__card" style={{ '--tilt': 'var(--tilt-left)' } as CSSProperties}>
        <div className="home__character">
          <h2 className="ss-panel__title">Your character</h2>
          <p className="note">pick one, then draw on it or erase bits</p>
          <CharacterEditor value={initial.avatar} onChange={onAvatarChange} />
        </div>

        <div className="ss-stack home__form">
          <label className="ss-field" htmlFor="name">
            <span className="ss-field__label">Your name</span>
            <input
              className="ss-input"
              id="name"
              value={name}
              maxLength={NAME_MAX_LENGTH}
              placeholder="e.g. Doodlebug"
              autoComplete="nickname"
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <button className="ss-btn ss-btn--go ss-btn--big" type="button" onClick={create} disabled={busy}>
            Create a room
          </button>

          <hr />

          <form className="join-row" onSubmit={join}>
            <label className="ss-field" htmlFor="code">
              <span className="ss-field__label">Or join a friend</span>
              <input
                className={error && code ? 'ss-input ss-input--wrong' : 'ss-input'}
                id="code"
                value={code}
                maxLength={ROOM_CODE_LENGTH}
                placeholder="Room code, e.g. QX7K"
                autoCapitalize="characters"
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </label>
            <button className="ss-btn" type="submit" disabled={busy || code.length < ROOM_CODE_LENGTH}>
              Join
            </button>
          </form>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <a className="home__sketchpad note" href="/sketchpad">
            or just doodle on the sketchpad
          </a>
        </div>
      </section>
    </main>
  );
}
