import { useCallback, useEffect, useState } from "react";
import { serviceCatalog } from "../services/serviceCatalog";
import { getErrorMessage } from "../services/api";
import type { ServiceCategory } from "../types";

/** Danh sách dịch vụ đang hoạt động (GET /api/servicecategories) */
export function useServices() {
  const [services, setServices] = useState<ServiceCategory[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setError("");
    serviceCatalog
      .list()
      .then((d) => setServices(d.filter((s) => s.isActive)))
      .catch((e) => setError(getErrorMessage(e)));
  }, []);
  useEffect(load, [load]);
  return { services, error, reload: load };
}
