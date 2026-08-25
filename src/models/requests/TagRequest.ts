// models/Requests.ts
export interface TagRequest {
    id: number;
    tag_name: string;
    tag_name_de: string;
    tag_name_en: string;
    tag_name_es: string;
    tag_name_fi: string;
    tag_name_sv: string;
}

export interface TagOperationRequest {
    tag_name: string;
    replacement_tag_name?: string;
    tag_name_de?: string;
    tag_name_en?: string;
    tag_name_es?: string;
    tag_name_fi?: string;
    tag_name_sv?: string;
    file_ids?: number[];
}