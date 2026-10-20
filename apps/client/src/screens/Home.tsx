import { AVATAR_FACES, NAME_MAX_LENGTH, ROOM_CODE_LENGTH, type AvatarFace } from '@scribble/shared';
import { useState, type CSSProperties, type FormEvent } from 'react';
import { Avatar } from '../components/ui';
import { actions } from '../store';

const PROFILE_KEY = 'scribble-scramble:profile';

function loadProfile(): { name: string; face: AvatarFace } {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? '{}');
    return {
      name: typeof saved.name === 'string' ? saved.name : '',
      face: AVATAR_FACES.includes(saved.face) ? saved.face : 'smile',
    };
  } catch {
    return { name: '', face: 'smile' };
  }
}

function saveProfile(profile: { name: string; face: AvatarFace }): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Storage can be blocked (private windows); the profile just isn't remembered.
  }
}

export function Home() {
  const [profile, setProfile] = useState(loadProfile);
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get('room')?.toUpperCase() ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => ReturnType<typeof actions.createRoom>) {
    if (!profile.name.trim()) {
      setError('Pick a name first.');
      return;
    }
    setBusy(true);
    setError(null);
    saveProfile(profile);
    const result = await action();
    setBusy(false);
    if (!result.ok) setError(result.error);
    else history.replaceState(null, '', `?room=${result.data.code}`);
  }

  const create = () => run(() => actions.createRoom(profile));
  const join = (e: FormEvent) => {
    e.preventDefault();
    void run(() => actions.joinRoom({ ...profile, code }));
  };

  return (
    <main className="screen home">
      <header className="home__hero">
        <h1 className="logo">Scribble Scramble</h1>
        <p className="tagline">draw fast. guess faster. a new minigame every few seconds.</p>
      </header>

      <section className="ss-panel ss-panel--tape home__card" style={{ '--tilt': 'var(--tilt-left)' } as CSSProperties}>
        <div className="ss-stack">
          <label className="ss-field" htmlFor="name">
            <span className="ss-field__label">Your name</span>
            <input
              className="ss-input"
              id="name"
              value={profile.name}
              maxLength={NAME_MAX_LENGTH}
              placeholder="e.g. Doodlebug"
              autoComplete="nickname"
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </label>

          <fieldset className="face-picker">
            <legend className="ss-field__label">Your face</legend>
            {AVATAR_FACES.map((face) => (
              <label key={face} className="face-picker__option">
                <input
                  type="radio"
                  name="face"
                  value={face}
                  checked={profile.face === face}
                  onChange={() => setProfile({ ...profile, face })}
                />
                <Avatar player={{ color: 'sky', face }} />
                <span className="visually-hidden">{face}</span>
              </label>
            ))}
          </fieldset>

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
        </div>
      </section>
    </main>
  );
}
