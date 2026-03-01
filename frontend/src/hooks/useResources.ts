"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Resource } from "@/lib/types";

export function useResources(initialStatus?: string, initialTag?: string) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(initialStatus);
  const [tag, setTag] = useState(initialTag);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getResources(page, status, tag);
      setResources(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch resources:", err);
    } finally {
      setLoading(false);
    }
  }, [page, status, tag]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const refresh = useCallback(() => {
    fetchResources();
  }, [fetchResources]);

  return {
    resources,
    total,
    loading,
    page,
    setPage,
    status,
    setStatus,
    tag,
    setTag,
    refresh,
  };
}
