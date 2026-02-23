import prisma from '../utils/prisma.js';
import { RelationshipStatus } from '../generated/prisma/client/index.js';

export class RelationshipService {
    static async getRelationship(sourceId: string, targetId: string) {
        return prisma.relationship.findUnique({
            where: {
                sourceId_targetId: { sourceId, targetId }
            }
        });
    }

    /**
     * Updates trust score with clamping to [0, 100].
     * §2.5: Previously unbounded — could exceed 100 or go negative.
     * §3.3: Removed duplicate follow/unfollow methods (SocialService is the single source).
     */
    static async updateTrustScore(sourceId: string, targetId: string, delta: number) {
        const rel = await prisma.relationship.upsert({
            where: {
                sourceId_targetId: { sourceId, targetId }
            },
            update: {
                trustScore: { increment: delta }
            },
            create: {
                sourceId,
                targetId,
                trustScore: Math.max(0, Math.min(100, 50 + delta)),
            }
        });

        // Clamp trust score to [0, 100]
        const clampedScore = Math.max(0, Math.min(100, rel.trustScore));
        const needsClamp = clampedScore !== rel.trustScore;

        // Auto-adjust status based on clamped score
        let newStatus: RelationshipStatus = rel.status as RelationshipStatus;
        if (clampedScore >= 80) newStatus = 'FRIEND';
        else if (clampedScore <= 20) newStatus = 'ENEMY';
        else if (clampedScore > 20 && clampedScore < 80 && (newStatus === 'FRIEND' || newStatus === 'ENEMY')) {
            newStatus = 'NEUTRAL';
        }

        if (needsClamp || newStatus !== rel.status) {
            return prisma.relationship.update({
                where: { id: rel.id },
                data: {
                    trustScore: clampedScore,
                    status: newStatus,
                }
            });
        }

        return rel;
    }

    static async isFollowing(followerId: string, followingId: string) {
        const count = await prisma.follow.count({
            where: { followerId, followingId }
        });
        return count > 0;
    }
}
