import prisma from '../utils/prisma.js';

export type RelationshipStatus = 'NEUTRAL' | 'FRIEND' | 'ENEMY' | 'BLOCKED';

export class RelationshipService {
    static async getRelationship(sourceId: string, targetId: string) {
        return prisma.relationship.findUnique({
            where: {
                sourceId_targetId: {
                    sourceId,
                    targetId,
                }
            }
        });
    }

    static async updateTrustScore(sourceId: string, targetId: string, delta: number) {
        const rel = await prisma.relationship.upsert({
            where: {
                sourceId_targetId: {
                    sourceId,
                    targetId,
                }
            },
            update: {
                trustScore: {
                    increment: delta
                }
            },
            create: {
                sourceId,
                targetId,
                trustScore: 50 + delta,
            }
        });

        // Auto-adjust status based on score
        let newStatus: RelationshipStatus = rel.status as RelationshipStatus;
        if (rel.trustScore >= 80) newStatus = 'FRIEND';
        else if (rel.trustScore <= 20) newStatus = 'ENEMY';
        else if (rel.trustScore > 20 && rel.trustScore < 80 && (newStatus === 'FRIEND' || newStatus === 'ENEMY')) {
            newStatus = 'NEUTRAL';
        }

        if (newStatus !== rel.status) {
            return prisma.relationship.update({
                where: { id: rel.id },
                data: { status: newStatus }
            });
        }

        return rel;
    }

    static async follow(followerId: string, followingId: string) {
        return prisma.follow.upsert({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                }
            },
            update: {},
            create: {
                followerId,
                followingId,
            }
        });
    }

    static async unfollow(followerId: string, followingId: string) {
        return prisma.follow.deleteMany({
            where: {
                followerId,
                followingId,
            }
        });
    }

    static async isFollowing(followerId: string, followingId: string) {
        const count = await prisma.follow.count({
            where: {
                followerId,
                followingId,
            }
        });
        return count > 0;
    }
}
