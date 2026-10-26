import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Standing {
  teamName: string;
  totalPoints: number;
  rank: number;
}

export default function Leaderboard() {
  const [standings, setStandings] = useState<Standing[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: Standing[] }>('/api/leaderboard')
      .then((data) => active && setStandings(data.leaderboard))
      .catch(() => active && setError(true));
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {error ? (
          <p role="alert">Unable to load leaderboard scores.</p>
        ) : !standings ? (
          <p role="status">Loading leaderboard...</p>
        ) : standings.length === 0 ? (
          <p>No leaderboard scores</p>
        ) : (
          <ol className="list-group list-group-numbered">
            {standings.map((standing) => (
              <li className="list-group-item" key={standing.teamName}>
                {standing.teamName}: {standing.totalPoints}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
