import apiClient from "./client";

export interface ProductMediaResponse {
  images: App.Data.ProductMediaData[];
  technical_sheets: App.Data.ProductMediaData[];
  certifications: App.Data.ProductMediaData[];
  manuals: App.Data.ProductMediaData[];
  drawings: App.Data.ProductMediaData[];
  documents: App.Data.ProductMediaData[];
}

export interface UploadMediaRequest {
  file: File;
  collection_name:
    | "images"
    | "technical_sheets"
    | "certifications"
    | "manuals"
    | "drawings"
    | "documents";
  description?: string;
  // Image-specific
  is_primary?: boolean;
  use_in_quotes?: boolean;
  use_in_projects?: boolean;
  // Document-specific
  document_type?: string;
  valid_until?: string;
  // Common
  sort_order?: number;
}

export interface UpdateMediaRequest {
  description?: string;
  is_primary?: boolean;
  use_in_quotes?: boolean;
  use_in_projects?: boolean;
  document_type?: string;
  valid_until?: string;
  sort_order?: number;
}

export const productMediaApi = {
  /**
   * Get all media for a product grouped by collection
   */
  getAllMedia: async (productId: number): Promise<ProductMediaResponse> => {
    const { data } = await apiClient.get(`/products/${productId}/media`);
    return data.data;
  },

  /**
   * Upload a new media file to a product
   */
  uploadMedia: async (
    productId: number,
    request: UploadMediaRequest,
  ): Promise<App.Data.ProductMediaData> => {
    const formData = new FormData();
    formData.append("file", request.file);
    formData.append("collection_name", request.collection_name);

    if (request.description)
      formData.append("description", request.description);
    if (request.is_primary !== undefined)
      formData.append("is_primary", request.is_primary ? "1" : "0");
    if (request.use_in_quotes !== undefined)
      formData.append("use_in_quotes", request.use_in_quotes ? "1" : "0");
    if (request.use_in_projects !== undefined)
      formData.append("use_in_projects", request.use_in_projects ? "1" : "0");
    if (request.document_type)
      formData.append("document_type", request.document_type);
    if (request.valid_until)
      formData.append("valid_until", request.valid_until);
    if (request.sort_order !== undefined)
      formData.append("sort_order", request.sort_order.toString());

    const { data } = await apiClient.post(
      `/products/${productId}/media`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return data.data;
  },

  /**
   * Get a single media item
   */
  getMedia: async (
    productId: number,
    mediaId: number,
  ): Promise<App.Data.ProductMediaData> => {
    const { data } = await apiClient.get(
      `/products/${productId}/media/${mediaId}`,
    );
    return data.data;
  },

  /**
   * Update media properties (not the file itself)
   */
  updateMedia: async (
    productId: number,
    mediaId: number,
    request: UpdateMediaRequest,
  ): Promise<App.Data.ProductMediaData> => {
    const { data } = await apiClient.put(
      `/products/${productId}/media/${mediaId}`,
      request,
    );
    return data.data;
  },

  /**
   * Delete a media file permanently
   */
  deleteMedia: async (productId: number, mediaId: number): Promise<void> => {
    await apiClient.delete(`/products/${productId}/media/${mediaId}`);
  },

  /**
   * Update the sort order of a media item
   */
  reorderMedia: async (
    productId: number,
    mediaId: number,
    order: number,
  ): Promise<App.Data.ProductMediaData> => {
    const { data } = await apiClient.post(
      `/products/${productId}/media/${mediaId}/reorder`,
      { order },
    );
    return data.data;
  },

  /**
   * Download a media file
   */
  downloadMedia: async (productId: number, mediaId: number): Promise<Blob> => {
    const { data } = await apiClient.get(
      `/products/${productId}/media/${mediaId}/download`,
      {
        responseType: "blob",
      },
    );
    return data;
  },

  /**
   * Download all files in a collection as a ZIP archive
   */
  downloadCollectionZip: async (
    productId: number,
    collection: string,
  ): Promise<void> => {
    const response = await apiClient.get(
      `/products/${productId}/media/download-zip?collection=${collection}`,
      { responseType: "blob" },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `media-${productId}-${collection}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
