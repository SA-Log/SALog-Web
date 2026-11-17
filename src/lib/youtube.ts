// watch?v= (다른 쿼리 뒤에 v가 와도 허용), youtu.be/, embed/, shorts/, live/ 지원
const YOUTUBE_ID_PATTERN =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/;

export type YoutubeThumbnailQuality = "mqdefault" | "hqdefault" | "maxresdefault";

export function extractYoutubeId(url: string): string | null {
  const match = url.match(YOUTUBE_ID_PATTERN);
  return match ? match[1] : null;
}

export function getYoutubeThumbnail(
  url: string,
  quality: YoutubeThumbnailQuality = "mqdefault",
): string | null {
  const id = extractYoutubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/${quality}.jpg` : null;
}
