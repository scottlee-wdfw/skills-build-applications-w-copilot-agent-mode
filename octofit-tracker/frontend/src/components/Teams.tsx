import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Team {
  name: string;
  mascot?: string;
  members: string[];
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => active && setTeams(data.teams))
      .catch(() => active && setError(true));
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {error ? (
          <p role="alert">Unable to load teams.</p>
        ) : !teams ? (
          <p role="status">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p>No teams</p>
        ) : (
          <ul className="list-group list-group-flush">
            {teams.map((team, index) => (
              <li className="list-group-item" key={`${team.name}-${index}`}>
                {team.name}{team.mascot ? ` - ${team.mascot}` : ''}
                {team.members.length > 0 && ` (${team.members.length} members)`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
