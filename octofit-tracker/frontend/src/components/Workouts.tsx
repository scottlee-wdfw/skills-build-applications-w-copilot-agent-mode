import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Workout {
  title: string;
  reason?: string;
}

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => active && setWorkouts(data.suggestions))
      .catch(() => active && setError(true));
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {error ? (
          <p role="alert">Unable to load workout suggestions.</p>
        ) : !workouts ? (
          <p role="status">Loading workout suggestions...</p>
        ) : workouts.length === 0 ? (
          <p>No workout suggestions</p>
        ) : (
          <ul className="list-group list-group-flush">
            {workouts.map((workout, index) => (
              <li className="list-group-item" key={`${workout.title}-${index}`}>
                {workout.title}{workout.reason ? ` - ${workout.reason}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
