import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useActor } from '../hooks/useActor';
import { useGetCallerUserRole } from '../hooks/useQueries';
import { getRuntimeDebugInfo } from '../utils/runtimeDebugInfo';
import { CheckCircle2, XCircle, AlertCircle, Home } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export default function DebugPage() {
  const navigate = useNavigate();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: userRole, isLoading: roleLoading, error: roleError } = useGetCallerUserRole();

  const debugInfo = getRuntimeDebugInfo();

  const actorStatus = actor ? 'available' : actorFetching ? 'loading' : 'unavailable';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Diagnostics</h1>
            <p className="text-muted-foreground mt-1">System status and runtime information</p>
          </div>
          <Button onClick={() => navigate({ to: '/' })} variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </div>

        <Separator />

        {/* Backend Status */}
        <Card>
          <CardHeader>
            <CardTitle>Backend Connection</CardTitle>
            <CardDescription>Status of the backend actor and canister communication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Actor Status:</span>
              <div className="flex items-center gap-2">
                {actorStatus === 'available' && (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <Badge variant="default">Available</Badge>
                  </>
                )}
                {actorStatus === 'loading' && (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <Badge variant="secondary">Loading</Badge>
                  </>
                )}
                {actorStatus === 'unavailable' && (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    <Badge variant="destructive">Unavailable</Badge>
                  </>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <span className="font-medium">Backend Call Test (getCallerUserRole):</span>
              {roleLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Loading...</span>
                </div>
              )}
              {roleError && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-4 w-4" />
                    <span>Error</span>
                  </div>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {roleError instanceof Error ? roleError.message : String(roleError)}
                  </pre>
                </div>
              )}
              {!roleLoading && !roleError && userRole && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Success - Role: {userRole}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* URL and Origin Information */}
        <Card>
          <CardHeader>
            <CardTitle>URL & Origin Information</CardTitle>
            <CardDescription>Current page location and routing details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Full URL:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs break-all">{debugInfo.url}</code>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Origin:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">{debugInfo.origin}</code>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Hash Route:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">{debugInfo.hash || '(none)'}</code>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Protocol:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">{debugInfo.protocol}</code>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Host:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">{debugInfo.host}</code>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Hostname:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">{debugInfo.hostname}</code>
              </div>
              {debugInfo.port && (
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="font-medium">Port:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{debugInfo.port}</code>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Build Information */}
        <Card>
          <CardHeader>
            <CardTitle>Build Information</CardTitle>
            <CardDescription>Application build and environment details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Mode:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">{debugInfo.buildInfo.mode}</code>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Node Env:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">{debugInfo.buildInfo.nodeEnv}</code>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Timestamp:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">{debugInfo.timestamp}</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Debug Data */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="full-debug">
            <AccordionTrigger>
              <span className="font-medium">Show Full Debug Data (JSON)</span>
            </AccordionTrigger>
            <AccordionContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
