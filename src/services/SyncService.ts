import { synchronize } from "@nozbe/watermelondb/sync";
import { database } from "../database";
import api from "./api";
import { useAuthStore } from "../stores/authStore";

let isSyncing = false;

export async function syncData() {
    if (isSyncing) return;

    const user = useAuthStore.getState().user;
    const isGuest = user?.email?.includes('@local');

    if (!user || isGuest) {
        console.log("ℹ️ Sync ignorado: Modo Convidado ou deslogado.");
        return;
    }

    isSyncing = true;

    try {
        await synchronize({
            database,
            pullChanges: async ({ lastPulledAt }) => {
                const response = await api.get(
                    `/sync?last_pulled_at=${lastPulledAt || 0}`,
                );
                if (response.status !== 200) {
                    throw new Error("Erro ao buscar dados do servidor");
                }
                const { changes, timestamp } = response.data;
                return { changes, timestamp };
            },
            pushChanges: async ({ changes }) => {
                const response = await api.post("/sync", { changes });
                
                if (response.status !== 200) {
                    throw new Error("Erro ao enviar dados para o servidor");
                }
            },
            sendCreatedAsUpdated: true,
        });

        const categoryCount = await database.get("categories").query().fetchCount();
        if (categoryCount === 0) {
            await useAuthStore.getState().runSeed();
        }
        
        useAuthStore.getState().setLastSyncTime(Date.now());

    } catch (error: any) {
        if (error.response?.status === 401) {
            console.warn("⚠️ Sessão expirada ou não autorizada. Sync interrompido.");
        } else {
            console.error("❌ Erro no processo de sincronia:", error.message);
        }
    } finally {
        isSyncing = false;
    }
}