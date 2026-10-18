import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PasswordInput } from '../components/ui/password-input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Login() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  
  const login = useAppStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering && password !== passwordRepeat) {
      setError('De wachtwoorden komen niet overeen.');
      return;
    }

    try {
      if (isRegistering) {
        await api.post('/auth/register', { email, firstName, lastName, password, phoneNumber });
      }
      
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.firstName, res.data.role);
      navigate('/'); // Stuur terug naar de planning!
    } catch (err) {
      setError(errorMessage(err, 'Er ging iets mis.'));
    }
  };

  return (
    <Card className="mt-8 border-slate-200">
      <CardHeader>
        <CardTitle>{isRegistering ? 'Account Aanmaken' : 'Inloggen'}</CardTitle>
        <CardDescription>
          {isRegistering ? 'Maak een account aan om je in te schrijven.' : 'Log in om je in te schrijven voor taken.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">E-mailadres</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Wachtwoord</Label>
            <PasswordInput id="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {isRegistering && (
            <div className="space-y-1">
              <Label htmlFor="passwordRepeat">Herhaal wachtwoord</Label>
              <PasswordInput
                id="passwordRepeat"
                autoComplete="new-password"
                value={passwordRepeat}
                onChange={(e) => setPasswordRepeat(e.target.value)}
                aria-invalid={passwordRepeat.length > 0 && passwordRepeat !== password}
                required
              />
              {passwordRepeat.length > 0 && passwordRepeat !== password && (
                <p className="text-xs text-red-600">De wachtwoorden komen nog niet overeen.</p>
              )}
            </div>
          )}

          {isRegistering && (
            <>
              <div className="space-y-1">
                <Label htmlFor="firstName">Voornaam</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Achternaam</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Telefoonnummer (Optioneel)</Label>
                <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              </div>
            </>
          )}
          
          {error && <p role="alert" className="text-red-500 text-sm">{error}</p>}
          
          <Button type="submit" className="w-full">
            {isRegistering ? 'Maak account & Log in' : 'Inloggen'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <button type="button" onClick={() => { setIsRegistering(!isRegistering); setPasswordRepeat(''); setError(''); }} className="text-blue-600 hover:underline">
            {isRegistering ? 'Heb je al een account? Log in' : 'Nog geen account? Registreer hier'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}