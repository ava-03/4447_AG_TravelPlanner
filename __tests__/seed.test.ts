import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { seedDatabaseIfEmpty } from '../db/seed';
import { db } from '../db/client';

jest.mock('../db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

describe('seedDatabaseIfEmpty', () => {
  const mockDb = db as unknown as {
    select: ReturnType<typeof jest.fn>;
    insert: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts sample data into all core tables when database is empty', async () => {
    const fromMock = jest.fn() as ReturnType<typeof jest.fn>;
    fromMock.mockResolvedValueOnce([]);

    const valuesMock = jest.fn() as ReturnType<typeof jest.fn>;
    valuesMock.mockResolvedValue(undefined);

    mockDb.select.mockReturnValue({
      from: fromMock,
    });

    mockDb.insert.mockReturnValue({
      values: valuesMock,
    });

    await seedDatabaseIfEmpty();

    expect(mockDb.select).toHaveBeenCalledTimes(1);
    expect(mockDb.insert).toHaveBeenCalledTimes(5);
    expect(valuesMock).toHaveBeenCalledTimes(5);
  });

  it('does not insert duplicate seed data when users already exist', async () => {
    const fromMock = jest.fn() as ReturnType<typeof jest.fn>;
    fromMock.mockResolvedValueOnce([{ id: 1 }]);

    mockDb.select.mockReturnValue({
      from: fromMock,
    });

    mockDb.insert.mockReturnValue({
      values: jest.fn(),
    });

    await seedDatabaseIfEmpty();

    expect(mockDb.select).toHaveBeenCalledTimes(1);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});