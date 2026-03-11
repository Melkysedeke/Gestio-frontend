import { synchronize } from "@nozbe/watermelondb/sync";
import { database } from "../database";
import api from "./api";
import { useAuthStore } from "../stores/authStore";

// 🚀 Trava de segurança global para evitar 'Concurrent synchronization'
let isSyncing = false;

export async function syncData() {
    if (isSyncing) {
        return;
    }

    isSyncing = true;

    try {
        await synchronize({
            database,
            // 📥 BUSCAR MUDANÇAS (Servidor -> Celular)
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
            // 📤 ENVIAR MUDANÇAS (Celular -> Servidor)
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
        console.error("❌ Erro no processo de sincronia:", error.message);
        // Se quiser que o erro suba para a UI tratar, pode usar throw error;
    } finally {
        isSyncing = false;
    }
}
