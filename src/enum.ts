export function getEnumKeyByValue(
    e: Record<string, string | number>,
    value: number | string
): string | null {
    let keys = Object.keys(e)
        .filter((v) => Number.isNaN(parseInt(v)))
        .filter((v) => {
            return e[v] == value;
        });
    return keys.length > 0 ? keys[0] : null;
}

export function getEnumValueByAny(
    e: Record<string, string | number>,
    value: number | string,
    caseInsensitive: boolean = true
): string | number | null {
    let values = Object.entries(e)
        .filter(([k, _v]) => Number.isNaN(parseInt(k)))
        .filter(([k, v]) => {
            if (caseInsensitive) {
                value = `${value}`.toUpperCase();
                v = `${v}`.toUpperCase();
                k = `${k}`.toUpperCase();
            }
            return v == value || k == value;
        })
        .map(([_k, v]) => {
            return v;
        });

    return values.length > 0 ? values[0] : null;
}

export function getEnumValues(
    e: Record<string, string | number>
): (string | number)[] {
    return Object.keys(e)
        .filter((k) => Number.isNaN(parseInt(k)))
        .map((k) => {
            return e[k];
        });
}
