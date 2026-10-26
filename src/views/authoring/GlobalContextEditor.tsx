import type { FsdDocument, Actor } from '../../core/types';
import { OverviewScopeEditor } from './global/sections/OverviewScopeEditor';
import { BusinessContextEditor } from './global/sections/BusinessContextEditor';
import { ActorsConditionsEditor } from './global/sections/ActorsConditionsEditor';

interface GlobalContextEditorProps {
  fsd: FsdDocument;
  onChange: (updatedFsd: FsdDocument) => void;
}

export function GlobalContextEditor({ fsd, onChange }: GlobalContextEditorProps) {
  const updateFsd = (patch: Partial<FsdDocument>) => {
    onChange({
      ...fsd,
      ...patch,
      metadata: {
        ...fsd.metadata,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Overview & Scope */}
      <OverviewScopeEditor
        overview={fsd.overview}
        onChange={(patch) =>
          updateFsd({
            overview: {
              ...fsd.overview,
              ...patch,
            },
          })
        }
      />

      {/* 2. Business Context & Assumptions */}
      <BusinessContextEditor
        businessContext={fsd.businessContext}
        onChange={(patch) =>
          updateFsd({
            businessContext: {
              ...fsd.businessContext,
              ...patch,
            },
          })
        }
      />

      {/* 3. Actors & Pre/Postconditions */}
      <ActorsConditionsEditor
        actors={fsd.actors}
        preconditions={fsd.preconditions}
        postconditions={fsd.postconditions}
        onUpdateActors={(actors: Actor[]) => updateFsd({ actors })}
        onUpdatePreconditions={(preconditions: string[]) => updateFsd({ preconditions })}
        onUpdatePostconditions={(postconditions: string[]) => updateFsd({ postconditions })}
      />
    </div>
  );
}
