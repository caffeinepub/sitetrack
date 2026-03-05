import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DailyLog,
  Document,
  PaymentEntry,
  Site,
  SiteAggregate,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── User Profile ──────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Sites ─────────────────────────────────────────────────────

export function useGetAllSites() {
  const { actor, isFetching } = useActor();
  return useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSites();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSite(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Site>({
    queryKey: ["site", id],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getSite(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateSite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, site }: { id: string; site: Site }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createSite(id, site);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}

export function useGetSiteAggregates(siteId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<SiteAggregate>({
    queryKey: ["siteAggregates", siteId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getSiteAggregates(siteId);
    },
    enabled: !!actor && !isFetching && !!siteId,
  });
}

// ─── Daily Logs ────────────────────────────────────────────────

export function useGetDailyLogsForSite(siteId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<DailyLog[]>({
    queryKey: ["dailyLogs", siteId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDailyLogsForSite(siteId);
    },
    enabled: !!actor && !isFetching && !!siteId,
  });
}

export function useAddDailyLog() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, log }: { id: string; log: DailyLog }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addDailyLog(id, log);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dailyLogs", variables.log.siteId],
      });
      queryClient.invalidateQueries({
        queryKey: ["siteAggregates", variables.log.siteId],
      });
    },
  });
}

export function useDeleteDailyLog(siteId: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteDailyLog(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyLogs", siteId] });
      queryClient.invalidateQueries({ queryKey: ["siteAggregates", siteId] });
    },
  });
}

// ─── Payment Entries ───────────────────────────────────────────

export function useGetPaymentEntriesForSite(siteId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentEntry[]>({
    queryKey: ["payments", siteId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPaymentEntriesForSite(siteId);
    },
    enabled: !!actor && !isFetching && !!siteId,
  });
}

export function useAddPaymentEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, entry }: { id: string; entry: PaymentEntry }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addPaymentEntry(id, entry);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["payments", variables.entry.siteId],
      });
      queryClient.invalidateQueries({
        queryKey: ["siteAggregates", variables.entry.siteId],
      });
    },
  });
}

export function useDeletePaymentEntry(siteId: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deletePaymentEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", siteId] });
      queryClient.invalidateQueries({ queryKey: ["siteAggregates", siteId] });
    },
  });
}

// ─── Documents ─────────────────────────────────────────────────

export function useGetDocumentsForSite(siteId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Document[]>({
    queryKey: ["documents", siteId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDocumentsForSite(siteId);
    },
    enabled: !!actor && !isFetching && !!siteId,
  });
}

export function useAddDocument() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, doc }: { id: string; doc: Document }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addDocument(id, doc);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documents", variables.doc.siteId],
      });
    },
  });
}

export function useDeleteDocument(siteId: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteDocument(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", siteId] });
    },
  });
}
