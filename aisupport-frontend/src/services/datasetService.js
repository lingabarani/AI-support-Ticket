import { datasetApi } from './api';

export const uploadDataset = (payload) => datasetApi.upload(payload);
export const listDatasetUploads = () => datasetApi.uploads();
export const previewDatasetUpload = (uploadId) => datasetApi.preview(uploadId);
export const removeDatasetUpload = (uploadId) => datasetApi.remove(uploadId);
