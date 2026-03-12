import type { HackStatus, VoteType, MannerTagType, UserRole, CreatorPlatform } from "@/generated/prisma/enums";

export type { HackStatus, VoteType, MannerTagType, UserRole, CreatorPlatform };

export interface HackReportWithRelations {
  id: string;
  barracksAddress: string;
  nickname: string;
  status: HackStatus;
  description: string | null;
  evidenceUrl: string | null;
  youtubeUrl: string | null;
  reporterId: string;
  createdAt: Date;
  updatedAt: Date;
  reporter: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    votes: number;
    comments: number;
  };
  agreeCount: number;
  disagreeCount: number;
}

export interface SearchParams {
  query?: string;
  status?: HackStatus;
  sort?: "latest" | "votes" | "oldest";
  page?: number;
}

export interface YouTubeOEmbed {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  html: string;
}
