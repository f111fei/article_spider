import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as _ from 'lodash';

export function needUpdate(newData: any, oldData: any) {
    if (!_.isObject(newData) || !_.isObject(oldData)) {
        return !_.isEqual(newData, oldData);
    }

    if (_.isArray(newData) && _.isArray(oldData)) {
        return (newData as any[]).some((value, index) => {
            return needUpdate(newData[index], oldData[index]);
        });
    }

    const result = Object.keys(newData).some(key => {
        return needUpdate(newData[key], oldData[key]);
    });
    return result;
}

export async function cache(data: any, name: string) {
    const dir = path.join(os.tmpdir(), 'spider_cache');
    const file = path.join(dir, name);
    await fs.mkdirp(dir);
    await fs.writeFile(file, data);
    return file;
}

export function match(string: string, reg: RegExp): string {
    const result = string.match(reg);
    if (result && result.length > 1) {
        return result[1];
    } else {
        return null;
    }
}

export function replaceAll(value: string, oldValue: string, newValue: string) {
    return value.split(oldValue).join(newValue);
}