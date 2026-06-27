package com.financeflow.couple.model.mapper;

import com.financeflow.couple.model.domain.Couple;
import com.financeflow.couple.model.entity.CoupleEntity;

public final class CoupleMapper {

    private CoupleMapper() {
        // Utility class
    }

    public static Couple toDomain(CoupleEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Couple(
            entity.getId(),
            entity.getUser1Id(),
            entity.getUser2Id(),
            entity.getStatus(),
            entity.getInviteToken(),
            entity.getInviteExpiresAt(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public static CoupleEntity toEntity(Couple domain) {
        if (domain == null) {
            return null;
        }
        return CoupleEntity.builder()
            .id(domain.id())
            .user1Id(domain.user1Id())
            .user2Id(domain.user2Id())
            .status(domain.status())
            .inviteToken(domain.inviteToken())
            .inviteExpiresAt(domain.inviteExpiresAt())
            .createdAt(domain.createdAt())
            .updatedAt(domain.updatedAt())
            .build();
    }
}
