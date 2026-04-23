import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import Trips from '../screens/Trips';
import { getCurrentUserId } from '../utils/authStorage';
import { getTripsByUserId } from '../utils/trips';

jest.mock('../utils/authStorage');
jest.mock('../utils/trips');

describe('Trips integration', () => {
  const mockGetCurrentUserId =
    getCurrentUserId as unknown as ReturnType<typeof jest.fn>;
  const mockGetTripsByUserId =
    getTripsByUserId as unknown as ReturnType<typeof jest.fn>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays seeded trip data after loading', async () => {
    mockGetCurrentUserId.mockResolvedValue(1);

    mockGetTripsByUserId.mockResolvedValue([
      {
        id: 1,
        userId: 1,
        name: 'Barcelona City Break',
        destination: 'Barcelona, Spain',
        startDate: '2026-05-10',
        endDate: '2026-05-15',
        notes: 'Spring holiday with lots of walking and food spots.',
      },
      {
        id: 2,
        userId: 1,
        name: 'Alps Adventure',
        destination: 'Chamonix, France',
        startDate: '2026-06-02',
        endDate: '2026-06-08',
        notes: 'Outdoor-focused trip with hikes and scenic activities.',
      },
    ]);

    const { getByText } = render(
      <NavigationContainer>
        <Trips navigation={{ navigate: jest.fn(), reset: jest.fn() }} />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText('Barcelona City Break')).toBeTruthy();
      expect(getByText('Alps Adventure')).toBeTruthy();
    });
  });
});