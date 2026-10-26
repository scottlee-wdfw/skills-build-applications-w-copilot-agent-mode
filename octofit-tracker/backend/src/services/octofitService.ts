import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function clientError(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') clientError('Invalid activity');
  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || typeof type !== 'string'
    || typeof minutes !== 'number'
  ) clientError('Invalid activity payload: userId, teamId, type, and minutes are required');

  if (!mongoose.isValidObjectId(userId)) clientError('Invalid userId');
  if (!mongoose.isValidObjectId(teamId)) clientError('Invalid teamId');
  if (!type.trim()) clientError('Invalid activity type');
  if (!Number.isFinite(minutes) || minutes <= 0) clientError('Invalid minutes');

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id').lean(),
    Team.findById(teamId).select('_id').lean(),
  ]);
  if (!user || !team) clientError('User or team not found');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') clientError('Invalid team');
  const { name, mascot, members = [] } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (typeof name !== 'string' || !name.trim()) clientError('Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) clientError('Team mascot is required');
  if (!Array.isArray(members)) clientError('Team members must be an array');

  const memberIds = (members as unknown[]).map((member: unknown) => {
    if (typeof member !== 'string' || !mongoose.isValidObjectId(member)) clientError('Invalid team member');
    return member;
  });
  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (existingMembers.length !== memberIds.length) clientError('Team member not found');

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const standings = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const teams = await Team.find({ _id: { $in: standings.map(({ _id }) => _id) } })
    .select('_id name')
    .lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return standings
    .map((standing, index) => ({
      teamName: teamNames.get(standing._id.toString()) ?? 'Unknown team',
      totalPoints: standing.totalPoints,
      rank: index + 1,
    }))
    .filter((standing) => standing.teamName !== 'Unknown team');
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id })
    .sort({ occurredAt: -1 })
    .select('type')
    .lean();
  const activityFocuses: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    walk: 'mobility',
    strength: 'strength',
  };
  const normalizedActivity = recentActivity?.type.toLowerCase();
  const focus = (normalizedActivity && activityFocuses[normalizedActivity]) ?? user.fitnessGoal;
  const reason = recentActivity?.type
    ? `Based on your recent ${recentActivity.type} activity.`
    : `Matches your ${user.fitnessGoal} fitness goal.`;

  const suggestions = await Workout.find({ focus }).lean();
  return suggestions.map((suggestion) => ({ ...suggestion, reason }));
}

export { User };
