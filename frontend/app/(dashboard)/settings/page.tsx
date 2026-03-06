"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import {
  usersApi,
  companySettingsApi,
  rolesApi,
  permissionsApi,
  Role,
} from "@/lib/api/users";
import { rentalProfilesApi } from "@/lib/api/rental-profiles";
import type { RentalProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MaterialsSettingsSidebar } from "@/components/settings/materials-settings-sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit2,
  Trash2,
  Settings as SettingsIcon,
  Users,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: number;
  name: string;
  code: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  rental_profile_id: number | null;
  rentalProfile: RentalProfile | null;
}

interface DependencyType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "categories");

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

  // Category state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categorySortOrder, setCategorySortOrder] = useState("0");
  const [categoryRentalProfileId, setCategoryRentalProfileId] = useState<
    number | null
  >(null);

  // Dependency Type state
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<DependencyType | null>(null);
  const [typeName, setTypeName] = useState("");
  const [typeCode, setTypeCode] = useState("");
  const [typeDescription, setTypeDescription] = useState("");
  const [typeSortOrder, setTypeSortOrder] = useState("0");

  // User Management state
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userPasswordConfirm, setUserPasswordConfirm] = useState("");
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userActive, setUserActive] = useState(true);

  // Company Settings state
  const [companyName, setCompanyName] = useState("");
  const [companyVat, setCompanyVat] = useState("");
  const [companyTaxCode, setCompanyTaxCode] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyProvince, setCompanyProvince] = useState("");
  const [companyPostalCode, setCompanyPostalCode] = useState("");
  const [companyCountry, setCompanyCountry] = useState("IT");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  // Roles & Permissions state
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDisplayName, setRoleDisplayName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  // Fetch users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.getAll({ per_page: 100 }),
  });

  const users = usersData?.data || [];

  // Fetch roles
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: rolesApi.getAll,
  });

  const rolesList = rolesData || [];

  // Fetch permissions grouped
  const { data: permissionsGrouped } = useQuery({
    queryKey: ["permissions-grouped"],
    queryFn: permissionsApi.getGrouped,
  });

  // Fetch company settings
  const { data: companySettings, isLoading: isLoadingCompany } = useQuery({
    queryKey: ["company-settings"],
    queryFn: companySettingsApi.get,
  });

  // Update company form when data is loaded
  useEffect(() => {
    if (companySettings) {
      setCompanyName(companySettings["company.name"] || "");
      setCompanyVat(companySettings["company.vat"] || "");
      setCompanyTaxCode(companySettings["company.fiscal_code"] || "");
      setCompanyAddress(companySettings["company.address"] || "");
      setCompanyCity(companySettings["company.city"] || "");
      setCompanyProvince(companySettings["company.province"] || "");
      setCompanyPostalCode(companySettings["company.postal_code"] || "");
      setCompanyCountry(companySettings["company.country"] || "IT");
      setCompanyPhone(companySettings["company.phone"] || "");
      setCompanyEmail(companySettings["company.email"] || "");
      setCompanyWebsite(companySettings["company.website"] || "");
    }
  }, [companySettings]);

  // Fetch rental profiles
  const { data: rentalProfiles = [] } = useQuery<RentalProfile[]>({
    queryKey: ["rental-profiles"],
    queryFn: rentalProfilesApi.getAll,
  });

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["material-categories"],
    queryFn: productsApi.getCategories,
  });

  // Fetch dependency types (relation types)
  const { data: dependencyTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ["product-relation-types"],
    queryFn: productsApi.getRelationTypes,
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: productsApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-categories"] });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      toast.success("Categoria creata con successo");
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message || "Impossibile creare la categoria",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      productsApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-categories"] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      resetCategoryForm();
      toast.success("Categoria aggiornata con successo");
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message ||
          "Impossibile aggiornare la categoria",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: productsApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-categories"] });
      toast.success("Categoria eliminata con successo");
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message || "Impossibile eliminare la categoria",
      });
    },
  });

  // Dependency Type mutations (Relation Types)
  const createTypeMutation = useMutation({
    mutationFn: (data: {
      name: string;
      code: string;
      description?: string;
      icon?: string;
      color?: string;
      sort_order?: number;
    }) => productsApi.createRelationType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-relation-types"] });
      setIsTypeDialogOpen(false);
      resetTypeForm();
      toast.success("Tipo dipendenza creato con successo");
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message ||
          "Impossibile creare il tipo dipendenza",
      });
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      productsApi.updateRelationType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-relation-types"] });
      setIsTypeDialogOpen(false);
      setEditingType(null);
      resetTypeForm();
      toast.success("Tipo dipendenza aggiornato con successo");
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message ||
          "Impossibile aggiornare il tipo dipendenza",
      });
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id: number) => productsApi.deleteRelationType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-relation-types"] });
      toast.success("Tipo dipendenza eliminato con successo");
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message ||
          "Impossibile eliminare il tipo dipendenza",
      });
    },
  });

  const resetCategoryForm = () => {
    setCategoryName("");
    setCategoryCode("");
    setCategoryDescription("");
    setCategorySortOrder("0");
    setCategoryRentalProfileId(null);
  };

  const resetTypeForm = () => {
    setTypeName("");
    setTypeCode("");
    setTypeDescription("");
    setTypeSortOrder("0");
  };

  // User Management mutations
  const createUserMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsUserDialogOpen(false);
      resetUserForm();
      toast.success("Utente creato con successo");
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message || "Impossibile creare l'utente",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsUserDialogOpen(false);
      resetUserForm();
      toast.success("Utente aggiornato");
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message || "Impossibile aggiornare l'utente",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utente eliminato");
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message || "Impossibile eliminare l'utente",
      });
    },
  });

  // Company Settings mutation
  const updateCompanyMutation = useMutation({
    mutationFn: companySettingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      toast.success("Impostazioni azienda aggiornate");
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message ||
          "Impossibile salvare le impostazioni",
      });
    },
  });

  const resetUserForm = () => {
    setEditingUser(null);
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setUserPasswordConfirm("");
    setUserRoles([]);
    setUserActive(true);
  };

  const handleUserSubmit = () => {
    if (!userName || !userEmail) {
      toast.error("Nome e email sono obbligatori");
      return;
    }

    if (!editingUser && !userPassword) {
      toast.error("Password obbligatoria per nuovo utente");
      return;
    }

    if (userPassword && userPassword !== userPasswordConfirm) {
      toast.error("Le password non coincidono");
      return;
    }

    const data: any = {
      name: userName,
      email: userEmail,
      roles: userRoles,
      is_active: userActive,
    };

    if (userPassword) {
      data.password = userPassword;
      data.password_confirmation = userPasswordConfirm;
    }

    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleCompanySubmit = () => {
    updateCompanyMutation.mutate({
      "company.name": companyName,
      "company.vat": companyVat,
      "company.fiscal_code": companyTaxCode,
      "company.address": companyAddress,
      "company.city": companyCity,
      "company.province": companyProvince,
      "company.postal_code": companyPostalCode,
      "company.country": companyCountry,
      "company.phone": companyPhone,
      "company.email": companyEmail,
      "company.website": companyWebsite,
    });
  };

  // Roles mutations
  const createRoleMutation = useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setIsRoleDialogOpen(false);
      resetRoleForm();
      toast.success("Ruolo creato con successo");
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message || "Impossibile creare il ruolo",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setIsRoleDialogOpen(false);
      resetRoleForm();
      toast.success("Ruolo aggiornato");
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message || "Impossibile aggiornare il ruolo",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: rolesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Ruolo eliminato");
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message || "Impossibile eliminare il ruolo",
      });
    },
  });

  const resetRoleForm = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDisplayName("");
    setRoleDescription("");
    setRolePermissions([]);
  };

  const handleRoleSubmit = () => {
    if (!roleName || !roleDisplayName) {
      toast.error("Nome e nome visualizzato sono obbligatori");
      return;
    }

    const data = {
      name: roleName,
      display_name: roleDisplayName,
      description: roleDescription || undefined,
      permissions: rolePermissions,
    };

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDisplayName(role.display_name);
    setRoleDescription(role.description || "");
    setRolePermissions(role.permissions || []);
    setIsRoleDialogOpen(true);
  };

  const togglePermission = (permission: string) => {
    setRolePermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  const handleCategorySubmit = () => {
    if (!categoryName || !categoryCode) {
      toast.error("Campi obbligatori mancanti");
      return;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: {
          name: categoryName,
          code: categoryCode,
          description: categoryDescription || undefined,
          sort_order: parseInt(categorySortOrder) || 0,
          rental_profile_id: categoryRentalProfileId,
        },
      });
    } else {
      createCategoryMutation.mutate({
        name: categoryName,
        code: categoryCode,
        description: categoryDescription || undefined,
        sort_order: parseInt(categorySortOrder) || 0,
        rental_profile_id: categoryRentalProfileId,
      });
    }
  };

  const handleTypeSubmit = () => {
    if (!typeName || !typeCode) {
      toast.error("Campi obbligatori mancanti");
      return;
    }

    if (editingType) {
      updateTypeMutation.mutate({
        id: editingType.id,
        data: {
          name: typeName,
          code: typeCode,
          description: typeDescription || undefined,
          sort_order: parseInt(typeSortOrder) || 0,
        },
      });
    } else {
      createTypeMutation.mutate({
        name: typeName,
        code: typeCode,
        description: typeDescription || undefined,
        sort_order: parseInt(typeSortOrder) || 0,
      });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryCode(category.code);
    setCategoryDescription(category.description || "");
    setCategorySortOrder(category.sort_order.toString());
    setCategoryRentalProfileId(category.rental_profile_id ?? null);
    setIsCategoryDialogOpen(true);
  };

  const handleEditType = (type: DependencyType) => {
    setEditingType(type);
    setTypeName(type.name);
    setTypeCode(type.code);
    setTypeDescription(type.description || "");
    setTypeSortOrder(type.sort_order.toString());
    setIsTypeDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-7 w-7" />
          Impostazioni Materiali
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Gestisci categorie, tipi dipendenza, utenti e dati aziendali
        </p>
      </div>

      {/* Layout: Sidebar + Contenuto */}
      <div className="flex gap-0 md:gap-6">
        {/* Sidebar verticale */}
        <MaterialsSettingsSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Contenuto principale */}
        <main className="flex-1 min-w-0 w-full">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            {/* Categories Tab */}
            <TabsContent value="categories" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Categorie Materiali</CardTitle>
                      <CardDescription>
                        Gestisci le categorie per organizzare i materiali
                      </CardDescription>
                    </div>
                    <Dialog
                      open={isCategoryDialogOpen}
                      onOpenChange={(open) => {
                        setIsCategoryDialogOpen(open);
                        if (!open) {
                          setEditingCategory(null);
                          resetCategoryForm();
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Nuova Categoria
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingCategory
                              ? "Modifica Categoria"
                              : "Nuova Categoria"}
                          </DialogTitle>
                          <DialogDescription>
                            {editingCategory
                              ? "Modifica le informazioni della categoria"
                              : "Crea una nuova categoria per i materiali"}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="category-name">Nome *</Label>
                            <Input
                              id="category-name"
                              value={categoryName}
                              onChange={(e) => setCategoryName(e.target.value)}
                              placeholder="Es: Elettrico"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="category-code">Codice *</Label>
                            <Input
                              id="category-code"
                              value={categoryCode}
                              onChange={(e) => setCategoryCode(e.target.value)}
                              placeholder="Es: electrical"
                              disabled={!!editingCategory}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="category-description">
                              Descrizione
                            </Label>
                            <Textarea
                              id="category-description"
                              value={categoryDescription}
                              onChange={(e) =>
                                setCategoryDescription(e.target.value)
                              }
                              placeholder="Descrizione della categoria..."
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="category-sort-order">Ordine</Label>
                            <Input
                              id="category-sort-order"
                              type="number"
                              value={categorySortOrder}
                              onChange={(e) =>
                                setCategorySortOrder(e.target.value)
                              }
                              placeholder="0"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="category-rental-profile">
                              Profilo Noleggio
                            </Label>
                            <Select
                              value={
                                categoryRentalProfileId !== null
                                  ? String(categoryRentalProfileId)
                                  : "__global__"
                              }
                              onValueChange={(value) =>
                                setCategoryRentalProfileId(
                                  value === "__global__" ? null : Number(value),
                                )
                              }
                            >
                              <SelectTrigger id="category-rental-profile">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__global__">
                                  Nessun profilo (impostazioni globali)
                                </SelectItem>
                                {rentalProfiles.map((profile) => (
                                  <SelectItem
                                    key={profile.id}
                                    value={String(profile.id)}
                                  >
                                    {profile.name} — {profile.sector}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Profilo tariffe noleggio specifico per questa
                              categoria. Se non selezionato, verranno usate le
                              impostazioni globali.
                            </p>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsCategoryDialogOpen(false);
                              setEditingCategory(null);
                              resetCategoryForm();
                            }}
                          >
                            Annulla
                          </Button>
                          <Button
                            onClick={handleCategorySubmit}
                            disabled={
                              createCategoryMutation.isPending ||
                              updateCategoryMutation.isPending
                            }
                          >
                            {createCategoryMutation.isPending ||
                            updateCategoryMutation.isPending
                              ? "Salvataggio..."
                              : editingCategory
                                ? "Aggiorna"
                                : "Crea"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingCategories ? (
                    <div className="text-center py-8">Caricamento...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Codice</TableHead>
                          <TableHead>Descrizione</TableHead>
                          <TableHead className="text-center">Ordine</TableHead>
                          <TableHead>Profilo Noleggio</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map((category: Category) => (
                          <TableRow key={category.id}>
                            <TableCell className="font-medium">
                              {category.name}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {category.code}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {category.description || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {category.sort_order}
                            </TableCell>
                            <TableCell>
                              {category.rentalProfile ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-normal"
                                >
                                  {category.rentalProfile.name}
                                </Badge>
                              ) : (
                                <span className="text-sm text-slate-400 dark:text-slate-600">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditCategory(category)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Sei sicuro di voler eliminare questa categoria? Questa azione non può essere annullata.",
                                      )
                                    ) {
                                      deleteCategoryMutation.mutate(
                                        category.id,
                                      );
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dependency Types Tab */}
            <TabsContent value="dependency-types" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Tipi Dipendenza</CardTitle>
                      <CardDescription>
                        Gestisci i tipi di dipendenza per i materiali
                      </CardDescription>
                    </div>
                    <Dialog
                      open={isTypeDialogOpen}
                      onOpenChange={(open) => {
                        setIsTypeDialogOpen(open);
                        if (!open) {
                          setEditingType(null);
                          resetTypeForm();
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Nuovo Tipo
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingType
                              ? "Modifica Tipo Dipendenza"
                              : "Nuovo Tipo Dipendenza"}
                          </DialogTitle>
                          <DialogDescription>
                            {editingType
                              ? "Modifica le informazioni del tipo dipendenza"
                              : "Crea un nuovo tipo di dipendenza per i materiali"}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="type-name">Nome *</Label>
                            <Input
                              id="type-name"
                              value={typeName}
                              onChange={(e) => setTypeName(e.target.value)}
                              placeholder="Es: Contenitore"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="type-code">Codice *</Label>
                            <Input
                              id="type-code"
                              value={typeCode}
                              onChange={(e) => setTypeCode(e.target.value)}
                              placeholder="Es: container"
                              disabled={!!editingType}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="type-description">
                              Descrizione
                            </Label>
                            <Textarea
                              id="type-description"
                              value={typeDescription}
                              onChange={(e) =>
                                setTypeDescription(e.target.value)
                              }
                              placeholder="Descrizione del tipo di dipendenza..."
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="type-sort-order">Ordine</Label>
                            <Input
                              id="type-sort-order"
                              type="number"
                              value={typeSortOrder}
                              onChange={(e) => setTypeSortOrder(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsTypeDialogOpen(false);
                              setEditingType(null);
                              resetTypeForm();
                            }}
                          >
                            Annulla
                          </Button>
                          <Button
                            onClick={handleTypeSubmit}
                            disabled={
                              createTypeMutation.isPending ||
                              updateTypeMutation.isPending
                            }
                          >
                            {createTypeMutation.isPending ||
                            updateTypeMutation.isPending
                              ? "Salvataggio..."
                              : editingType
                                ? "Aggiorna"
                                : "Crea"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingTypes ? (
                    <div className="text-center py-8">Caricamento...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Codice</TableHead>
                          <TableHead>Descrizione</TableHead>
                          <TableHead className="text-center">Ordine</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dependencyTypes.map((type: DependencyType) => (
                          <TableRow key={type.id}>
                            <TableCell className="font-medium">
                              {type.name}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {type.code}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {type.description || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {type.sort_order}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditType(type)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Sei sicuro di voler eliminare questo tipo? Questa azione non può essere annullata.",
                                      )
                                    ) {
                                      deleteTypeMutation.mutate(type.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Gestione Utenti
                      </CardTitle>
                      <CardDescription>
                        Gestisci gli utenti del sistema e i loro ruoli
                      </CardDescription>
                    </div>
                    <Dialog
                      open={isUserDialogOpen}
                      onOpenChange={setIsUserDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button onClick={() => resetUserForm()}>
                          <Plus className="mr-2 h-4 w-4" />
                          Nuovo Utente
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {editingUser ? "Modifica Utente" : "Nuovo Utente"}
                          </DialogTitle>
                          <DialogDescription>
                            {editingUser
                              ? "Modifica le informazioni dell'utente"
                              : "Crea un nuovo utente nel sistema"}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Nome *</Label>
                              <Input
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Mario Rossi"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Email *</Label>
                              <Input
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                                placeholder="mario@example.com"
                                type="email"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Password {!editingUser && "*"}</Label>
                              <Input
                                value={userPassword}
                                onChange={(e) =>
                                  setUserPassword(e.target.value)
                                }
                                type="password"
                                placeholder={
                                  editingUser
                                    ? "Lascia vuoto per non modificare"
                                    : ""
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Conferma Password</Label>
                              <Input
                                value={userPasswordConfirm}
                                onChange={(e) =>
                                  setUserPasswordConfirm(e.target.value)
                                }
                                type="password"
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={userActive}
                              onCheckedChange={setUserActive}
                              id="user-active"
                            />
                            <Label
                              htmlFor="user-active"
                              className="cursor-pointer"
                            >
                              Utente Attivo
                            </Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsUserDialogOpen(false)}
                          >
                            Annulla
                          </Button>
                          <Button
                            onClick={handleUserSubmit}
                            disabled={
                              createUserMutation.isPending ||
                              updateUserMutation.isPending
                            }
                          >
                            {createUserMutation.isPending ||
                            updateUserMutation.isPending
                              ? "Salvataggio..."
                              : editingUser
                                ? "Aggiorna"
                                : "Crea"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                      Caricamento utenti...
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">
                            Nome
                          </TableHead>
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">
                            Email
                          </TableHead>
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">
                            Ruoli
                          </TableHead>
                          <TableHead className="font-semibold text-slate-900 dark:text-slate-100">
                            Stato
                          </TableHead>
                          <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-100">
                            Azioni
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user: any) => (
                          <TableRow
                            key={user.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"
                          >
                            <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                              {user.name}
                            </TableCell>
                            <TableCell className="text-slate-700 dark:text-slate-300">
                              {user.email}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {user.roles?.map((role: string) => (
                                  <Badge
                                    key={role}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  user.is_active
                                    ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                }
                              >
                                {user.is_active ? "Attivo" : "Inattivo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingUser(user);
                                    setUserName(user.name);
                                    setUserEmail(user.email);
                                    setUserRoles(user.roles || []);
                                    setUserActive(user.is_active);
                                    setUserPassword("");
                                    setUserPasswordConfirm("");
                                    setIsUserDialogOpen(true);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Sei sicuro di voler eliminare questo utente?",
                                      )
                                    ) {
                                      deleteUserMutation.mutate(user.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Company Settings Tab */}
            <TabsContent value="company" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Impostazioni Azienda
                  </CardTitle>
                  <CardDescription>
                    Gestisci le informazioni della tua azienda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ragione Sociale</Label>
                        <Input
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Partita IVA</Label>
                        <Input
                          value={companyVat}
                          onChange={(e) => setCompanyVat(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Codice Fiscale</Label>
                        <Input
                          value={companyTaxCode}
                          onChange={(e) => setCompanyTaxCode(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefono</Label>
                        <Input
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          type="email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sito Web</Label>
                        <Input
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Indirizzo</Label>
                      <Input
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Città</Label>
                        <Input
                          value={companyCity}
                          onChange={(e) => setCompanyCity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Provincia</Label>
                        <Input
                          value={companyProvince}
                          onChange={(e) => setCompanyProvince(e.target.value)}
                          maxLength={2}
                          placeholder="MI"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CAP</Label>
                        <Input
                          value={companyPostalCode}
                          onChange={(e) => setCompanyPostalCode(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleCompanySubmit}
                        disabled={updateCompanyMutation.isPending}
                      >
                        {updateCompanyMutation.isPending
                          ? "Salvataggio..."
                          : "Salva Impostazioni"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
