export type GunStatic = any;
export type GunRef = any;
export type NamespacedRef = any;
export type KeyPair = {
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
};
export type Options = {
    appKeys?: undefined | string | KeyPair;
    sea?: any;
    interval?: number;
    useOpen?: boolean;
};
export type NodeT<T> = T & {
    nodeID: string;
    [key: string]: any;
};
export type ActionType<T> = {
    type: 'add';
    data: NodeT<T>;
} | {
    type: 'update';
    data: NodeT<T>;
} | {
    type: 'remove';
    data: NodeT<T>;
};
export type UpdateType = {
    id: string;
    data: any;
};
export interface GunOptions extends Partial<{
    file: string;
    web: any;
    s3: {
        key: any;
        secret: any;
        bucket: any;
    };
    peers: string[] | Record<string, {}>;
    radisk: boolean;
    localStorage: boolean;
    uuid(): string;
    [key: string]: any;
}> {
}
export interface CollectionState<T> extends Partial<{
    collection: Map<string, T>;
    sorted: T[];
    infiniteScrolling: {
        isFetching: boolean;
        lastFetched: string;
        reverse: boolean;
    };
}> {
}
export declare const encryptData: (data: any, keys: undefined | string | KeyPair, sea: any) => Promise<any>;
export declare const decryptData: (data: any, keys: undefined | string | KeyPair, sea: any) => Promise<any>;
export declare const debouncedUpdates: (dispatcher: any, type?: string, timeout?: number) => (update: UpdateType) => () => void;
export declare const useIsMounted: () => any;
export declare const nodeReducer: <T>(state: NodeT<T>, { data, type }: ActionType<T>) => T;
export declare const collectionReducer: <T>(state: CollectionState<T>, { data, type }: ActionType<T>) => CollectionState<T>;
export declare const useSafeReducer: <T>(reducer: any, initialState: T) => [T, Function];
export declare const useGun: (Gun: GunStatic, opts: GunOptions) => any;
export declare const useGunNamespace: (gun: GunRef, soul?: string) => any;
export declare const useGunKeyAuth: (gun: GunRef, keys: KeyPair, triggerAuth?: boolean) => any[];
export declare const useGunKeys: (sea: any, existingKeys?: KeyPair | undefined | null) => any;
export declare const useGunOnNodeUpdated: <T>(ref: GunRef, opts: Options | undefined, cb: (data: T, nodeID: string) => void, cleanup?: () => void) => void;
export declare const useGunState: <T>(ref: GunRef, opts?: Options) => {
    fields: T;
    put: (data: T) => Promise<void>;
    remove: (field: string) => Promise<void>;
};
export declare const useGunCollectionState: <T>(ref: GunRef, opts?: Options) => {
    collection: Map<string, T> | undefined;
    addToSet: (data: T, nodeID?: string) => Promise<void>;
    updateInSet: (nodeID: string, data: T) => Promise<void>;
    removeFromSet: (nodeID: string) => Promise<void>;
};
