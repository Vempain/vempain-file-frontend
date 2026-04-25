export {AbstractFileAPI} from './AbstractFileAPI';
import {ArchiveFileAPI} from './ArchiveFileAPI';
import {AudioFileAPI} from './AudioFileAPI';
import {DataAPI} from './DataAPI';
import {DocumentFileAPI} from './DocumentFileAPI';
import {FileGroupAPI} from './FileGroupAPI';
import {FileScannerAPI} from './FileScannerAPI';
import {FontFileAPI} from './FontFileAPI';
import {IconFileAPI} from './IconFileAPI';
import {ImageFileAPI} from './ImageFileAPI';
import {LocationAPI} from './LocationAPI';
import {PathCompletionAPI} from './PathCompletionAPI';
import {PublishAPI} from './PublishAPI';
import {TagsAPI} from './TagsAPI';
import {VectorFileAPI} from './VectorFileAPI';
import {VideoFileAPI} from './VideoFileAPI';
// Resolve API URL: Vite replaces import.meta.env at build/dev time; Jest uses process.env.
// We use a helper to avoid import.meta in this file (ts-jest cannot compile it).
import {resolveApiUrl} from "./resolveApiUrl";

export {ArchiveFileAPI} from './ArchiveFileAPI';
export {AudioFileAPI} from './AudioFileAPI';
export {DataAPI} from './DataAPI';
export {DocumentFileAPI} from './DocumentFileAPI';
export {FileGroupAPI} from './FileGroupAPI';
export {FileScannerAPI} from './FileScannerAPI';
export {FontFileAPI} from './FontFileAPI';
export {IconFileAPI} from './IconFileAPI';
export {ImageFileAPI} from './ImageFileAPI';
export {LocationAPI} from './LocationAPI';
export {PathCompletionAPI} from './PathCompletionAPI';
export {PublishAPI} from './PublishAPI';
export {TagsAPI} from './TagsAPI';
export {VectorFileAPI} from './VectorFileAPI';
export {VideoFileAPI} from './VideoFileAPI';

export const apiUrl: string = resolveApiUrl();

export const archiveFileAPI = new ArchiveFileAPI(apiUrl, '/files/archive');
export const audioFileAPI = new AudioFileAPI(apiUrl, '/files/audio');
export const dataAPI = new DataAPI(apiUrl, '/data-publish');
export const documentFileAPI = new DocumentFileAPI(apiUrl, '/files/document');
export const fileGroupAPI = new FileGroupAPI(apiUrl, '/file-groups');
export const fileScannerAPI = new FileScannerAPI(apiUrl, '/scan-files');
export const fontFileAPI = new FontFileAPI(apiUrl, '/files/font');
export const iconFileAPI = new IconFileAPI(apiUrl, '/files/icon');
export const imageFileAPI = new ImageFileAPI(apiUrl, '/files/image');
export const locationAPI = new LocationAPI(apiUrl, '/location');
export const pathCompletionAPI = new PathCompletionAPI(apiUrl, '/path-completion');
export const publishAPI = new PublishAPI(apiUrl, '/publish');
export const tagsAPI = new TagsAPI(apiUrl, '/tags');
export const vectorFileAPI = new VectorFileAPI(apiUrl, '/files/vector');
export const videoFileAPI = new VideoFileAPI(apiUrl, '/files/video');
