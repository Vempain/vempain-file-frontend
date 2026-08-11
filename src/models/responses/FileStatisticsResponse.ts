export interface FileStatisticsResponse {
    total_files: number;
    files_by_type: Record<string, number>;
    files_by_type_and_year: Record<string, Record<string, number>>;
    total_tags: number;
    total_gps_locations: number;
    files_with_gps_locations: number;
    files_with_tags: number;
    largest_file_group_size: number;
    smallest_file_group_size: number;
    average_file_group_size: number;
    total_file_size: number;
    largest_file_size: number;
    average_file_size: number;
    largest_file_size_by_type: Record<string, number>;
    average_file_size_by_type: Record<string, number>;
}
