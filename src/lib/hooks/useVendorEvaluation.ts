/**
 * useVendorEvaluation — React hook for managing vendor evaluation scoring.
 *
 * Provides local criteria state for instant UI feedback, derived scores,
 * and save/load operations via the client API repo.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import * as evalApiRepo from '@/lib/domain/vendors/vendorEvaluationApiRepo';
import type { VendorEvaluationDto } from '@/lib/domain/vendors/vendorEvaluationApiRepo';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CriterionKey =
  | 'delivery_timeliness'
  | 'quality_of_work'
  | 'budget_adherence'
  | 'communication_responsiveness'
  | 'compliance_documentation';

export interface CriteriaState {
  delivery_timeliness: number;
  quality_of_work: number;
  budget_adherence: number;
  communication_responsiveness: number;
  compliance_documentation: number;
}

export type GradeBand = 'red' | 'amber' | 'green';

export interface UseVendorEvaluationReturn {
  /** Server-stored evaluation (null if not rated yet) */
  evaluation: VendorEvaluationDto | null;
  /** Local criteria state for instant UI feedback */
  criteria: CriteriaState;
  /** Whether initial load is in progress */
  loading: boolean;
  /** Whether a save is in progress */
  saving: boolean;
  /** Error message, if any */
  error: string | null;
  /** Whether this vendor has been rated before */
  hasBeenRated: boolean;
  /** Average star rating (1–5) */
  averageStars: number;
  /** Final score (1–10) */
  finalScore: number;
  /** Grade label: Bad / Good / Excellent */
  grade: string;
  /** Color band: red / amber / green */
  band: GradeBand;
  /** Update a single criterion (1–5) */
  setCriterion: (key: CriterionKey, stars: number) => void;
  /** Persist the current criteria to the database */
  save: () => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_CRITERIA: CriteriaState = {
  delivery_timeliness: 3,
  quality_of_work: 3,
  budget_adherence: 3,
  communication_responsiveness: 3,
  compliance_documentation: 3,
};

/* ------------------------------------------------------------------ */
/*  Score computation (mirrors server logic for instant UI)            */
/* ------------------------------------------------------------------ */

function computeDerived(c: CriteriaState) {
  const avg =
    (c.delivery_timeliness +
      c.quality_of_work +
      c.budget_adherence +
      c.communication_responsiveness +
      c.compliance_documentation) /
    5;

  const finalScore = Math.round(Math.min(10, Math.max(1, avg * 2)) * 10) / 10;
  const averageStars = Math.round(avg * 10) / 10;

  let grade: string;
  let band: GradeBand;

  if (finalScore <= 3) {
    grade = 'Bad';
    band = 'red';
  } else if (finalScore <= 7) {
    grade = 'Good';
    band = 'amber';
  } else {
    grade = 'Excellent';
    band = 'green';
  }

  return { averageStars, finalScore, grade, band };
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useVendorEvaluation(
  vendorId: string | undefined
): UseVendorEvaluationReturn {
  const [evaluation, setEvaluation] = useState<VendorEvaluationDto | null>(
    null
  );
  const [criteria, setCriteria] = useState<CriteriaState>(DEFAULT_CRITERIA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBeenRated, setHasBeenRated] = useState(false);

  // Load evaluation from server
  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchEvaluation() {
      setLoading(true);
      setError(null);
      try {
        const data = await evalApiRepo.get(vendorId!);
        if (!cancelled) {
          setEvaluation(data);
          if (data) {
            setCriteria({
              delivery_timeliness: data.delivery_timeliness,
              quality_of_work: data.quality_of_work,
              budget_adherence: data.budget_adherence,
              communication_responsiveness: data.communication_responsiveness,
              compliance_documentation: data.compliance_documentation,
            });
            setHasBeenRated(true);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : 'Failed to load evaluation';
          console.error('[useVendorEvaluation] fetch error:', msg);
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEvaluation();
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  // Derived scores (computed from local criteria for instant feedback)
  const derived = useMemo(() => computeDerived(criteria), [criteria]);

  // Update a single criterion
  const setCriterion = useCallback((key: CriterionKey, stars: number) => {
    const clamped = Math.max(1, Math.min(5, Math.round(stars)));
    setCriteria((prev) => ({ ...prev, [key]: clamped }));
  }, []);

  // Save to server
  const saveFn = useCallback(async () => {
    if (!vendorId) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await evalApiRepo.save(vendorId, {
        delivery_timeliness: criteria.delivery_timeliness,
        quality_of_work: criteria.quality_of_work,
        budget_adherence: criteria.budget_adherence,
        communication_responsiveness: criteria.communication_responsiveness,
        compliance_documentation: criteria.compliance_documentation,
      });
      setEvaluation(saved);
      setHasBeenRated(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to save evaluation';
      console.error('[useVendorEvaluation] save error:', msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [vendorId, criteria]);

  return {
    evaluation,
    criteria,
    loading,
    saving,
    error,
    hasBeenRated,
    averageStars: derived.averageStars,
    finalScore: derived.finalScore,
    grade: derived.grade,
    band: derived.band,
    setCriterion,
    save: saveFn,
  };
}
