import { Game } from './screens/Game';
import { Home } from './screens/Home';
import { Lobby } from './screens/Lobby';
import { Sketchpad } from './screens/Sketchpad';
import { useGame } from './store';

export function App() {
  const { connected, room, playerId, events, clockOffset } = useGame();

  if (location.pathname === '/sketchpad') return <Sketchpad />;

  if (!connected) {
    return (
      <main className="screen center">
        <p className="note">connecting to the game server…</p>
      </main>
    );
  }
  if (!room || !playerId) return <Home />;
  if (room.phase === 'lobby') return <Lobby room={room} playerId={playerId} />;
  return <Game room={room} playerId={playerId} events={events} clockOffset={clockOffset} />;
}
