import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AcceptInvitation from './AcceptInvitation';

const navigateMock = vi.fn();
const refreshUserMock = vi.fn();
const acceptInvitationMutateAsync = vi.fn();

const invitationQueryState = {
  isLoading: false,
  error: null as Error | null,
  data: {
    email: 'invitee@example.com',
    role: 'reviewer',
    workspaceId: 'ws-1',
    workspaceName: 'Workspace One',
    invitedName: 'Invited Reviewer',
    expiresAt: '2026-03-20T00:00:00.000Z',
    accepted: false,
    expired: false,
    status: 'pending' as const,
  },
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/hooks/use-api', () => ({
  useInvitation: () => invitationQueryState,
  useAcceptInvitation: () => ({
    mutateAsync: acceptInvitationMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    refreshUser: refreshUserMock,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderPage(initialEntry: string = '/accept-invite?token=test-token') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/accept-invite" element={<AcceptInvitation />} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AcceptInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invitationQueryState.isLoading = false;
    invitationQueryState.error = null;
    invitationQueryState.data = {
      email: 'invitee@example.com',
      role: 'reviewer',
      workspaceId: 'ws-1',
      workspaceName: 'Workspace One',
      invitedName: 'Invited Reviewer',
      expiresAt: '2026-03-20T00:00:00.000Z',
      accepted: false,
      expired: false,
      status: 'pending',
    };
  });

  it('renders invitation details and pre-fills the invited name', async () => {
    renderPage();

    expect(screen.getByText('Workspace One')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Invited Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Role: reviewer')).toBeInTheDocument();
  });

  it('accepts the invitation and refreshes the authenticated session', async () => {
    const user = userEvent.setup();
    acceptInvitationMutateAsync.mockResolvedValue({ data: { token: 'token' } });
    renderPage();

    await user.clear(screen.getByLabelText('Full name'));
    await user.type(screen.getByLabelText('Full name'), 'Accepted Reviewer');
    await user.type(screen.getByLabelText('Password'), 'SuperSecure123');
    await user.type(screen.getByLabelText('Confirm password'), 'SuperSecure123');
    await user.click(screen.getByRole('button', { name: /accept invitation/i }));

    await waitFor(() => {
      expect(acceptInvitationMutateAsync).toHaveBeenCalledWith({
        token: 'test-token',
        name: 'Accepted Reviewer',
        password: 'SuperSecure123',
      });
    });
    expect(refreshUserMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
  });

  it('shows the expired state for stale invitations', () => {
    invitationQueryState.data = {
      ...invitationQueryState.data,
      status: 'expired',
      expired: true,
    };
    renderPage();

    expect(screen.getByText('Invitation expired')).toBeInTheDocument();
  });
});
