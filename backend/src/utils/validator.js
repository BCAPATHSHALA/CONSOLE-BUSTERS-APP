import ffmpeg from "fluent-ffmpeg";
import { ApiError } from "./apiError.js";

/**
 * Utility function to get the duration of a video file.
 *
 * @param {string} videoPath - The path to the video file.
 * @param {function} callback - A function to handle the duration retrieval.
 */

const getVideoDuration = (videoPath, callback) => {
  // Get the duration of the video
  ffmpeg.ffprobe(videoPath, (err, metadata) => {
    if (err) {
      // If an error occurs, pass it to the callback
      callback(err);
      return;
    }

    // console.log("Metadata: ", metadata);
    // Extract duration from metadata
    const durationInSeconds = metadata.format.duration;

    // Pass the duration to the callback
    callback(null, durationInSeconds);
  });
};

// Usage of getVideoDuration
const validateVideoDuration = async (videoPath) => {
  try {
    // Step 1: Get the duration of the video
    const durationInSeconds = await new Promise((resolve, reject) => {
      getVideoDuration(videoPath, (err, duration) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(duration);
      });
    });

    // Step 2: Check video duration
    // console.log("durationInSeconds: ", durationInSeconds);
    if (durationInSeconds > 180) {
      return true;
    }
  } catch (error) {
    // Handle errors
    throw new ApiError(
      400,
      `Some went wrong while getting the video duration: ${error}`
    );
  }
};

export { getVideoDuration, validateVideoDuration };

/*
Metadata:  {
  streams: [
    {
      index: 0,
      codec_name: 'h264',
      codec_long_name: 'H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10',
      profile: 'Main',
      codec_type: 'video',
      codec_tag_string: 'avc1',
      codec_tag: '0x31637661',
      width: 352,
      height: 480,
      coded_width: 352,
      coded_height: 480,
      closed_captions: 0,
      film_grain: 0,
      has_b_frames: 2,
      sample_aspect_ratio: '3:4',
      display_aspect_ratio: '11:20',
      pix_fmt: 'yuv420p',
      level: 31,
      color_range: 'tv',
      color_space: 'smpte170m',
      color_transfer: 'bt709',
      color_primaries: 'smpte170m',
      chroma_location: 'left',
      field_order: 'progressive',
      refs: 1,
      is_avc: 'true',
      nal_length_size: 4,
      id: '0x1',
      r_frame_rate: '359/12',
      avg_frame_rate: '42300000/1417013',
      time_base: '1/90000',
      start_pts: 0,
      start_time: 0,
      duration_ts: 1414001,
      duration: 15.711122,
      bit_rate: 136746,
      max_bit_rate: 'N/A',
      bits_per_raw_sample: 8,
      nb_frames: 470,
      nb_read_frames: 'N/A',
      nb_read_packets: 'N/A',
      extradata_size: 47,
      tags: [Object],
      disposition: [Object]
    },
    {
      index: 1,
      codec_name: 'aac',
      codec_long_name: 'AAC (Advanced Audio Coding)',
      profile: 'LC',
      codec_type: 'audio',
      codec_tag_string: 'mp4a',
      codec_tag: '0x6134706d',
      sample_fmt: 'fltp',
      sample_rate: 48000,
      channels: 2,
      channel_layout: 'stereo',
      bits_per_sample: 0,
      initial_padding: 0,
      id: '0x2',
      r_frame_rate: '0/0',
      avg_frame_rate: '0/0',
      time_base: '1/48000',
      start_pts: 0,
      start_time: 0,
      duration_ts: 755712,
      duration: 15.744,
      bit_rate: 158889,
      max_bit_rate: 'N/A',
      bits_per_raw_sample: 'N/A',
      nb_frames: 739,
      nb_read_frames: 'N/A',
      nb_read_packets: 'N/A',
      extradata_size: 5,
      tags: [Object],
      disposition: [Object]
    }
  ],
  format: {
    filename: 'public\\temp\\02Maa.mp4',
    nb_streams: 2,
    nb_programs: 0,
    nb_stream_groups: 0,
    format_name: 'mov,mp4,m4a,3gp,3g2,mj2',
    format_long_name: 'QuickTime / MOV',
    start_time: 0,
    duration: 15.744,
    size: 601326,
    bit_rate: 305551,
    probe_score: 100,
    tags: {
      major_brand: 'mp42',
      minor_version: '512',
      compatible_brands: 'mp42iso2avc1mp41',
      creation_time: '2024-04-18T01:43:39.000000Z',
      encoder: 'HandBrake 1.6.1 2023012300'
    }
  },
  chapters: []
}
*/

/*
WHAT IS FFmpeg?
FFmpeg, or Fast Forward Moving Picture Experts Group, is a free and open-source software project consisting of a suite of libraries and programs for handling video, audio, and other multimedia files and streams. It can be used for transcoding, streaming, filtering, and playing media.

Install Package: npm i fluent-ffmpeg
*/
