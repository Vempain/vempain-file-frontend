import type {AudioFileResponse} from './AudioFileResponse';

export interface MusicFileResponse extends AudioFileResponse {
    artist: string;
    album_artist: string;
    album: string;
    year: number;
    track_name: string;
    track_number: number;
    track_total: number;
    genre: string;
}

