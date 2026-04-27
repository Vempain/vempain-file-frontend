export interface DataResponse {
    id: number;
    identifier: string;
    type: string;
    description?: string;
    column_definitions: string;
    create_sql: string;
    fetch_all_sql: string;
    fetch_subset_sql: string;
    generated?: string;
    csv_data: string;
    created_at: string;
    updated_at: string;
}
