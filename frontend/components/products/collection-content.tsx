"use client";

import { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  File,
  Download,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Trash2,
  FileImage,
  Edit,
  Star,
  Eye,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Maximize2,
  Minimize2,
  X,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return FileSpreadsheet;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return FileText;
  if (mimeType.includes("dwg") || mimeType.includes("drawing"))
    return FileImage;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

interface CollectionContentProps {
  collection: {
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    accepts: string;
    maxSize: number;
    maxFiles: number;
  };
  media: App.Data.ProductMediaData[];
  productId?: number;
  readOnly?: boolean;
  uploading?: boolean;
  onDrop: (files: File[]) => void;
  onDownload: (mediaItem: App.Data.ProductMediaData) => void;
  onDownloadZip?: (collectionKey: string) => void;
  onEdit: (mediaItem: App.Data.ProductMediaData) => void;
  onDelete: (mediaItem: App.Data.ProductMediaData) => void;
}

export function CollectionContent({
  collection,
  media,
  productId: _productId,
  readOnly = false,
  uploading = false,
  onDrop,
  onDownload,
  onDownloadZip,
  onEdit,
  onDelete,
}: CollectionContentProps) {
  const [previewMedia, setPreviewMedia] =
    useState<App.Data.ProductMediaData | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleView = (mediaItem: App.Data.ProductMediaData) => {
    if (
      mediaItem.mime_type?.includes("pdf") ||
      !mediaItem.mime_type?.startsWith("image/")
    ) {
      // Apri PDF e altri documenti in nuova tab
      window.open(mediaItem.url, "_blank");
    } else {
      // Apri immagini in modal
      setPreviewMedia(mediaItem);
      setZoom(100);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    }
  };

  const handleClosePreview = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setPreviewMedia(null);
    setZoom(100);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleReset = () => {
    setZoom(100);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Clamp pan quando cambia lo zoom
  useEffect(() => {
    if (zoom > 100 && imageContainerRef.current && imageRef.current) {
      const container = imageContainerRef.current;
      const img = imageRef.current;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const imgWidth = img.offsetWidth;
      const imgHeight = img.offsetHeight;

      const scale = zoom / 100;
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;

      const maxPanX = Math.max(0, (scaledWidth - containerWidth) / 2);
      const maxPanY = Math.max(0, (scaledHeight - containerHeight) / 2);

      setPan((prev) => ({
        x: Math.max(-maxPanX, Math.min(maxPanX, prev.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, prev.y)),
      }));
    } else if (zoom === 100) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 100) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (
      isDragging &&
      zoom > 100 &&
      imageContainerRef.current &&
      imageRef.current
    ) {
      const container = imageContainerRef.current;
      const img = imageRef.current;

      // Dimensioni del container
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Dimensioni effettive dell'immagine renderizzata (con object-contain)
      const imgWidth = img.offsetWidth;
      const imgHeight = img.offsetHeight;

      // Calcola le dimensioni con lo zoom applicato
      const scale = zoom / 100;
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;

      // Calcola i limiti del pan - quanto può spostarsi prima di mostrare lo sfondo
      const maxPanX = Math.max(0, (scaledWidth - containerWidth) / 2);
      const maxPanY = Math.max(0, (scaledHeight - containerHeight) / 2);

      // Calcola la nuova posizione con clamp
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      setPan({
        x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, newY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleFullscreen = async () => {
    if (!imageContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await imageContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: readOnly || uploading,
    maxSize: collection.maxSize,
    accept:
      collection.accepts === "*"
        ? {}
        : collection.accepts.split(",").reduce(
            (acc, type) => {
              acc[type.trim()] = [];
              return acc;
            },
            {} as Record<string, string[]>,
          ),
  });

  return (
    <div className="space-y-4">
      {media.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              File ({media.length})
            </Label>
            {collection.key !== "images" && onDownloadZip && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadZip(collection.key)}
              >
                <Archive className="mr-2 h-4 w-4" />
                Scarica ZIP
              </Button>
            )}
          </div>
          <div
            className={`grid gap-4 ${collection.key === "images" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}
          >
            {media.map((mediaItem) => {
              if (
                collection.key === "images" &&
                mediaItem.thumb_url &&
                mediaItem.thumb_url.startsWith("http")
              ) {
                // Image card with preview
                return (
                  <Card
                    key={mediaItem.id}
                    className="overflow-hidden group relative"
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={mediaItem.thumb_url}
                        alt={mediaItem.description || mediaItem.file_name || ""}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {mediaItem.is_primary && (
                        <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Principale
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(mediaItem)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onDownload(mediaItem)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {!readOnly && (
                          <>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onEdit(mediaItem)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onDelete(mediaItem)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {mediaItem.description && (
                      <CardContent className="p-3">
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {mediaItem.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                );
              } else {
                // Document card
                const FileIcon = getFileIcon(mediaItem.mime_type || "");
                return (
                  <Card key={mediaItem.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <FileIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {mediaItem.file_name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatFileSize(mediaItem.size || 0)} •{" "}
                          {mediaItem.created_at &&
                            new Date(mediaItem.created_at).toLocaleDateString(
                              "it-IT",
                            )}
                        </p>
                        {mediaItem.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {mediaItem.description}
                          </p>
                        )}
                        {mediaItem.valid_until && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Valido fino al{" "}
                            {new Date(mediaItem.valid_until).toLocaleDateString(
                              "it-IT",
                            )}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(mediaItem)}
                          title="Visualizza"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onDownload(mediaItem)}
                          title="Scarica"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {!readOnly && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onEdit(mediaItem)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                              onClick={() => onDelete(mediaItem)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              }
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <collection.icon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nessun file caricato
          </p>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewMedia} onOpenChange={handleClosePreview}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate max-w-[200px]">
                {previewMedia?.file_name}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  disabled={zoom <= 25}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-normal min-w-[50px] text-center text-muted-foreground">
                  {zoom}%
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoom(Math.min(300, zoom + 25))}
                  disabled={zoom >= 300}
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setRotation((rotation + 90) % 360)}
                  title="Ruota 90°"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  title="Reset"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFullscreen}
                  title={
                    isFullscreen ? "Esci da fullscreen (ESC)" : "Fullscreen"
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              {previewMedia?.description ||
                "Usa il mouse per trascinare quando è zoomata"}
            </DialogDescription>
          </DialogHeader>
          <div
            ref={imageContainerRef}
            className={`w-full flex items-center justify-center bg-black rounded-lg overflow-hidden ${zoom > 100 ? "cursor-move" : "cursor-default"} relative`}
            style={{ height: isFullscreen ? "100vh" : "70vh" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {previewMedia?.url ? (
              <img
                ref={imageRef}
                src={previewMedia.url}
                alt={previewMedia.description || previewMedia.file_name || ""}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: isDragging
                    ? "none"
                    : "transform 0.2s ease-in-out",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
                className="object-contain"
                draggable={false}
              />
            ) : (
              <p className="text-sm text-slate-500">
                URL immagine non disponibile
              </p>
            )}

            {/* Overlay controlli in fullscreen */}
            {isFullscreen && (
              <>
                {/* Bottone chiudi in alto a destra */}
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-4 right-4 z-50 bg-black/80 hover:bg-black/90 text-white border-white/20"
                  onClick={handleClosePreview}
                >
                  <X className="h-5 w-5" />
                </Button>

                {/* Barra controlli in basso */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/20">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    disabled={zoom <= 25}
                    className="text-white hover:bg-white/20"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-5 w-5" />
                  </Button>
                  <span className="text-sm font-medium min-w-[60px] text-center text-white">
                    {zoom}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(Math.min(300, zoom + 25))}
                    disabled={zoom >= 300}
                    className="text-white hover:bg-white/20"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </Button>
                  <div className="w-px h-6 bg-white/20 mx-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRotation((rotation + 90) % 360)}
                    className="text-white hover:bg-white/20"
                    title="Ruota 90°"
                  >
                    <RotateCw className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    className="text-white hover:bg-white/20"
                    title="Reset"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                  <div className="w-px h-6 bg-white/20 mx-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                    title="Esci da fullscreen (ESC)"
                  >
                    <Minimize2 className="h-5 w-5" />
                  </Button>
                </div>

                {/* Nome file in alto a sinistra */}
                <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <p className="text-sm font-medium text-white">
                    {previewMedia?.file_name}
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
