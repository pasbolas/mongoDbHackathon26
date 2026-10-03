import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VIDEOS_DIR = path.join(__dirname, '..', 'videos');
const YTDLP_PATH = path.join(__dirname, '..', 'scripts', 'yt-dlp');

if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

/**
 * Downloads a YouTube video using yt-dlp binary
 * @param {string} url
 * @returns {Promise<{ filename: string, videoUrl: string, title?: string }>}
 */
export function downloadYouTubeVideo(url) {
  return new Promise((resolve, reject) => {
    if (!url || typeof url !== 'string') {
      return reject(new Error('Invalid URL provided'));
    }

    console.log('🎬 Starting YouTube video download:', url);

    // Get video info / title first
    const titleProcess = exec(`"${YTDLP_PATH}" --no-playlist --print "%(title)s" "${url}"`, (err, stdout) => {
      const videoTitle = stdout ? stdout.trim() : 'YouTube Video';

      // Download format: mp4 (up to 720p for fast processing)
      const outputTemplate = path.join(VIDEOS_DIR, '%(id)s.%(ext)s');
      const downloadCmd = `"${YTDLP_PATH}" --no-playlist -f "best[ext=mp4][height<=720]/best[ext=mp4]/best" -o "${outputTemplate}" --print filename "${url}"`;

      exec(downloadCmd, { timeout: 120000 }, (dlErr, dlStdout, dlStderr) => {
        if (dlErr) {
          console.error('yt-dlp download error:', dlStderr || dlErr.message);
          return reject(new Error(`Failed to download YouTube video: ${dlStderr || dlErr.message}`));
        }

        const lines = dlStdout.trim().split('\n');
        const downloadedPath = lines[lines.length - 1]?.trim();
        const filename = path.basename(downloadedPath);

        console.log('✅ Video downloaded successfully:', filename);
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
  const filePath = path.join(VIDEOS_DIR, filename);

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
