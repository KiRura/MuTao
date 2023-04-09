import { AxiosResponse } from 'axios';
export = translate;
declare function translate(parameters: translate.Parameters): Promise<AxiosResponse<translate.Response>>;
declare namespace translate {
    type DeeplLanguages = 'BG' | 'CS' | 'DA' | 'DE' | 'EL' | 'EN-GB' | 'EN-US' | 'EN' | 'ES' | 'ET' | 'FI' | 'FR' | 'HU' | 'IT' | 'JA' | 'LT' | 'LV' | 'NL' | 'PL' | 'PT-PT' | 'PT-BR' | 'PT' | 'RO' | 'RU' | 'SK' | 'SL' | 'SV' | 'ZH';
    interface Parameters {
        free_api: Boolean;
        auth_key: string;
        text: string;
        source_lang?: DeeplLanguages;
        target_lang: DeeplLanguages;
        split_sentences?: '0' | '1' | 'nonewlines';
        preserve_formatting?: '0' | '1';
        formality?: 'default' | 'more' | 'less';
        tag_handling?: string[];
        non_splitting_tags?: string[];
        outline_detection?: string;
        splitting_tags?: string[];
        ignore_tags?: string[];
    }
    interface Response {
        translations: {
            detected_source_language: string;
            text: string;
        }[];
    }
}
