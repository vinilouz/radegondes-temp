import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import StudyPlans from '../pages/user/StudyPlans';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

global.fetch = vi.fn();
global.alert = vi.fn();
global.confirm = vi.fn();

const mockAuthContext = {
  token: 'mock-token',
  user: { id: '1', firstName: 'Test User' }
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('StudyPlans Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
    alert.mockClear();
  });

  describe('createCustomPlan function', () => {
    it('should create a custom study plan successfully', async () => {
      const mockPlan = { _id: 'plan123', name: 'Custom Study' };

      fetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // Initial fetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockPlan) }) // POST request
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([mockPlan]) }); // Refresh list

      renderWithProviders(<StudyPlans />);

      const createButton = await screen.findByText('Create Custom Study');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/study-plans`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'Custom Study',
            description: 'Custom study plan created by user'
          })
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith('/study-plans/plan123?edit=true');
    });
  });

  describe('Component rendering', () => {
    it('should display plans after fetching', async () => {
      const mockPlans = [
        { _id: '1', name: 'Plan 1', subjectCount: 2, topicCount: 10, createdAt: new Date().toISOString() },
        { _id: '2', name: 'Plan 2', subjectCount: 5, topicCount: 25, createdAt: new Date().toISOString() },
      ];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlans),
      });

      renderWithProviders(<StudyPlans />);

      expect(await screen.findByText('Plan 1')).toBeInTheDocument();
      expect(await screen.findByText('Plan 2')).toBeInTheDocument();
    });

    it('should display empty state when no plans are fetched', async () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        });

        renderWithProviders(<StudyPlans />);

        expect(await screen.findByText('No studies created yet')).toBeInTheDocument();
      });
  });
});
