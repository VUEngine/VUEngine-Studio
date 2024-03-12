export enum MediaFileType {
  audio = 'audio',
  image = 'image',
  video = 'video',
}

export const SUPPORTED_AUDIO_FILES = [
  '.mp3',
  '.ogg', '.oga',
  '.wav',
];

export const SUPPORTED_IMAGE_FILES = [
  '.avif',
  '.bmp',
  '.gif',
  '.ico',
  '.jpg', '.jpe', '.jpeg',
  '.jps',
  '.png',
  '.webp',
];

export const SUPPORTED_VIDEO_FILES = [
  '.mp4',
  '.webm',
];
