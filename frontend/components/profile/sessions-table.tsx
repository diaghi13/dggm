"use client";

import { useState } from "react";
import { Session } from "@/lib/api/profile";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormSection } from "@/components/form-section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Monitor, Trash2, ShieldAlert, Shield } from "lucide-react";

interface SessionsTableProps {
  sessions: Session[];
  onRevokeSession: (sessionId: number) => Promise<void>;
  onRevokeOtherSessions: () => Promise<void>;
  isLoading?: boolean;
}

export function SessionsTable({
  sessions,
  onRevokeSession,
  onRevokeOtherSessions,
  isLoading = false,
}: SessionsTableProps) {
  const [sessionToRevoke, setSessionToRevoke] = useState<number | null>(null);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);

  const handleRevokeSession = async () => {
    if (sessionToRevoke) {
      await onRevokeSession(sessionToRevoke);
      setSessionToRevoke(null);
    }
  };

  const handleRevokeAll = async () => {
    await onRevokeOtherSessions();
    setShowRevokeAllDialog(false);
  };

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (
      name.includes("mobile") ||
      name.includes("android") ||
      name.includes("ios")
    ) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const otherSessionsCount = sessions.filter((s) => !s.is_current).length;

  return (
    <>
      <Card className="p-6">
        <FormSection title="Sessioni Attive" icon={Shield}>
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={session.is_current ? "border-primary" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">{getDeviceIcon(session.name)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{session.name}</p>
                          {session.is_current && (
                            <Badge variant="default" className="text-xs">
                              Sessione Corrente
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground space-y-1">
                          <p>Ultimo accesso: {session.last_used_at || "Mai"}</p>
                          <p>Creata: {session.created_at}</p>
                        </div>
                      </div>
                    </div>

                    {!session.is_current && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSessionToRevoke(session.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {otherSessionsCount > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldAlert className="h-4 w-4" />
                <span>
                  {otherSessionsCount}{" "}
                  {otherSessionsCount === 1
                    ? "altra sessione attiva"
                    : "altre sessioni attive"}
                </span>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowRevokeAllDialog(true)}
                disabled={isLoading}
              >
                Disconnetti Tutti Gli Altri Dispositivi
              </Button>
            </div>
          )}
        </FormSection>
      </Card>

      {/* Dialog revoca singola sessione */}
      <AlertDialog
        open={sessionToRevoke !== null}
        onOpenChange={(open) => !open && setSessionToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnetti Dispositivo</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler disconnettere questo dispositivo? Dovrai
              effettuare nuovamente l&apos;accesso su quel dispositivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeSession}>
              Disconnetti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog revoca tutte le altre sessioni */}
      <AlertDialog
        open={showRevokeAllDialog}
        onOpenChange={setShowRevokeAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disconnetti Tutti Gli Altri Dispositivi
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler disconnettere tutti gli altri dispositivi?
              Questa azione disconnetterà {otherSessionsCount}{" "}
              {otherSessionsCount === 1 ? "dispositivo" : "dispositivi"}. Dovrai
              effettuare nuovamente l&apos;accesso su ciascun dispositivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAll}
              className="bg-destructive"
            >
              Disconnetti Tutti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
