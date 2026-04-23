import { jest } from '@jest/globals';

jest.mock('react-native-chart-kit', () => ({
  BarChart: 'BarChart',
}));

jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View } = require('react-native');

  const Picker = ({ children }: any) => React.createElement(View, null, children);
  Picker.Item = ({ label }: any) =>
    React.createElement(View, { accessibilityLabel: label });

  return { Picker };
});

jest.mock('./utils/authStorage', () => ({
  getCurrentUserId: jest.fn(),
}));

jest.mock('./utils/trips', () => ({
  getTripsByUserId: jest.fn(),
}));

jest.mock('./utils/activities', () => ({
  getActivitiesByUserId: jest.fn(),
  getCategoriesForUser: jest.fn(),
}));

jest.mock('./utils/insights', () => ({
  getTripInsights: jest.fn(),
}));

jest.mock('./utils/targets', () => ({
  getTargetsByTripId: jest.fn(),
  calculateTripTargetProgress: jest.fn(),
  deleteTarget: jest.fn(),
}));

jest.mock('./db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));