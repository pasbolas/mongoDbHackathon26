import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VIDEOS_DIR = path.join(__dirname, '..', 'videos');
const YTDLP_PATH = path.join(__dirname, '..', 'scripts', 'yt-dlp');

if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

/**
 * Downloads or retrieves a cached YouTube video using yt-dlp + ffmpeg-static + Node JS runtime
 * @param {string} url
 * @returns {Promise<{ filename: string, videoUrl: string, title?: string }>}
 */
export function downloadYouTubeVideo(url) {
  return new Promise((resolve, reject) => {
    if (!url || typeof url !== 'string' || !url.trim()) {
      return reject(new Error('Invalid URL provided'));
    }

    const trimmedUrl = url.trim();
    console.log('🎬 Ingesting YouTube video:', trimmedUrl);

    // 1. Extract video ID and Title first
    const infoCmd = `"${YTDLP_PATH}" --js-runtimes node --no-playlist --print "%(id)s|||%(title)s" "${trimmedUrl}"`;

    exec(infoCmd, { timeout: 30000 }, (infoErr, infoStdout) => {
      let videoId = 'video_' + Date.now();
      let videoTitle = 'YouTube Video';

      if (!infoErr && infoStdout) {
        const parts = infoStdout.trim().split('|||');
        if (parts[0]) videoId = parts[0].trim();
        if (parts[1]) videoTitle = parts[1].trim();
      }

      // Check if already downloaded in cache
      const cachedFile = path.join(VIDEOS_DIR, `${videoId}.mp4`);
      if (fs.existsSync(cachedFile)) {
        console.log('⚡ Found video in local cache:', `${videoId}.mp4`);
        return resolve({
          filename: `${videoId}.mp4`,
          videoUrl: `/api/video/file/${videoId}.mp4`,
          title: videoTitle
        });
      }

      // 2. Download 360p/480p with Node JS runtime and static FFmpeg for audio/video muxing
      const outputTemplate = path.join(VIDEOS_DIR, `${videoId}.%(ext)s`);
      const downloadCmd = `"${YTDLP_PATH}" --js-runtimes node --ffmpeg-location "${ffmpegPath}" --no-playlist -f "bestvideo[height<=480]+bestaudio/best[height<=480]/bestvideo+bestaudio/best" --merge-output-format mp4 -o "${outputTemplate}" "${trimmedUrl}"`;

      console.log('⬇️ Downloading video streams...');
      exec(downloadCmd, { timeout: 180000 }, (dlErr, dlStdout, dlStderr) => {
        if (dlErr) {
          console.error('yt-dlp download error:', dlStderr || dlErr.message);
          return reject(new Error(`Failed to download YouTube video: ${dlStderr || dlErr.message}`));
        }

        const filename = `${videoId}.mp4`;
        console.log('✅ Video downloaded & muxed successfully:', filename);

        resolve({
          filename,
          videoUrl: `/api/video/file/${filename}`,
          title: videoTitle
        });
      });
    });
  });
}

/**
 * Streams an MP4 video file with standard HTTP Range support
 */
export function streamVideoFile(req, res, filename) {
  // Sanitize filename
  const safeFilename = path.basename(filename);
  const filePath = path.join(VIDEOS_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video file not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
}
