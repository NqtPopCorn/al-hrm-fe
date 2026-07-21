import { User } from '../types';
import SalaryAdvancesAdmin from './SalaryAdvancesAdmin';
import SalaryAdvancesEmployee from './SalaryAdvancesEmployee';

interface SalaryAdvancesProps {
  user: User;
}

export default function SalaryAdvances({ user }: SalaryAdvancesProps) {
  const isAdmin = user.role === 'Super Admin' || user.role === 'HR Admin';

  if (isAdmin) {
    return <SalaryAdvancesAdmin user={user} />;
  }

  return <SalaryAdvancesEmployee user={user} />;
}
