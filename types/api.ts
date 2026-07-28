export interface PageResult<T> {
  items: T[];
  nextCursor?: string | null;
  total: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    platformRole?: string;
    tier: string;
  };
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersLast7Days: number;
  tierBreakdown: Record<string, number>;
  totalPosts: number;
  totalCommunities: number;
  activeSessions: number;
  pendingReports: number;
  activeEmergencyAlerts: number;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  username: string;
  tier: string;
  platformRole: string;
  isDeleted: boolean;
  isBanned?: boolean;
  isVerified?: boolean;
  createdAt: string;
  avatarUrl?: string | null;
}

export interface AdminUserDetail extends AdminUser {
  bio?: string | null;
  phone?: string | null;
  totalPosts: number;
  totalFollowers: number;
  totalFollowing: number;
  subscription?: {
    tier: string;
    status: string;
    expiresAt?: string | null;
  } | null;
}

export interface AdminUserBlock {
  blockedUserId: string;
  blockedDisplayName: string;
  blockedEmail?: string | null;
  blockedAt: string;
}

export interface AdminPoll {
  id: string;
  question: string;
  status: string;
  creatorId: string;
  creatorName: string;
  optionCount: number;
  voteCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface AdminNotificationPref {
  onNewReport: boolean;
  onActiveAlert: boolean;
  onNewUser: boolean;
}

export interface Report {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { id: string; displayName: string };
  targetType: string;
  targetId: string;
}

export interface Community {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  ownerDisplayName: string;
  avatarUrl?: string | null;
  memberCount: number;
  visibility: string;
  isDeleted: boolean;
  createdAt: string;
}

export interface VideoSession {
  id: string;
  title: string;
  topic?: string;
  status: string;
  hostId: string;
  hostName?: string;
  hostDisplayName?: string;
  participantCount?: number;
  maxParticipants?: number;
  scheduledAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  participants?: { userId: string; displayName: string; role: string; joinedAt?: string | null; leftAt?: string | null }[];
}

export interface EmergencyAlert {
  id: string;
  userId: string;
  userDisplayName?: string;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface AdConfig {
  id: string;
  name: string;
  adsEnabled: boolean;
  injectionInterval: number;
  adUnitId?: string | null;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}
