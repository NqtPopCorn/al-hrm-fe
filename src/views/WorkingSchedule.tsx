import { User } from '../types';
import WorkingScheduleAdmin from './WorkingScheduleAdmin';
import WorkingScheduleEmployee from './WorkingScheduleEmployee';

interface WorkingScheduleProps {
  user: User;
}

export default function WorkingSchedule({ user }: WorkingScheduleProps) {
  const isAdmin = user.role === 'Super Admin' || user.role === 'HR Admin' || user.role === 'Manager';

  if (isAdmin) {
    return <WorkingScheduleAdmin user={user} />;
  }

  return <WorkingScheduleEmployee user={user} />;
}
