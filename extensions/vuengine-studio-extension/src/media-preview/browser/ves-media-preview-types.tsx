export enum MediaFileType {
  audio = 'audio',
  image = 'image',
  video = 'video',
}

export const MEDIA_PREVIEW_SUPPORTED_AUDIO_FILES = [
  '.amb',
  '.flac',
  '.mp3',
  '.oga',
  '.ogg',
  '.opus',
  '.wav',
];

export const MEDIA_PREVIEW_SUPPORTED_IMAGE_FILES = [
  '.avif',
  '.bmp',
  '.cur',
  '.gif',
  '.ico',
  '.jfif',
  '.jpe',
  '.jpeg',
  '.jpg',
  '.jps',
  '.pes',
  '.png',
  '.svg',
  '.webp',
];

export const MEDIA_PREVIEW_SUPPORTED_VIDEO_FILES = [
  '.3gp',
  '.f4v',
  '.mkv',
  '.mov',
  '.mp4',
  '.ogv',
  '.webm',
];

export const MEDIA_PREVIEW_ZOOM_LEVELS = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.5, 2, 3, 5, 7, 10, 15, 20,
];

export const MEDIA_PREVIEW_ZOOM_LEVELS_DEFAULT_INDEX = 9;
