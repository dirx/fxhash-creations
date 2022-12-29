export type variations<Type> = {
    [Property in keyof Type]: variation<Type>;
};
export type variation<Type> = {
    name: string;
    index: number;
    value: Type | variations<any>;
    label: string;
    variations: Type | Type[];
    numberOfVariations: number;
};
export type combinationFn<Type> = (combination: number) => variation<Type>;
export type labelFn<Type> = (index: number, value: Type) => string;

export const featureNumber = (
    name: string,
    variations: number,
    labels: labelFn<number> | string[] = []
): combinationFn<number> => {
    if (variations <= 0) {
        throw new Error(`variations must be > 0`);
    }
    return (combination: number): variation<number> => {
        let value = combination % variations;
        let label =
            typeof labels === 'function'
                ? labels(value, value)
                : labels[value] ?? value;
        return {
            name: name,
            index: value,
            value: value,
            label: label,
            variations: variations,
            numberOfVariations: variations,
        };
    };
};

export const featureSet = <Type>(
    name: string,
    variations: Type[],
    labels: labelFn<Type> | string[] = []
): combinationFn<Type> => {
    return (combination: number): variation<Type> => {
        let index = combination % variations.length;
        let value = variations[index];
        let label =
            typeof labels === 'function'
                ? labels(index, value)
                : labels[index] ?? value;
        return {
            name: name,
            index: index,
            value: value,
            label: label,
            variations: variations,
            numberOfVariations: variations.length,
        };
    };
};

export const featureCollection = <Type>(
    name: string,
    variations: combinationFn<Type>[],
    weights: number[] = []
): combinationFn<Type> => {
    return (combination: number): variation<Type> => {
        let collectedVariations: variation<Type>[] = [];
        let numberOfVariations: number = 0;
        let index: number = -1;

        for (let i = 0; i < variations.length; i++) {
            let variation: variation<Type> = variations[i](combination);
            let weight: number = weights[i] ?? 1;
            numberOfVariations += variation.numberOfVariations * weight;
            collectedVariations.push(variation);

            if (
                index == -1 &&
                combination < variation.numberOfVariations * weight
            ) {
                index = i;
            }
            combination -= variation.numberOfVariations * weight;
        }

        return {
            name: name,
            index: index,
            value: collectedVariations[index].value,
            label: collectedVariations[index].label,
            variations: collectedVariations[index].variations,
            numberOfVariations: numberOfVariations,
        };
    };
};

export const features = (
    name: string,
    features: combinationFn<any>[]
): combinationFn<any> => {
    return (combination: number): variation<any> => {
        let variations: any[] = [];
        let value: variations<any> = {};
        let numberOfVariations: number = 1;
        features.forEach((feature) => {
            let variation = feature(combination);
            combination = Math.floor(
                combination / variation.numberOfVariations
            );
            value[variation.name] = variation;
            variations.push(variation.variations);
            numberOfVariations *= variation.numberOfVariations;
        });

        return {
            name: name,
            index: 0,
            value: value,
            label: name,
            variations: variations,
            numberOfVariations: numberOfVariations,
        };
    };
};
