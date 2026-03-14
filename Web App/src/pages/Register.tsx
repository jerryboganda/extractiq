import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const registerFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  workspaceName: z.string().min(1, 'Workspace name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function Register() {
  const { register: registerAccount, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      workspaceName: '',
      email: '',
      password: '',
    },
  });

  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerAccount({
        name: data.name.trim(),
        workspaceName: data.workspaceName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      toast.success('Workspace created successfully.');
      navigate('/', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create your account.';
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-bold text-primary-foreground">E</span>
          </div>
          <CardTitle className="text-2xl">Create your workspace</CardTitle>
          <CardDescription>Set up your first admin account with a clean workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input id="name" {...register('name')} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspaceName">Workspace Name</Label>
              <Input id="workspaceName" {...register('workspaceName')} aria-invalid={!!errors.workspaceName} />
              {errors.workspaceName && <p className="text-xs text-destructive">{errors.workspaceName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} aria-invalid={!!errors.email} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} {...register('password')} className="pr-10" aria-invalid={!!errors.password} />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((value) => !value)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Workspace
                </>
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
