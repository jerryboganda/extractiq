import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiError } from '@/lib/api-client';
import { useAcceptInvitation, useInvitation } from '@/hooks/use-api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Loader2, MailWarning } from 'lucide-react';
import { toast } from 'sonner';

const acceptInvitationSchema = z.object({
  name: z.string().min(1, 'Full name is required').max(100, 'Name must be 100 characters or fewer'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  confirmPassword: z.string().min(12, 'Confirm your password'),
}).refine((value) => value.password === value.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { isAuthenticated, refreshUser } = useAuth();
  const invitation = useInvitation(token);
  const acceptInvitation = useAcceptInvitation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      name: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (invitation.data?.invitedName) {
      reset({
        name: invitation.data.invitedName,
        password: '',
        confirmPassword: '',
      });
    }
  }, [invitation.data?.invitedName, reset]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: AcceptInvitationValues) => {
    if (!token) return;

    try {
      await acceptInvitation.mutateAsync({
        token,
        name: values.name.trim(),
        password: values.password,
      });
      await refreshUser();
      toast.success('Invitation accepted. Welcome to ExtractIQ.');
      navigate('/', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to accept invitation';
      toast.error(message);
    }
  };

  const status = invitation.data?.status;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-bold text-primary-foreground">E</span>
          </div>
          <CardTitle className="text-2xl">Accept your invitation</CardTitle>
          <CardDescription>Join your workspace and finish setting up your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!token ? (
            <Alert variant="destructive">
              <MailWarning className="h-4 w-4" />
              <AlertTitle>Invitation token missing</AlertTitle>
              <AlertDescription>
                Open the invitation email again and use the full link, or ask your admin to send a new invite.
              </AlertDescription>
            </Alert>
          ) : invitation.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : invitation.error ? (
            <Alert variant="destructive">
              <MailWarning className="h-4 w-4" />
              <AlertTitle>Invitation unavailable</AlertTitle>
              <AlertDescription>
                {invitation.error instanceof ApiError ? invitation.error.message : 'This invitation could not be loaded.'}
              </AlertDescription>
            </Alert>
          ) : status === 'accepted' ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Invitation already accepted</AlertTitle>
              <AlertDescription>
                This invite has already been used. Sign in with the account you created.
              </AlertDescription>
            </Alert>
          ) : status === 'expired' ? (
            <Alert variant="destructive">
              <MailWarning className="h-4 w-4" />
              <AlertTitle>Invitation expired</AlertTitle>
              <AlertDescription>
                Ask your workspace admin to send you a fresh invitation link.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <p className="font-medium">{invitation.data?.workspaceName}</p>
                <p className="text-muted-foreground">{invitation.data?.email}</p>
                <p className="mt-1 text-muted-foreground">Role: {invitation.data?.role}</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'accept-name-error' : undefined}
                  />
                  {errors.name ? <p id="accept-name-error" className="text-xs text-destructive">{errors.name.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'accept-password-error' : undefined}
                  />
                  {errors.password ? <p id="accept-password-error" className="text-xs text-destructive">{errors.password.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    {...register('confirmPassword')}
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? 'accept-confirm-password-error' : undefined}
                  />
                  {errors.confirmPassword ? <p id="accept-confirm-password-error" className="text-xs text-destructive">{errors.confirmPassword.message}</p> : null}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting || acceptInvitation.isPending}>
                  {isSubmitting || acceptInvitation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept Invitation'}
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already set up? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
