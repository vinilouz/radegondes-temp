import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import PlanoDetalhes from '../pages/user/PlanoDetalhes'; // Using the old name for now
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const mockNavigate = vi.fn();
const mockParams = { id: 'plan123' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useLocation: () => ({ search: '' })
  };
});

global.fetch = vi.fn();

const mockAuthContext = {
  token: 'mock-token',
  user: { id: '1', firstName: 'Test User' },
  authenticatedFetch: (url, options) => global.fetch(url, options)
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

describe('PlanoDetalhes (to be renamed StudyPlanDetails) Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  it('should fetch and display the study plan details correctly', async () => {
    const mockPlan = {
      _id: 'plan123',
      name: 'My Awesome Study Plan',
      description: 'A plan to learn everything.',
      subjects: [
        { _id: 'subject1', name: 'React', color: 'blue', topics: ['useState', 'useEffect'], topicCount: 2 },
        { _id: 'subject2', name: 'Node.js', color: 'green', topics: ['Express', 'Mongoose'], topicCount: 2 }
      ],
      subjectCount: 2,
      topicCount: 4
    };

    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPlan),
    });

    renderWithProviders(<PlanoDetalhes />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${API_BASE_URL}/api/study-plans/${mockParams.id}`),
        expect.any(Object)
      );
    });

    expect(await screen.findByText(/My Awesome Study Plan/i)).toBeInTheDocument();
  });

  it('should navigate to /study-plans if the plan is not found (404)', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    renderWithProviders(<PlanoDetalhes />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/study-plans');
    });
  });
});
