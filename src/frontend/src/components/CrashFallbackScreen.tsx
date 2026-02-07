import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface CrashFallbackScreenProps {
  error: Error | null;
  errorInfo?: React.ErrorInfo | null;
  onReset?: () => void;
}

export default function CrashFallbackScreen({ error, errorInfo, onReset }: CrashFallbackScreenProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleRefresh = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  const handleDebugPage = () => {
    window.location.hash = '#/debug';
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-2xl">Application Failed to Load</CardTitle>
              <CardDescription className="mt-2">
                The application encountered an error and could not start properly.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">What you can do:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Click "Refresh Page" below to try loading the application again</li>
              <li>Clear your browser cache and cookies, then refresh</li>
              <li>Try accessing the application in a private/incognito window</li>
              <li>Check the diagnostics page for more information</li>
            </ul>
          </div>

          {error && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="technical-details">
                <AccordionTrigger>
                  <span className="text-sm font-medium">Show Technical Details</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Error Message:</h4>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {error.message || 'Unknown error'}
                      </pre>
                    </div>
                    {error.stack && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Stack Trace:</h4>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-48">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Component Stack:</h4>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-48">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Context:</h4>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {JSON.stringify(
                          {
                            url: window.location.href,
                            origin: window.location.origin,
                            hash: window.location.hash,
                            timestamp: new Date().toISOString(),
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
          <Button onClick={handleDebugPage} variant="outline">
            Open Diagnostics
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
