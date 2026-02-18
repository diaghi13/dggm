"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  settingsApi,
  featureFlagsApi,
  companySettingsApi,
  CompanySetting,
  SETTING_GROUPS,
  Setting,
} from "@/lib/api/settings";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  Settings,
  Building2,
  Bell,
  Package,
  FileText,
  Users,
  Shield,
  Plug,
  Save,
  RefreshCw,
  Mail,
  Palette,
  Flag,
  Layout,
  DollarSign,
  Loader2,
  Upload,
  X,
  MapPin,
  Phone,
  Camera,
  Stamp,
  Crop,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import {
  removeWhiteBackground,
  getCroppedBlob,
} from "@/lib/utils/image-processing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { toast } from "sonner";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const iconMap = {
  Settings,
  Building2,
  Bell,
  Package,
  FileText,
  Users,
  Shield,
  Plug,
  Mail,
  Palette,
  Flag,
  Layout,
  DollarSign,
  Receipt,
} as const;

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "general");
  const [changedSettings, setChangedSettings] = useState<
    Record<string, string>
  >({});

  // Sync activeTab with URL parameter
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  // Function to handle tab change and update URL
  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Company form state
  const [companyForm, setCompanyForm] = useState<Partial<CompanySetting>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Stamp & sigla state
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [siglaFile, setSiglaFile] = useState<File | null>(null);
  const [siglaPreview, setSiglaPreview] = useState<string | null>(null);
  const [cameraTarget, setCameraTarget] = useState<"stamp" | "sigla" | null>(
    null,
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropImageTarget, setCropImageTarget] = useState<
    "stamp" | "sigla" | null
  >(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [removeBackground, setRemoveBackground] = useState(true);

  const openCropDialog = (imageUrl: string, target: "stamp" | "sigla") => {
    setCropSource(imageUrl);
    setCropImageTarget(target);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropModalOpen(true);
  };

  const closeCropDialog = () => {
    setCropModalOpen(false);
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(null);
    setCropImageTarget(null);
  };

  const applyCrop = async () => {
    if (!cropSource || !croppedAreaPixels || !cropImageTarget) return;
    try {
      let blob = await getCroppedBlob(cropSource, croppedAreaPixels);
      if (removeBackground) {
        blob = await removeWhiteBackground(blob);
      }
      const file = new File([blob], `${cropImageTarget}.png`, {
        type: "image/png",
      });
      const preview = URL.createObjectURL(blob);
      if (cropImageTarget === "stamp") {
        setStampFile(file);
        setStampPreview(preview);
      } else {
        setSiglaFile(file);
        setSiglaPreview(preview);
      }
      closeCropDialog();
    } catch {
      toast.error("Errore nell'elaborazione dell'immagine");
    }
  };

  const openCamera = async (target: "stamp" | "sigla") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 },
      });
      streamRef.current = stream;
      setCameraTarget(target);
      // Attach stream after state update renders the video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      toast.error("Impossibile accedere alla fotocamera");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !cameraTarget) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    const target = cameraTarget;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      closeCamera();
      openCropDialog(url, target);
    }, "image/png");
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraTarget(null);
  };

  const onLogoDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onLogoDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".svg", ".webp"] },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024,
  });

  const onStampDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    openCropDialog(URL.createObjectURL(file), "stamp");
  }, []);

  const onSiglaDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    openCropDialog(URL.createObjectURL(file), "sigla");
  }, []);

  const {
    getRootProps: getStampRootProps,
    getInputProps: getStampInputProps,
    isDragActive: isStampDragActive,
  } = useDropzone({
    onDrop: onStampDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024,
  });

  const {
    getRootProps: getSiglaRootProps,
    getInputProps: getSiglaInputProps,
    isDragActive: isSiglaDragActive,
  } = useDropzone({
    onDrop: onSiglaDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024,
  });

  // Fetch all settings
  const { data: allSettings = [], isLoading } = useQuery({
    queryKey: ["settings", "all"],
    queryFn: () => settingsApi.getAll(),
  });

  // Fetch feature flags
  const { data: featureFlags = [], isLoading: isLoadingFlags } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: () => featureFlagsApi.getAll(),
  });

  // Fetch company settings
  const { data: companySettings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: companySettingsApi.get,
  });

  const backendBase = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
  ).replace("/api/v1", "");

  // Populate company form when data loads
  useEffect(() => {
    if (companySettings) {
      setCompanyForm(companySettings);
      const logo = companySettings["company.logo"];
      if (logo) {
        setLogoPreview(
          logo.startsWith("http") ? logo : `${backendBase}${logo}`,
        );
      }
      const stamp = companySettings["company.stamp"];
      if (stamp) {
        setStampPreview(
          stamp.startsWith("http") ? stamp : `${backendBase}${stamp}`,
        );
      }
      const sigla = companySettings["company.sigla"];
      if (sigla) {
        setSiglaPreview(
          sigla.startsWith("http") ? sigla : `${backendBase}${sigla}`,
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companySettings]);

  // Delete company logo mutation
  const deleteLogoMutation = useMutation({
    mutationFn: () => apiClient.delete("/settings/company/logo"),
    onSuccess: () => {
      setLogoPreview(null);
      setLogoFile(null);
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      toast.success("Logo eliminato");
    },
    onError: () => toast.error("Errore nell'eliminazione del logo"),
  });

  const deleteStampMutation = useMutation({
    mutationFn: () => apiClient.delete("/settings/company/image/stamp"),
    onSuccess: () => {
      setStampPreview(null);
      setStampFile(null);
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      toast.success("Timbro eliminato");
    },
    onError: () => toast.error("Errore nell'eliminazione del timbro"),
  });

  const deleteSiglaMutation = useMutation({
    mutationFn: () => apiClient.delete("/settings/company/image/sigla"),
    onSuccess: () => {
      setSiglaPreview(null);
      setSiglaFile(null);
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      toast.success("Sigla eliminata");
    },
    onError: () => toast.error("Errore nell'eliminazione della sigla"),
  });

  // Save company settings mutation
  const saveCompanyMutation = useMutation({
    mutationFn: async () => {
      // Exclude image keys — they are managed by dedicated endpoints
      const imageKeys = new Set([
        "company.logo",
        "company.stamp",
        "company.sigla",
      ]);
      const textForm = Object.fromEntries(
        Object.entries(companyForm).filter(([key]) => !imageKeys.has(key)),
      ) as Partial<CompanySetting>;
      await companySettingsApi.update(textForm);
      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        await apiClient.post("/settings/company/logo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      if (stampFile) {
        const fd = new FormData();
        fd.append("image", stampFile);
        await apiClient.post("/settings/company/image/stamp", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      if (siglaFile) {
        const fd = new FormData();
        fd.append("image", siglaFile);
        await apiClient.post("/settings/company/image/sigla", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      setLogoFile(null);
      setStampFile(null);
      setSiglaFile(null);
      toast.success("Impostazioni azienda salvate");
    },
    onError: () => toast.error("Errore nel salvataggio"),
  });

  // Bulk update settings mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: settingsApi.bulkUpdate,
    onMutate: async (newSettings) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["settings"] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData(["settings", "all"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["settings", "all"], (old: Setting[]) => {
        if (!old) return old;
        return old.map((setting) => {
          const update = newSettings.find((s) => s.key === setting.key);
          return update ? { ...setting, value: update.value } : setting;
        });
      });

      return { previousSettings };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setChangedSettings({});
      // Refresh auth store to get updated settings
      await refreshUser();
      toast.success("Impostazioni salvate con successo");
    },
    onError: (error: unknown, _newSettings, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(["settings", "all"], context.previousSettings);
      }
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message || "Impossibile salvare le impostazioni",
      });
    },
  });

  // Toggle feature flag mutation
  const toggleFeatureMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      featureFlagsApi.toggle(key, enabled),
    onMutate: async ({ key, enabled }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["feature-flags"] });

      // Snapshot the previous value
      const previousFlags = queryClient.getQueryData(["feature-flags"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["feature-flags"], (old: Setting[]) => {
        if (!old) return old;
        return old.map((flag) =>
          flag.key === key
            ? { ...flag, value: enabled ? "true" : "false" }
            : flag,
        );
      });

      return { previousFlags };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      // Refresh auth store to get updated settings
      await refreshUser();
      toast.success("Feature flag aggiornata");
    },
    onError: (error: unknown, _variables, context) => {
      // Rollback on error
      if (context?.previousFlags) {
        queryClient.setQueryData(["feature-flags"], context.previousFlags);
      }
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message ||
          "Impossibile aggiornare la feature flag",
      });
    },
  });

  const handleSettingChange = (key: string, value: string) => {
    setChangedSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveQuotesTab = () => {
    const settingsToUpdate = Object.entries(changedSettings)
      .filter(([key]) => {
        if (key === "company.quote_template") return true;
        const setting = allSettings.find((s: Setting) => s.key === key);
        return setting?.group === "quotes";
      })
      .map(([key, value]) => ({ key, value }));

    if (settingsToUpdate.length === 0) {
      toast.info("Nessuna modifica da salvare");
      return;
    }
    bulkUpdateMutation.mutate(settingsToUpdate);
  };

  const handleSaveSettings = (group: string) => {
    const settingsToUpdate = Object.entries(changedSettings)
      .filter(([key]) => {
        const setting = allSettings.find((s: Setting) => s.key === key);
        return setting?.group === group;
      })
      .map(([key, value]) => ({ key, value }));

    if (settingsToUpdate.length === 0) {
      toast.info("Nessuna modifica da salvare");
      return;
    }

    bulkUpdateMutation.mutate(settingsToUpdate);
  };

  const getSettingsByGroup = (group: string): Setting[] => {
    return allSettings.filter((s: Setting) => s.group === group);
  };

  const getSettingValue = (key: string) => {
    if (changedSettings[key] !== undefined) {
      return changedSettings[key];
    }
    const setting = allSettings.find((s: Setting) => s.key === key);
    return setting?.value || "";
  };

  const renderSettingInput = (setting: Setting) => {
    const value = getSettingValue(setting.key);
    const displayName = setting.description || setting.key;

    switch (setting.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={setting.key}
              checked={value === "true" || value === "1"}
              onCheckedChange={(checked) =>
                handleSettingChange(setting.key, checked ? "true" : "false")
              }
            />
            <Label htmlFor={setting.key} className="cursor-pointer">
              {displayName}
            </Label>
          </div>
        );

      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Input
              id={setting.key}
              type="number"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              min={setting.min_value ?? undefined}
              max={setting.max_value ?? undefined}
            />
            {(setting.min_value !== null || setting.max_value !== null) && (
              <p className="text-xs text-muted-foreground">
                {setting.min_value !== null && `Min: ${setting.min_value}`}
                {setting.min_value !== null &&
                  setting.max_value !== null &&
                  " - "}
                {setting.max_value !== null && `Max: ${setting.max_value}`}
              </p>
            )}
          </div>
        );

      case "email":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Input
              id={setting.key}
              type="email"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              placeholder="example@domain.com"
            />
          </div>
        );

      case "url":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Input
              id={setting.key}
              type="url"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        );

      case "color":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <div className="flex items-center gap-2">
              <Input
                id={setting.key}
                type="color"
                value={value || "#000000"}
                onChange={(e) =>
                  handleSettingChange(setting.key, e.target.value)
                }
                className="h-10 w-20 cursor-pointer"
              />
              <Input
                type="text"
                value={value}
                onChange={(e) =>
                  handleSettingChange(setting.key, e.target.value)
                }
                placeholder="#000000"
                className="flex-1 font-mono"
              />
            </div>
          </div>
        );

      case "date":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Input
              id={setting.key}
              type="date"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            />
          </div>
        );

      case "datetime":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Input
              id={setting.key}
              type="datetime-local"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            />
          </div>
        );

      case "enum":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Select
              value={value}
              onValueChange={(newValue) =>
                handleSettingChange(setting.key, newValue)
              }
            >
              <SelectTrigger id={setting.key}>
                <SelectValue placeholder="Seleziona un'opzione" />
              </SelectTrigger>
              <SelectContent>
                {setting.allowed_values?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "json":
        // Check if it's an array (try to parse and see)
        let isArray = false;
        let arrayValues: string[] = [];
        try {
          const parsed = JSON.parse(value || "[]");
          if (Array.isArray(parsed)) {
            isArray = true;
            arrayValues = parsed;
          }
        } catch {
          // Not valid JSON or not array
        }

        if (isArray) {
          // Render multi-select for arrays
          return (
            <div className="space-y-2">
              <Label htmlFor={setting.key}>{displayName}</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10">
                {arrayValues.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newArray = arrayValues.filter(
                          (_, i) => i !== index,
                        );
                        handleSettingChange(
                          setting.key,
                          JSON.stringify(newArray),
                        );
                      }}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id={`${setting.key}-new`}
                  placeholder="Aggiungi nuovo valore..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const input = e.currentTarget;
                      const newValue = input.value.trim();
                      if (newValue && !arrayValues.includes(newValue)) {
                        const newArray = [...arrayValues, newValue];
                        handleSettingChange(
                          setting.key,
                          JSON.stringify(newArray),
                        );
                        input.value = "";
                      }
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Premi Invio per aggiungere un valore
              </p>
            </div>
          );
        }

        // Standard JSON textarea for objects
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Textarea
              id={setting.key}
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Formato JSON valido richiesto
            </p>
          </div>
        );

      case "file":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Input
              id={setting.key}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // TODO: Implement file upload logic
                  handleSettingChange(setting.key, file.name);
                  toast.info("Upload file non ancora implementato");
                }
              }}
            />
            {value && (
              <p className="text-sm text-muted-foreground">File: {value}</p>
            )}
          </div>
        );

      default: // string
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Input
              id={setting.key}
              type="text"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            />
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="space-y-2">
          <div className="h-10 w-64 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
          <div className="h-5 w-96 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="h-150 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  const hasChanges = Object.keys(changedSettings).length > 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-7 w-7" />
          Impostazioni Sistema
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Configura le impostazioni globali del sistema
        </p>
      </div>

      {/* Layout: Sidebar + Contenuto */}
      <div className="flex gap-0 md:gap-6">
        {/* Sidebar verticale */}
        <SettingsSidebar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Contenuto principale */}
        <main className="flex-1 min-w-0 w-full">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            {/* Company Settings Tab */}
            <TabsContent value="company" className="space-y-4 mt-0">
              <div className="space-y-6">
                {/* Dati Aziendali + Logo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-4 w-4" />
                      Dati Aziendali
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Logo upload */}
                      <div className="space-y-3">
                        <Label>Logo Aziendale</Label>
                        {logoPreview ? (
                          <div className="relative border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={logoPreview}
                              alt="Logo"
                              className="h-24 mx-auto object-contain rounded"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-950/30 dark:hover:bg-red-900/50 text-red-600"
                              disabled={deleteLogoMutation.isPending}
                              onClick={() => {
                                if (logoFile) {
                                  // File selezionato ma non ancora caricato: basta pulire lo stato locale
                                  setLogoPreview(null);
                                  setLogoFile(null);
                                } else {
                                  // Logo salvato sul server: chiama il backend
                                  deleteLogoMutation.mutate();
                                }
                              }}
                            >
                              {deleteLogoMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                              isDragActive
                                ? "border-primary bg-primary/5"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                            }`}
                          >
                            <input {...getInputProps()} />
                            <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {isDragActive
                                ? "Rilascia il file qui..."
                                : "Trascina o clicca per caricare"}
                            </span>
                            <span className="block text-xs text-slate-400 dark:text-slate-500 mt-1">
                              PNG, JPG, SVG max 2MB
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Dati legali */}
                      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2 space-y-2">
                          <Label>Ragione Sociale *</Label>
                          <Input
                            value={companyForm["company.name"] ?? ""}
                            onChange={(e) =>
                              setCompanyForm((p) => ({
                                ...p,
                                "company.name": e.target.value,
                              }))
                            }
                            placeholder="DGGM S.r.l."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Partita IVA</Label>
                          <Input
                            value={companyForm["company.vat"] ?? ""}
                            onChange={(e) =>
                              setCompanyForm((p) => ({
                                ...p,
                                "company.vat": e.target.value,
                              }))
                            }
                            placeholder="IT12345678901"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Codice Fiscale</Label>
                          <Input
                            value={companyForm["company.fiscal_code"] ?? ""}
                            onChange={(e) =>
                              setCompanyForm((p) => ({
                                ...p,
                                "company.fiscal_code": e.target.value,
                              }))
                            }
                            placeholder="12345678901"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Indirizzo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="h-4 w-4" />
                      Indirizzo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                      <div className="sm:col-span-6 space-y-2">
                        <Label>Indirizzo</Label>
                        <Input
                          value={companyForm["company.address"] ?? ""}
                          onChange={(e) =>
                            setCompanyForm((p) => ({
                              ...p,
                              "company.address": e.target.value,
                            }))
                          }
                          placeholder="Via Roma 1"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label>CAP</Label>
                        <Input
                          value={companyForm["company.postal_code"] ?? ""}
                          onChange={(e) =>
                            setCompanyForm((p) => ({
                              ...p,
                              "company.postal_code": e.target.value,
                            }))
                          }
                          placeholder="20100"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label>Città</Label>
                        <Input
                          value={companyForm["company.city"] ?? ""}
                          onChange={(e) =>
                            setCompanyForm((p) => ({
                              ...p,
                              "company.city": e.target.value,
                            }))
                          }
                          placeholder="Milano"
                        />
                      </div>
                      <div className="sm:col-span-1 space-y-2">
                        <Label>Prov.</Label>
                        <Input
                          value={companyForm["company.province"] ?? ""}
                          onChange={(e) =>
                            setCompanyForm((p) => ({
                              ...p,
                              "company.province": e.target.value,
                            }))
                          }
                          placeholder="MI"
                          maxLength={2}
                        />
                      </div>
                      <div className="sm:col-span-1 space-y-2">
                        <Label>Paese</Label>
                        <Input
                          value={companyForm["company.country"] ?? "IT"}
                          onChange={(e) =>
                            setCompanyForm((p) => ({
                              ...p,
                              "company.country": e.target.value,
                            }))
                          }
                          placeholder="IT"
                          maxLength={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contatti */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Phone className="h-4 w-4" />
                      Contatti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Telefono</Label>
                        <Input
                          value={companyForm["company.phone"] ?? ""}
                          onChange={(e) =>
                            setCompanyForm((p) => ({
                              ...p,
                              "company.phone": e.target.value,
                            }))
                          }
                          placeholder="+39 02 1234567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={companyForm["company.email"] ?? ""}
                          onChange={(e) =>
                            setCompanyForm((p) => ({
                              ...p,
                              "company.email": e.target.value,
                            }))
                          }
                          placeholder="info@azienda.it"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sito Web</Label>
                        <Input
                          value={companyForm["company.website"] ?? ""}
                          onChange={(e) =>
                            setCompanyForm((p) => ({
                              ...p,
                              "company.website": e.target.value,
                            }))
                          }
                          placeholder="www.azienda.it"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timbro & Firma */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Stamp className="h-4 w-4" />
                      Timbro & Firma
                    </CardTitle>
                    <CardDescription>
                      PNG/JPG su sfondo bianco — sfondo rimosso automaticamente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Timbro e Firma */}
                      <div className="space-y-3">
                        <Label>Timbro e Firma</Label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
                          Usato nel PDF dei preventivi
                        </p>
                        {stampPreview ? (
                          <div
                            className="relative border-2 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center"
                            style={{
                              background:
                                "repeating-conic-gradient(#e2e8f0 0% 25%, white 0% 50%) 0 / 16px 16px",
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={stampPreview}
                              alt="Timbro"
                              className="h-24 mx-auto object-contain"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-950/30 dark:hover:bg-red-900/50 text-red-600"
                              disabled={deleteStampMutation.isPending}
                              onClick={() => {
                                if (stampFile) {
                                  setStampPreview(null);
                                  setStampFile(null);
                                } else {
                                  deleteStampMutation.mutate();
                                }
                              }}
                            >
                              {deleteStampMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div
                              {...getStampRootProps()}
                              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                                isStampDragActive
                                  ? "border-primary bg-primary/5"
                                  : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                              }`}
                            >
                              <input {...getStampInputProps()} />
                              <Upload className="h-7 w-7 mx-auto text-slate-400 mb-2" />
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                {isStampDragActive
                                  ? "Rilascia qui..."
                                  : "Trascina o clicca"}
                              </span>
                              <span className="block text-xs text-slate-400 mt-1">
                                PNG, JPG max 4MB
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full gap-2"
                              onClick={() => openCamera("stamp")}
                            >
                              <Camera className="h-4 w-4" />
                              Scatta con fotocamera
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Sigla Aziendale */}
                      <div className="space-y-3">
                        <Label>Sigla Aziendale</Label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
                          Per utilizzi specifici (es. documenti interni, DDT)
                        </p>
                        {siglaPreview ? (
                          <div
                            className="relative border-2 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center"
                            style={{
                              background:
                                "repeating-conic-gradient(#e2e8f0 0% 25%, white 0% 50%) 0 / 16px 16px",
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={siglaPreview}
                              alt="Sigla"
                              className="h-24 mx-auto object-contain"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-950/30 dark:hover:bg-red-900/50 text-red-600"
                              disabled={deleteSiglaMutation.isPending}
                              onClick={() => {
                                if (siglaFile) {
                                  setSiglaPreview(null);
                                  setSiglaFile(null);
                                } else {
                                  deleteSiglaMutation.mutate();
                                }
                              }}
                            >
                              {deleteSiglaMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div
                              {...getSiglaRootProps()}
                              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                                isSiglaDragActive
                                  ? "border-primary bg-primary/5"
                                  : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                              }`}
                            >
                              <input {...getSiglaInputProps()} />
                              <Upload className="h-7 w-7 mx-auto text-slate-400 mb-2" />
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                {isSiglaDragActive
                                  ? "Rilascia qui..."
                                  : "Trascina o clicca"}
                              </span>
                              <span className="block text-xs text-slate-400 mt-1">
                                PNG, JPG max 4MB
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full gap-2"
                              onClick={() => openCamera("sigla")}
                            >
                              <Camera className="h-4 w-4" />
                              Scatta con fotocamera
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Camera Dialog */}
                <Dialog
                  open={cameraTarget !== null}
                  onOpenChange={(open) => {
                    if (!open) closeCamera();
                  }}
                >
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {cameraTarget === "stamp"
                          ? "Scatta Timbro e Firma"
                          : "Scatta Sigla"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="rounded-lg overflow-hidden bg-black">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full max-h-96 object-contain"
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={closeCamera}>
                          Annulla
                        </Button>
                        <Button onClick={capturePhoto} className="gap-2">
                          <Camera className="h-4 w-4" />
                          Cattura e ritaglia
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Crop Dialog */}
                <Dialog
                  open={cropModalOpen}
                  onOpenChange={(open) => {
                    if (!open) closeCropDialog();
                  }}
                >
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Crop className="h-4 w-4" />
                        Ritaglia immagine
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Cropper area */}
                      <div className="relative h-80 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                        {cropSource && (
                          <Cropper
                            image={cropSource}
                            crop={crop}
                            zoom={zoom}
                            aspect={undefined}
                            objectFit="contain"
                            minZoom={0.1}
                            maxZoom={5}
                            restrictPosition={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={(_, area) =>
                              setCroppedAreaPixels(area)
                            }
                          />
                        )}
                      </div>

                      {/* Zoom slider */}
                      <div className="flex items-center gap-3">
                        <Label className="text-sm shrink-0">Zoom</Label>
                        <input
                          type="range"
                          min={0.1}
                          max={5}
                          step={0.05}
                          value={zoom}
                          onChange={(e) => setZoom(Number(e.target.value))}
                          className="flex-1 accent-primary"
                        />
                      </div>

                      {/* Background removal toggle */}
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <Switch
                          id="remove-bg"
                          checked={removeBackground}
                          onCheckedChange={setRemoveBackground}
                        />
                        <div>
                          <Label
                            htmlFor="remove-bg"
                            className="text-sm cursor-pointer font-medium"
                          >
                            Rimuovi sfondo bianco
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Disattiva se l&apos;immagine ha già lo sfondo
                            trasparente
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={closeCropDialog}>
                          Annulla
                        </Button>
                        <Button onClick={applyCrop} className="gap-2">
                          <Crop className="h-4 w-4" />
                          Applica
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex justify-end">
                  <Button
                    onClick={() => saveCompanyMutation.mutate()}
                    disabled={saveCompanyMutation.isPending}
                  >
                    {saveCompanyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salva Impostazioni Azienda
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Preventivi Tab */}
            <TabsContent value="quotes" className="space-y-6 mt-0">
              {/* 1. Template PDF */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="h-4 w-4" />
                    Template PDF
                  </CardTitle>
                  <CardDescription>
                    Scegli il layout grafico usato per generare i preventivi in
                    PDF
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        key: "modern" as const,
                        label: "Modern",
                        desc: "Professionale con header bicolonna, tabella su sfondo scuro e totali blu",
                        svg: (
                          <svg
                            viewBox="0 0 160 120"
                            className="w-full h-full"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              x="0"
                              y="0"
                              width="160"
                              height="120"
                              fill="#f8fafc"
                            />
                            {/* Header left: logo placeholder */}
                            <rect
                              x="6"
                              y="5"
                              width="18"
                              height="13"
                              fill="#dbeafe"
                              rx="2"
                            />
                            <rect
                              x="6"
                              y="6.5"
                              width="18"
                              height="9"
                              fill="#3b82f6"
                              rx="1.5"
                              opacity="0.45"
                            />
                            {/* Header left: company text */}
                            <rect
                              x="28"
                              y="6"
                              width="35"
                              height="3"
                              fill="#1e293b"
                              rx="1"
                            />
                            <rect
                              x="28"
                              y="11"
                              width="24"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="28"
                              y="14"
                              width="28"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            {/* Header right: quote info */}
                            <rect
                              x="104"
                              y="5"
                              width="22"
                              height="3.5"
                              fill="#1e293b"
                              rx="1"
                            />
                            <rect
                              x="104"
                              y="11"
                              width="38"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="104"
                              y="14"
                              width="30"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            {/* Separator */}
                            <rect
                              x="6"
                              y="22"
                              width="148"
                              height="1"
                              fill="#e2e8f0"
                            />
                            {/* Client/project row */}
                            <rect
                              x="6"
                              y="27"
                              width="26"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="6"
                              y="31"
                              width="40"
                              height="2.5"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="6"
                              y="35"
                              width="30"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="92"
                              y="27"
                              width="20"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="92"
                              y="31"
                              width="30"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="92"
                              y="35"
                              width="24"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            {/* Table header: dark slate */}
                            <rect
                              x="6"
                              y="43"
                              width="148"
                              height="8"
                              fill="#1e293b"
                              rx="1.5"
                            />
                            <rect
                              x="9"
                              y="46"
                              width="22"
                              height="2.5"
                              fill="#ffffff"
                              opacity="0.5"
                              rx="1"
                            />
                            <rect
                              x="80"
                              y="46"
                              width="18"
                              height="2.5"
                              fill="#ffffff"
                              opacity="0.5"
                              rx="1"
                            />
                            <rect
                              x="126"
                              y="46"
                              width="24"
                              height="2.5"
                              fill="#ffffff"
                              opacity="0.5"
                              rx="1"
                            />
                            {/* Table rows */}
                            <rect
                              x="6"
                              y="52"
                              width="148"
                              height="7"
                              fill="#f8fafc"
                            />
                            <rect
                              x="6"
                              y="52"
                              width="148"
                              height="0.5"
                              fill="#e2e8f0"
                            />
                            <rect
                              x="9"
                              y="54.5"
                              width="30"
                              height="2"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="126"
                              y="54.5"
                              width="24"
                              height="2"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="6"
                              y="59"
                              width="148"
                              height="7"
                              fill="#ffffff"
                            />
                            <rect
                              x="6"
                              y="59"
                              width="148"
                              height="0.5"
                              fill="#e2e8f0"
                            />
                            <rect
                              x="9"
                              y="61.5"
                              width="24"
                              height="2"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="126"
                              y="61.5"
                              width="24"
                              height="2"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="6"
                              y="66"
                              width="148"
                              height="7"
                              fill="#f8fafc"
                            />
                            <rect
                              x="6"
                              y="66"
                              width="148"
                              height="0.5"
                              fill="#e2e8f0"
                            />
                            <rect
                              x="9"
                              y="68.5"
                              width="28"
                              height="2"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="126"
                              y="68.5"
                              width="24"
                              height="2"
                              fill="#334155"
                              rx="1"
                            />
                            {/* Totals box right: blue */}
                            <rect
                              x="88"
                              y="80"
                              width="66"
                              height="32"
                              fill="#eff6ff"
                              rx="2.5"
                            />
                            <rect
                              x="91"
                              y="84"
                              width="28"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="141"
                              y="84"
                              width="10"
                              height="2"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="91"
                              y="88.5"
                              width="20"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="143"
                              y="88.5"
                              width="8"
                              height="2"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="88"
                              y="94"
                              width="66"
                              height="10"
                              fill="#3b82f6"
                              rx="2"
                            />
                            <rect
                              x="92"
                              y="97.5"
                              width="16"
                              height="2.5"
                              fill="#ffffff"
                              rx="1"
                            />
                            <rect
                              x="140"
                              y="97.5"
                              width="10"
                              height="2.5"
                              fill="#ffffff"
                              rx="1"
                            />
                          </svg>
                        ),
                      },
                      {
                        key: "classic" as const,
                        label: "Classic",
                        desc: "Elegante con header centrato, bordo emerald e tabella bordata",
                        svg: (
                          <svg
                            viewBox="0 0 160 120"
                            className="w-full h-full"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              x="0"
                              y="0"
                              width="160"
                              height="120"
                              fill="#fafaf9"
                            />
                            {/* Centered header: logo */}
                            <rect
                              x="64"
                              y="4"
                              width="32"
                              height="11"
                              fill="#d1fae5"
                              rx="1.5"
                            />
                            <rect
                              x="64"
                              y="5.5"
                              width="32"
                              height="7"
                              fill="#6ee7b7"
                              rx="1"
                              opacity="0.45"
                            />
                            {/* Company name centered */}
                            <rect
                              x="42"
                              y="17"
                              width="76"
                              height="3.5"
                              fill="#065f46"
                              rx="1"
                            />
                            <rect
                              x="50"
                              y="22"
                              width="60"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                              opacity="0.8"
                            />
                            <rect
                              x="58"
                              y="25.5"
                              width="44"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                              opacity="0.7"
                            />
                            {/* Emerald underline */}
                            <rect
                              x="6"
                              y="30.5"
                              width="148"
                              height="1.5"
                              fill="#059669"
                            />
                            {/* Quote details box: stone bg + border */}
                            <rect
                              x="6"
                              y="34"
                              width="148"
                              height="22"
                              fill="#f5f5f4"
                              stroke="#d1d5db"
                              strokeWidth="0.7"
                              rx="1.5"
                            />
                            <rect
                              x="10"
                              y="38"
                              width="26"
                              height="2"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="10"
                              y="42"
                              width="40"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="10"
                              y="46"
                              width="32"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="92"
                              y="38"
                              width="24"
                              height="2"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="92"
                              y="42"
                              width="36"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="92"
                              y="46"
                              width="28"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            {/* Table: full border, emerald header */}
                            <rect
                              x="6"
                              y="60"
                              width="148"
                              height="7"
                              fill="#d1fae5"
                              stroke="#d1d5db"
                              strokeWidth="0.5"
                            />
                            <rect
                              x="9"
                              y="63"
                              width="24"
                              height="2"
                              fill="#065f46"
                              rx="1"
                            />
                            <rect
                              x="90"
                              y="63"
                              width="18"
                              height="2"
                              fill="#065f46"
                              rx="1"
                            />
                            <rect
                              x="130"
                              y="63"
                              width="20"
                              height="2"
                              fill="#065f46"
                              rx="1"
                            />
                            <rect
                              x="6"
                              y="67"
                              width="148"
                              height="5.5"
                              stroke="#d1d5db"
                              strokeWidth="0.5"
                              fill="#ffffff"
                            />
                            <rect
                              x="9"
                              y="69.5"
                              width="28"
                              height="1.8"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="130"
                              y="69.5"
                              width="20"
                              height="1.8"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="6"
                              y="72.5"
                              width="148"
                              height="5.5"
                              stroke="#d1d5db"
                              strokeWidth="0.5"
                              fill="#ffffff"
                            />
                            <rect
                              x="9"
                              y="75"
                              width="22"
                              height="1.8"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="130"
                              y="75"
                              width="20"
                              height="1.8"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="6"
                              y="78"
                              width="148"
                              height="5.5"
                              stroke="#d1d5db"
                              strokeWidth="0.5"
                              fill="#ffffff"
                            />
                            {/* Totals: stone box right */}
                            <rect
                              x="86"
                              y="88"
                              width="68"
                              height="22"
                              fill="#f5f5f4"
                              stroke="#d1d5db"
                              strokeWidth="0.5"
                              rx="1.5"
                            />
                            <rect
                              x="89"
                              y="92"
                              width="22"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="141"
                              y="92"
                              width="10"
                              height="2"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="89"
                              y="97"
                              width="18"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="137"
                              y="97"
                              width="14"
                              height="2.5"
                              fill="#065f46"
                              rx="1"
                            />
                            <rect
                              x="86"
                              y="102.5"
                              width="68"
                              height="1"
                              fill="#059669"
                            />
                          </svg>
                        ),
                      },
                      {
                        key: "minimal" as const,
                        label: "Minimal",
                        desc: "Essenziale in monospace con riga totale nera",
                        svg: (
                          <svg
                            viewBox="0 0 160 120"
                            className="w-full h-full"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              x="0"
                              y="0"
                              width="160"
                              height="120"
                              fill="#ffffff"
                            />
                            {/* Big "PREVENTIVO." block left */}
                            <rect
                              x="6"
                              y="5"
                              width="68"
                              height="10"
                              fill="#111827"
                              rx="1.5"
                            />
                            <rect
                              x="6"
                              y="17"
                              width="44"
                              height="3"
                              fill="#374151"
                              rx="1"
                            />
                            {/* Company info right */}
                            <rect
                              x="110"
                              y="6"
                              width="36"
                              height="2.5"
                              fill="#1e293b"
                              rx="1"
                            />
                            <rect
                              x="110"
                              y="11"
                              width="26"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="110"
                              y="15"
                              width="30"
                              height="2"
                              fill="#94a3b8"
                              rx="1"
                            />
                            {/* Bold border-b-4 */}
                            <rect
                              x="6"
                              y="23"
                              width="148"
                              height="3.5"
                              fill="#000000"
                            />
                            {/* Cliente / Progetto */}
                            <rect
                              x="6"
                              y="30"
                              width="32"
                              height="1.5"
                              fill="#000000"
                              rx="1"
                            />
                            <rect
                              x="6"
                              y="33"
                              width="22"
                              height="2"
                              fill="#334155"
                              rx="1"
                            />
                            <rect
                              x="6"
                              y="37"
                              width="30"
                              height="1.8"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="82"
                              y="30"
                              width="28"
                              height="1.5"
                              fill="#000000"
                              rx="1"
                            />
                            <rect
                              x="82"
                              y="33"
                              width="24"
                              height="1.8"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="82"
                              y="37"
                              width="18"
                              height="1.8"
                              fill="#94a3b8"
                              rx="1"
                            />
                            {/* Table: flex-divider header */}
                            <rect
                              x="6"
                              y="44"
                              width="148"
                              height="2"
                              fill="#000000"
                            />
                            <rect
                              x="6"
                              y="47"
                              width="52"
                              height="1.8"
                              fill="#94a3b8"
                              rx="1"
                            />
                            <rect
                              x="120"
                              y="47"
                              width="30"
                              height="1.8"
                              fill="#94a3b8"
                              rx="1"
                            />
                            {/* Rows */}
                            <rect
                              x="6"
                              y="50.5"
                              width="148"
                              height="0.6"
                              fill="#e5e7eb"
                            />
                            <rect
                              x="6"
                              y="52"
                              width="50"
                              height="1.8"
                              fill="#111827"
                              rx="1"
                            />
                            <rect
                              x="120"
                              y="52"
                              width="30"
                              height="1.8"
                              fill="#111827"
                              rx="1"
                            />
                            <rect
                              x="6"
                              y="55.5"
                              width="148"
                              height="0.6"
                              fill="#e5e7eb"
                            />
                            <rect
                              x="6"
                              y="57"
                              width="40"
                              height="1.8"
                              fill="#111827"
                              rx="1"
                            />
                            <rect
                              x="120"
                              y="57"
                              width="30"
                              height="1.8"
                              fill="#111827"
                              rx="1"
                            />
                            <rect
                              x="6"
                              y="60.5"
                              width="148"
                              height="0.6"
                              fill="#e5e7eb"
                            />
                            <rect
                              x="6"
                              y="62"
                              width="46"
                              height="1.8"
                              fill="#111827"
                              rx="1"
                            />
                            <rect
                              x="120"
                              y="62"
                              width="30"
                              height="1.8"
                              fill="#111827"
                              rx="1"
                            />
                            {/* Section row */}
                            <rect
                              x="6"
                              y="65.5"
                              width="148"
                              height="5.5"
                              fill="#f9fafb"
                            />
                            <rect
                              x="6"
                              y="65.5"
                              width="148"
                              height="0.6"
                              fill="#000000"
                            />
                            <rect
                              x="9"
                              y="67.5"
                              width="30"
                              height="2"
                              fill="#000000"
                              rx="1"
                            />
                            {/* Totals */}
                            <rect
                              x="80"
                              y="76"
                              width="74"
                              height="2.5"
                              fill="#d1d5db"
                              rx="1"
                            />
                            <rect
                              x="80"
                              y="81"
                              width="74"
                              height="2.5"
                              fill="#d1d5db"
                              rx="1"
                            />
                            {/* Black total bar */}
                            <rect
                              x="80"
                              y="87"
                              width="74"
                              height="14"
                              fill="#000000"
                              rx="1.5"
                            />
                            <rect
                              x="84"
                              y="92"
                              width="22"
                              height="3.5"
                              fill="#ffffff"
                              rx="1"
                            />
                            <rect
                              x="140"
                              y="92"
                              width="10"
                              height="3.5"
                              fill="#ffffff"
                              rx="1"
                            />
                          </svg>
                        ),
                      },
                    ].map((tpl) => {
                      const selectedKey =
                        getSettingValue("company.quote_template") || "modern";
                      const isSelected = selectedKey === tpl.key;
                      return (
                        <button
                          key={tpl.key}
                          type="button"
                          onClick={() =>
                            handleSettingChange(
                              "company.quote_template",
                              tpl.key,
                            )
                          }
                          className={`group relative rounded-xl border-2 p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                            isSelected
                              ? "border-primary shadow-sm"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-2 right-2 flex items-center gap-1 text-xs font-medium text-primary">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Attivo
                            </span>
                          )}
                          <div
                            className={`w-full aspect-[4/3] rounded-lg overflow-hidden border mb-3 bg-white transition-colors ${
                              isSelected
                                ? "border-primary/30"
                                : "border-slate-100 dark:border-slate-800"
                            }`}
                          >
                            {tpl.svg}
                          </div>
                          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                            {tpl.label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                            {tpl.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* 2. Numerazione preventivi */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Numerazione preventivi
                  </CardTitle>
                  <CardDescription>
                    Formato del codice generato automaticamente per ogni
                    preventivo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code_prefix">Prefisso</Label>
                      <Input
                        id="code_prefix"
                        value={getSettingValue("quotes.code_prefix")}
                        onChange={(e) =>
                          handleSettingChange(
                            "quotes.code_prefix",
                            e.target.value.toUpperCase(),
                          )
                        }
                        placeholder="PREV"
                        className="font-mono uppercase"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Testo fisso all&apos;inizio del codice (es. PREV, PRV,
                        OFF)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code_format">Formato codice</Label>
                      <Input
                        id="code_format"
                        value={getSettingValue("quotes.code_format")}
                        onChange={(e) =>
                          handleSettingChange(
                            "quotes.code_format",
                            e.target.value,
                          )
                        }
                        placeholder="{prefix}-{year}-{number:4}"
                        className="font-mono"
                      />
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Segnaposto disponibili:
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <div>
                            <code className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 rounded text-[11px]">
                              {"{prefix}"}
                            </code>{" "}
                            — prefisso (es. PREV)
                          </div>
                          <div>
                            <code className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 rounded text-[11px]">
                              {"{year}"}
                            </code>{" "}
                            — anno 4 cifre (es. 2026)
                          </div>
                          <div>
                            <code className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 rounded text-[11px]">
                              {"{year:2}"}
                            </code>{" "}
                            — anno 2 cifre (es. 26)
                          </div>
                          <div>
                            <code className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 rounded text-[11px]">
                              {"{month}"}
                            </code>{" "}
                            — mese (es. 02)
                          </div>
                          <div>
                            <code className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 rounded text-[11px]">
                              {"{day}"}
                            </code>{" "}
                            — giorno (es. 17)
                          </div>
                          <div>
                            <code className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 rounded text-[11px]">
                              {"{number:4}"}
                            </code>{" "}
                            — prog. annuale (es. 0001)
                          </div>
                          <div>
                            <code className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 rounded text-[11px]">
                              {"{number:4:monthly}"}
                            </code>{" "}
                            — prog. mensile
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Live preview */}
                  {(() => {
                    const now = new Date();
                    const yy = now.getFullYear().toString().slice(-2);
                    const mm = String(now.getMonth() + 1).padStart(2, "0");
                    const dd = String(now.getDate()).padStart(2, "0");
                    const preview = (
                      getSettingValue("quotes.code_format") ||
                      "{prefix}-{year}-{number:4}"
                    )
                      .replace(
                        "{prefix}",
                        getSettingValue("quotes.code_prefix") || "PREV",
                      )
                      .replace("{year:2}", yy)
                      .replace("{year}", now.getFullYear().toString())
                      .replace("{month}", mm)
                      .replace("{day}", dd)
                      .replace("{date}", `${now.getFullYear()}${mm}${dd}`)
                      .replace(/\{number:(\d+):monthly\}/, (_, n) =>
                        "1".padStart(parseInt(n), "0"),
                      )
                      .replace(/\{number:(\d+)\}/, (_, n) =>
                        "1".padStart(parseInt(n), "0"),
                      );
                    return (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Anteprima:
                        </span>
                        <code className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {preview}
                        </code>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* 3. Impostazioni predefinite PDF */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Impostazioni predefinite PDF
                  </CardTitle>
                  <CardDescription>
                    Valori usati come default nella creazione di nuovi
                    preventivi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Validità */}
                  <div className="space-y-2">
                    <Label htmlFor="validity_days">
                      Giorni di validità predefiniti
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="validity_days"
                        type="number"
                        min={1}
                        max={365}
                        value={getSettingValue("quotes.default_validity_days")}
                        onChange={(e) =>
                          handleSettingChange(
                            "quotes.default_validity_days",
                            e.target.value,
                          )
                        }
                        className="w-28"
                      />
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        giorni dalla data di emissione
                      </span>
                    </div>
                  </div>

                  {/* Switches grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      [
                        {
                          key: "quotes.show_unit_prices_by_default",
                          label: "Mostra prezzi unitari",
                          desc: "Colonna prezzo per singola voce",
                        },
                        {
                          key: "quotes.show_product_codes_by_default",
                          label: "Mostra codici prodotto",
                          desc: "Codice articolo accanto alla descrizione",
                        },
                        {
                          key: "quotes.show_vat_by_default",
                          label: "Mostra aliquota IVA",
                          desc: "Colonna % IVA nella tabella",
                        },
                        {
                          key: "quotes.show_section_totals_by_default",
                          label: "Mostra totali di sezione",
                          desc: "Subtotale per ogni sezione raggruppata",
                        },
                        {
                          key: "quotes.vat_included_in_prices_by_default",
                          label: "Prezzi IVA inclusa",
                          desc: "I prezzi unitari includono già l'IVA",
                        },
                        {
                          key: "quotes.tax_included_by_default",
                          label: "Totale IVA inclusa",
                          desc: "Il totale finale include l'IVA",
                        },
                        {
                          key: "quotes.include_terms_and_conditions_by_default",
                          label: "Includi condizioni generali",
                          desc: "Aggiungi T&C al fondo del preventivo",
                        },
                        {
                          key: "quotes.show_document_separator_page",
                          label: "Pagina separatrice allegati",
                          desc: "Inserisce una pagina separatrice prima di ogni allegato prodotto nel PDF",
                        },
                      ] as const
                    ).map(({ key, label, desc }) => (
                      <div
                        key={key}
                        className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/30"
                      >
                        <Switch
                          id={key}
                          checked={
                            getSettingValue(key) === "true" ||
                            getSettingValue(key) === "1"
                          }
                          onCheckedChange={(checked) =>
                            handleSettingChange(key, checked ? "1" : "0")
                          }
                          className="mt-0.5 shrink-0"
                        />
                        <label
                          htmlFor={key}
                          className="cursor-pointer select-none"
                        >
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {desc}
                          </p>
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 4. Testi predefiniti */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Testi predefiniti</CardTitle>
                  <CardDescription>
                    Testi precompilati nei nuovi preventivi, modificabili per
                    ogni singolo documento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="default_notes">Note predefinite</Label>
                    <Textarea
                      id="default_notes"
                      value={getSettingValue("quotes.default_notes")}
                      onChange={(e) =>
                        handleSettingChange(
                          "quotes.default_notes",
                          e.target.value,
                        )
                      }
                      placeholder="Note standard da aggiungere ai preventivi..."
                      rows={4}
                      className="resize-y"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="terms_template">
                      Condizioni generali predefinite
                    </Label>
                    <Textarea
                      id="terms_template"
                      value={getSettingValue(
                        "quotes.terms_and_conditions_template",
                      )}
                      onChange={(e) =>
                        handleSettingChange(
                          "quotes.terms_and_conditions_template",
                          e.target.value,
                        )
                      }
                      placeholder="Inserisci le condizioni generali di vendita..."
                      rows={10}
                      className="resize-y font-mono text-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveQuotesTab}
                  disabled={bulkUpdateMutation.isPending}
                >
                  {bulkUpdateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salva Impostazioni Preventivi
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Other Settings Tabs - Generated dynamically */}
            {[
              "general",
              "theme",
              "ui",
              "warehouse",
              "email",
              "notifications",
              "files",
              "pricing",
            ].map((groupKey) => {
              const group = Object.values(SETTING_GROUPS).find(
                (g) => g.key === groupKey,
              );
              if (!group) return null;

              const Icon =
                iconMap[group.icon as keyof typeof iconMap] || Settings;
              const groupSettings = getSettingsByGroup(groupKey);

              return (
                <TabsContent
                  key={groupKey}
                  value={groupKey}
                  className="space-y-4 mt-0"
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            {group.label}
                          </CardTitle>
                          <CardDescription>{group.description}</CardDescription>
                        </div>
                        {groupSettings.length > 0 && (
                          <Button
                            onClick={() => handleSaveSettings(groupKey)}
                            disabled={
                              bulkUpdateMutation.isPending || !hasChanges
                            }
                          >
                            {bulkUpdateMutation.isPending ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Salvataggio...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Salva Modifiche
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {groupSettings.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          <Icon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                          <p>
                            Nessuna impostazione configurata per{" "}
                            {group.label.toLowerCase()}
                          </p>
                          <p className="text-sm mt-1">
                            Contatta l&apos;amministratore per aggiungere
                            impostazioni
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                          {groupSettings.map((setting: Setting) => (
                            <div key={setting.key}>
                              {renderSettingInput(setting)}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}

            {/* Feature Flags Tab */}
            <TabsContent value="features" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Flag className="h-5 w-5" />
                        {SETTING_GROUPS.FEATURES.label}
                      </CardTitle>
                      <CardDescription>
                        {SETTING_GROUPS.FEATURES.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingFlags ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-12 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800"
                        />
                      ))}
                    </div>
                  ) : featureFlags.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <Flag className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                      <p>Nessuna feature flag configurata</p>
                      <p className="text-sm mt-1">
                        Le feature flags permettono di abilitare/disabilitare
                        funzionalità senza rilasci
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {featureFlags.map((flag: Setting) => (
                        <div
                          key={flag.key}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {flag.description || flag.key}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {flag.description}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Key: <code className="font-mono">{flag.key}</code>
                            </div>
                          </div>
                          <Switch
                            checked={
                              flag.value === "true" || flag.value === "1"
                            }
                            onCheckedChange={(enabled) =>
                              toggleFeatureMutation.mutate({
                                key: flag.key,
                                enabled,
                              })
                            }
                            disabled={toggleFeatureMutation.isPending}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
