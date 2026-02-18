import { ChromaClient, Collection } from 'chromadb';

export interface MemoryMetadata {
    userId: string;
    targetUserId?: string;
    isCore: boolean;
    expiryDate?: string;
    significance: number;
    type: 'interaction' | 'observation' | 'dream_summary';
}

export class MemoryService {
    private static client = new ChromaClient({
        path: process.env.CHROMA_URL || 'http://localhost:8000'
    });
    private static collectionName = 'aether_memories';
    private static collection: Collection | null = null;

    static async getCollection(): Promise<Collection> {
        if (this.collection) return this.collection;
        try {
            this.collection = await this.client.getOrCreateCollection({
                name: this.collectionName,
                metadata: { "hnsw:space": "cosine" }
            });
            return this.collection;
        } catch (error) {
            console.error('Error getting ChromaDB collection:', error);
            throw error;
        }
    }

    static async addMemory(
        content: string,
        metadata: MemoryMetadata,
        id?: string
    ) {
        const col = await this.getCollection();
        const memoryId = id || crypto.randomUUID();

        await col.add({
            ids: [memoryId],
            metadatas: [metadata as any],
            documents: [content],
        });

        return memoryId;
    }

    static async queryMemories(
        userId: string,
        query: string,
        limit: number = 5,
        where: any = {}
    ) {
        const col = await this.getCollection();
        const filter = {
            $and: [
                { userId: userId },
                ...Object.entries(where).map(([k, v]) => ({ [k]: v }))
            ]
        };

        const results = await col.query({
            queryTexts: [query],
            nResults: limit,
            where: filter as any,
        });

        return results.documents[0].map((doc, i) => ({
            content: doc,
            metadata: results.metadatas[0][i],
            distance: results.distances ? results.distances[0][i] : null
        }));
    }

    static async getTemporaryMemoriesForPruning(userId: string) {
        const col = await this.getCollection();
        // In a real implementation, we'd query by expiryDate < now
        // For simplicity, we'll get all non-core memories for the user
        const results = await col.get({
            where: {
                $and: [
                    { userId: userId },
                    { isCore: false }
                ]
            } as any
        });

        return results.ids.map((id, i) => ({
            id,
            content: results.documents[i],
            metadata: results.metadatas[i]
        }));
    }

    static async deleteMemories(ids: string[]) {
        const col = await this.getCollection();
        await col.delete({ ids });
    }
}
