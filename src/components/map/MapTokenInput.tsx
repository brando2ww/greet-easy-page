import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Key } from 'lucide-react';

interface MapTokenInputProps {
  onTokenSubmit: (token: string) => void;
}

export const MapTokenInput = ({ onTokenSubmit }: MapTokenInputProps) => {
  const { t } = useTranslation();
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onTokenSubmit(token.trim());
      localStorage.setItem('mapbox_token', token.trim());
    }
  };

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center mb-6">
          <Key className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">{t('stations.mapboxTokenRequired')}</h2>
          <p className="text-muted-foreground">
            {t('stations.mapboxTokenDescription')}
          </p>
        </div>

        <Alert>
          <AlertDescription className="space-y-2">
            <p className="font-medium">{t('stations.howToGetToken')}:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>{t('stations.step1')}</li>
              <li>{t('stations.step2')}</li>
              <li>{t('stations.step3')}</li>
            </ol>
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline text-sm mt-2"
            >
              {t('stations.getTokenHere')}
              <ExternalLink className="w-3 h-3" />
            </a>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="pk.eyJ1Ijoi..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
            {t('stations.saveToken')}
          </Button>
        </form>
      </div>
    </div>
  );
};
