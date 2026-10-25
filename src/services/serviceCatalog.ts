// US10 - GET /api/servicecategories
import { api } from "./api";
import type { ServiceCategory } from "../types";

export const serviceCatalog = {
  list: (keyword?: string) =>
    api
      .get<ServiceCategory[]>("/servicecategories", {
        params: keyword ? { keyword } : undefined,
      })
      .then((r) => r.data),
};
