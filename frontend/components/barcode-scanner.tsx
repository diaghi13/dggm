"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
} from "@zxing/library";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Camera, X, Flashlight, FlashlightOff } from "lucide-react";
import { toast } from "sonner";

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
  title = "Scansiona Barcode",
  description = "Posiziona il barcode davanti alla fotocamera",
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef(false);
  const hasScannedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
        torch?: boolean;
      };

      if (capabilities.torch) {
        await track.applyConstraints({
          // @ts-expect-error - torch non è nel tipo standard ma è supportato su alcuni dispositivi
          advanced: [{ torch: !torchEnabled }],
        });
        setTorchEnabled(!torchEnabled);
      }
    } catch (error) {
      console.error("Errore toggle torcia:", error);
    }
  };

  const stopScanner = async () => {
    isScanningRef.current = false;

    // Stop scanner
    if (scannerRef.current) {
      try {
        scannerRef.current.reset();
      } catch {
        // Ignora errori
      }
      scannerRef.current = null;
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setTorchEnabled(false);
    setHasTorch(false);
  };

  const startScanner = async () => {
    // Previeni avvio multiplo
    if (isScanningRef.current || scannerRef.current) {
      return;
    }

    setIsLoading(true);
    hasScannedRef.current = false;

    try {
      // Configurazione hints OTTIMIZZATA - NO TRY_HARDER (troppo lento!)
      const hints = new Map();
      const formats = [
        // 1D Barcode lineari
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.ITF,
        BarcodeFormat.CODABAR,
        BarcodeFormat.RSS_14,
        BarcodeFormat.RSS_EXPANDED,
        // 2D Barcode matriciali
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.AZTEC,
        BarcodeFormat.PDF_417,
        BarcodeFormat.MAXICODE,
      ];
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      // NO TRY_HARDER - rallenta troppo, meglio scan più frequenti

      // Crea scanner con hints ottimizzati
      const scanner = new BrowserMultiFormatReader(hints);
      scannerRef.current = scanner;

      // Rileva se siamo su mobile o desktop
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );

      // Constraints ottimizzati - diversi per mobile e desktop
      const constraints: MediaStreamConstraints = isMobile
        ? {
            video: {
              facingMode: "environment", // Camera posteriore solo su mobile
              width: { ideal: 1280, max: 1920 }, // Risoluzione ridotta anche su mobile
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30 }, // FPS fisso
            },
          }
        : {
            video: {
              // Desktop: risoluzione più bassa
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            },
          };

      // Richiedi accesso fotocamera
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);

      // Verifica supporto torcia (principalmente Android)
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
        torch?: boolean;
      };
      if (capabilities.torch) {
        setHasTorch(true);
      }

      // Collega stream al video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Attendi che il video sia pronto
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              resolve();
            };
          }
        });

        // Avvia la scansione continua
        isScanningRef.current = true;
        setIsLoading(false);

        // Loop di scansione ottimizzato - più veloce di decodeFromVideoDevice
        const scanLoop = async () => {
          if (!isScanningRef.current || hasScannedRef.current) return;

          try {
            const result = await scanner.decodeFromVideoElement(
              videoRef.current!,
            );

            if (result && !hasScannedRef.current) {
              hasScannedRef.current = true;
              const code = result.getText();

              // Successo - barcode letto
              toast.success("Barcode scansionato", {
                description: code,
              });

              // Stop scanner prima di chiamare onScan
              await stopScanner();
              onScan(code);
              onOpenChange(false);
              return;
            }
          } catch {
            // Errori normali durante scan - ignora
          }

          // Riprova dopo 100ms (10 tentativi/sec = veloce ma non troppo)
          if (isScanningRef.current) {
            setTimeout(scanLoop, 100);
          }
        };

        // Avvia il loop
        scanLoop();
      }
    } catch (err) {
      console.error("Errore scanner:", err);
      setHasPermission(false);
      setIsLoading(false);
      scannerRef.current = null;
      streamRef.current = null;
      isScanningRef.current = false;

      const error = err as { name?: string };
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        toast.error("Permesso fotocamera negato", {
          description:
            "Consenti l'accesso alla fotocamera nelle impostazioni del browser",
        });
      } else if (error.name === "NotFoundError") {
        toast.error("Fotocamera non trovata", {
          description:
            "Verifica che il dispositivo abbia una fotocamera disponibile",
        });
      } else if (error.name === "NotReadableError") {
        toast.error("Fotocamera occupata", {
          description: "La fotocamera è già in uso da un'altra app",
        });
      } else {
        toast.error("Errore fotocamera", {
          description: "Impossibile avviare la fotocamera",
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
        stopScanner();
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
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          {/* Area Scanner */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
            {/* Video element per ZXing */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Overlay scanning box */}
            {isScanningRef.current && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-64 border-2 border-green-500 rounded-lg">
                  {/* Angoli del box */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500" />

                  {/* Linea di scansione animata */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5 bg-green-500 animate-pulse"
                    style={{ animation: "scan 2s ease-in-out infinite" }}
                  />
                </div>
              </div>
            )}

            {/* Pulsante Torcia */}
            {hasTorch && isScanningRef.current && !isLoading && (
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-4 right-4 pointer-events-auto"
                onClick={toggleTorch}
              >
                {torchEnabled ? (
                  <FlashlightOff className="h-4 w-4" />
                ) : (
                  <Flashlight className="h-4 w-4" />
                )}
              </Button>
            )}

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
                  <p className="text-sm font-medium mb-2">
                    Accesso fotocamera negato
                  </p>
                  <p className="text-xs text-slate-300">
                    Consenti l&apos;accesso alla fotocamera nelle impostazioni
                    del browser
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Nota: Richiede HTTPS per funzionare su PWA
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Istruzioni */}
          {isScanningRef.current && !isLoading && (
            <div className="text-center text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-medium">
                Inquadra il barcode nel riquadro verde
              </p>
              <p className="text-xs font-medium text-primary">
                📏 Tieni i barcode lineari in orizzontale per lettura più veloce
              </p>
              <p className="text-xs">
                💡 Assicurati che ci sia abbastanza luce
                {hasTorch && " o attiva la torcia"}
              </p>
              <p className="text-xs text-slate-500">
                1D: EAN, UPC, Code 128/39/93, ITF, Codabar, RSS
              </p>
              <p className="text-xs text-slate-500">
                2D: QR Code, DataMatrix, Aztec, PDF417, MaxiCode
              </p>
            </div>
          )}

          {/* Bottone Chiudi */}
          <Button variant="outline" className="w-full" onClick={handleClose}>
            Annulla
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
