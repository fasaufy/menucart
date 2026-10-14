"use client";

import { useSyncExternalStore } from "react";
import { syncStatus, type SyncStatus } from "./engine";

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(syncStatus.subscribe, syncStatus.get, () => "idle");
}
