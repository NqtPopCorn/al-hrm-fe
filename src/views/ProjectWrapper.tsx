import React, { useState } from 'react';
import Projects from './Projects';
import ProjectView from './Project';

export default function ProjectWrapper() {
  // null means show list, undefined means show create form, string means show detail/edit form
  const [viewState, setViewState] = useState<{ mode: 'list' | 'detail' | 'create', projectId?: string }>({ mode: 'list' });

  if (viewState.mode === 'create') {
    return <ProjectView onBack={() => setViewState({ mode: 'list' })} />;
  }

  if (viewState.mode === 'detail' && viewState.projectId) {
    return <ProjectView projectId={viewState.projectId} onBack={() => setViewState({ mode: 'list' })} />;
  }

  return (
    <Projects 
      onViewDetail={(id) => setViewState({ mode: 'detail', projectId: id })} 
      onCreateNew={() => setViewState({ mode: 'create' })} 
    />
  );
}
