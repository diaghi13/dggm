'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Camera, X } from 'lucide-react';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
  title?: string;
  description?: string;
}

export function BarcodeScanner({
  open,
  onOpenChange,
  onScan,
  title = 'Scansiona Barcode',
  description = 'Posiziona il barcode davanti alla fotocamera',
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const hasScannedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const stopScanner = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        isScanningRef.current = false;
      } catch (err) {
        console.error('Errore stop scanner:', err);
        // Anche se c'è un errore, resettiamo lo stato
        scannerRef.current = null;
        isScanningRef.current = false;
      }
    }
  };

  const startScanner = async () => {
    // Previeni avvio multiplo
    if (isScanningRef.current || scannerRef.current) {
      return;
    }

    setIsLoading(true);
    hasScannedRef.current = false;

    try {
      // Verifica permessi fotocamera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);

      const scanner = new Html5Qrcode('barcode-reader', {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      });

      scannerRef.current = scanner;

      // Configurazione ottimizzata per iOS e Android
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      await scanner.start(
        { facingMode: 'environment' }, // Camera posteriore
        config,
        (decodedText) => {
          // Previeni scansioni multiple
          if (hasScannedRef.current) {
            return;
          }
          hasScannedRef.current = true;

          // Successo - barcode letto
          toast.success('Barcode scansionato', {
            description: decodedText,
          });

          // Stop scanner prima di chiamare onScan
          stopScanner().then(() => {
            onScan(decodedText);
            onOpenChange(false);
          });
        },
        () => {
          // Errori di scansione normali (ignorali)
          // Succede continuamente mentre cerca di leggere
        }
      );

      isScanningRef.current = true;
      setIsLoading(false);
    } catch (err) {
      console.error('Errore scanner:', err);
      setHasPermission(false);
      setIsLoading(false);
      scannerRef.current = null;
      isScanningRef.current = false;

      const error = err as { name?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Permesso fotocamera negato', {
          description: 'Consenti l&apos;accesso alla fotocamera nelle impostazioni del browser',
        });
      } else {
        toast.error('Errore fotocamera', {
          description: 'Impossibile avviare la fotocamera',
        });
      }
    }
  };

  useEffect(() => {
    if (open) {
      // Reset stato quando si apre
      setHasPermission(null);
      setIsLoading(false);

      // Avvia scanner dopo un piccolo delay
      const timer = setTimeout(() => {
        startScanner();
      }, 100);

      return () => {
        clearTimeout(timer);
      };
    } else {
      // Cleanup quando si chiude
      stopScanner();
      hasScannedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    stopScanner();
    hasScannedRef.current = false;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Area Scanner */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
            <div id="barcode-reader" className="w-full h-full" />

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Avvio fotocamera...</p>
                </div>
              </div>
            )}

            {/* Permesso negato */}
            {hasPermission === false && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                <div className="text-center text-white p-4">
                  <X className="h-12 w-12 mx-auto mb-3 text-red-500" />
                  <p className="text-sm font-medium mb-2">Accesso fotocamera negato</p>
                  <p className="text-xs text-slate-300">
                    Consenti l&apos;accesso alla fotocamera nelle impostazioni del browser
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Istruzioni */}
          {isScanningRef.current && !isLoading && (
            <div className="text-center text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-medium">Inquadra il barcode</p>
              <p className="text-xs">
                Assicurati che ci sia abbastanza luce e che il barcode sia ben visibile
              </p>
            </div>
          )}

          {/* Bottone Chiudi */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleClose}
          >
            Annulla
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

