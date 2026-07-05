import { useEffect, useState } from 'react';

import {
  employeeService,
  PositionUpsertPayload,
} from '../services/employee.service';
import { Position } from '../types';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load positions.';
}

export function usePositions({ enabled = true }: { enabled?: boolean } = {}) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadPositions = async () => {
      if (!enabled) {
        setPositions([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const nextPositions = await employeeService.listPositions();

        if (!isActive) {
          return;
        }

        setPositions(nextPositions);
      } catch (nextError) {
        if (!isActive) {
          return;
        }

        setError(getErrorMessage(nextError));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadPositions();

    return () => {
      isActive = false;
    };
  }, [enabled]);

  const refresh = async () => {
    if (!enabled) {
      setPositions([]);
      setError(null);
      setIsLoading(false);
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);
      const nextPositions = await employeeService.listPositions();
      setPositions(nextPositions);
      return nextPositions;
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  };

  const createPosition = async (payload: PositionUpsertPayload) => {
    const createdPosition = await employeeService.createPosition(payload);
    setPositions(currentPositions => [...currentPositions, createdPosition]);
    return createdPosition;
  };

  const updatePosition = async (
    positionId: string,
    payload: Partial<PositionUpsertPayload>,
  ) => {
    const updatedPosition = await employeeService.updatePosition(
      positionId,
      payload,
    );
    setPositions(currentPositions =>
      currentPositions.map(position =>
        position.id === positionId ? updatedPosition : position,
      ),
    );
    return updatedPosition;
  };

  return {
    positions,
    isLoading,
    error,
    refresh,
    createPosition,
    updatePosition,
  };
}
