import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Activity {
  type: string;
  minutes: number;
  points: number;
}

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => active && setActivities(data.activities))
      .catch(() => active && setError(true));
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {error ? (
          <p role="alert">Unable to load activities.</p>
        ) : !activities ? (
          <p role="status">Loading activities...</p>
        ) : activities.length === 0 ? (
          <p>No activities</p>
        ) : (
          <ul className="list-group list-group-flush">
            {activities.map((activity, index) => (
              <li className="list-group-item" key={`${activity.type}-${index}`}>
                {activity.type} - {activity.minutes} minutes - {activity.points} points
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
