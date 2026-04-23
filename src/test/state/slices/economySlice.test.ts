import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createEconomySlice, EconomySlice } from '@/state/slices/economySlice';
import { act } from '@testing-library/react';

// Mock store for testing the slice in isolation
const createTestStore = () =>
  create<EconomySlice>()(
    immer((set, get, ...args) => ({
      ...createEconomySlice(set, get, ...args),
      // Mock the minimal state needed by the slice
      week: 1,
    }))
  );

describe('EconomySlice', () => {
  let useTestStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useTestStore = createTestStore();
  });

  it('should initialize with zero treasury and empty ledger', () => {
    const { treasury, ledger } = useTestStore.getState();
    expect(treasury).toBe(0);
    expect(ledger).toEqual([]);
  });

  it('should add funds correctly', () => {
    act(() => {
      useTestStore.getState().addFunds(100, 'Prize Money', 'prize');
    });

    const { treasury, ledger } = useTestStore.getState();
    expect(treasury).toBe(100);
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({
      amount: 100,
      label: 'Prize Money',
      category: 'prize',
      week: 1,
    });
  });

  it('should deduct funds correctly when treasury is sufficient', () => {
    act(() => {
      useTestStore.getState().addFunds(500, 'Initial', 'other');
    });

    let result: boolean = false;
    act(() => {
      result = useTestStore.getState().deductFunds(200, 'Recruitment', 'recruit');
    });

    const { treasury, ledger } = useTestStore.getState();
    expect(result).toBe(true);
    expect(treasury).toBe(300);
    expect(ledger).toHaveLength(2);
    expect(ledger[1]).toMatchObject({
      amount: -200,
      label: 'Recruitment',
      category: 'recruit',
    });
  });

  it('should fail to deduct funds when treasury is insufficient', () => {
    let result: boolean = true;
    act(() => {
      result = useTestStore.getState().deductFunds(100, 'Greedy Merchant', 'other');
    });

    const { treasury, ledger } = useTestStore.getState();
    expect(result).toBe(false);
    expect(treasury).toBe(0);
    expect(ledger).toHaveLength(0);
  });
});
