import React, { useState } from 'react';
import HandoverList from './HandoverList';
import HandoverRecord from './HandoverRecord';
import { User as AuthUser } from '../types';

export default function HandoverWrapper({ user }: { user: AuthUser }) {
  const [selectedHandoverId, setSelectedHandoverId] = useState<string | null>(null);

  const isEmployeeOnly = user.role === 'Employee';

  if (isEmployeeOnly) {
    // Regular employees only see their own handover detail page
    return <HandoverRecord user={user} handoverId={null} />;
  }

  if (selectedHandoverId) {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setSelectedHandoverId(null)}
          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          &larr; Quay lại danh sách
        </button>
        <HandoverRecord user={user} handoverId={selectedHandoverId} />
      </div>
    );
  }

  return <HandoverList user={user} onSelect={setSelectedHandoverId} />;
}
