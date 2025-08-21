import React from 'react';
export interface IGunChainReference<T = any> {
    get(key: string): IGunChainReference<T>;
    put(data: T, callback?: (ack: {
        err?: string;
        ok?: any;
    }) => void): IGunChainReference<T>;
    on(callback: (data: T, key: string, message?: any, event?: any) => void): () => void;
    once(callback: (data: T, key: string) => void): void;
    set(data: T, callback?: (ack: {
        err?: string;
        ok?: any;
    }) => void): IGunChainReference<T>;
    map(): IGunChainReference<T>;
    open?(callback: (data: T, key: string, message?: any, event?: any) => void): void;
    user(soul?: string): IGunUserReference;
    off(): void;
    toString(): string;
}
export interface IGunUserReference extends IGunChainReference {
    is: KeyPair | null;
    auth(keypair: KeyPair, callback?: (ack: any) => void): void;
    create(keypair: KeyPair, callback?: (ack: any) => void): void;
    leave(): void;
}
export interface GunError {
    err: string;
    code?: string | number;
    context?: string;
}
export type ValidGunData = string | number | boolean | object | null;
export type GunStatic = any;
export type GunRef = IGunChainReference;
export type NamespacedRef = IGunUserReference;
export type KeyPair = {
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
};
export type Storage = {
    getItem: (key: string) => any;
    setItem: (key: string, data: string) => any;
    removeItem: (key: string) => any;
};
export type AuthContextType = {
    gun: IGunChainReference;
    user: IGunUserReference;
    login: (keys?: undefined | string | KeyPair) => void;
    logout: (onLoggedOut?: () => void) => void;
    sea: any;
    appKeys: undefined | string | KeyPair;
    isLoggedIn: boolean;
    newGunInstance: (opts?: GunOptions) => IGunChainReference;
};
export type AuthProviderOpts = {
    Gun: any;
    sea: any;
    keyFieldName?: string;
    storage: Storage;
    gunOpts: GunOptions;
    children: React.ReactNode;
};
export type Options = {
    appKeys?: undefined | string | KeyPair;
    sea?: any;
    interval?: number;
    useOpen?: boolean;
};
export type NodeData<T extends ValidGunData> = T & {
    readonly nodeID: string;
    readonly _?: {
        '#': string;
        '>': Record<string, number>;
    };
};
export type NodeT<T> = T & {
    nodeID: string;
    [key: string]: any;
};
export type ActionType<T> = {
    type: 'add';
    data: NodeT<T> | NodeT<T>[];
} | {
    type: 'update';
    data: NodeT<T>;
} | {
    type: 'remove';
    data: {
        nodeID: string;
    };
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
export interface UseGunStateReturn<T> {
    fields: T;
    put: (data: Partial<T>) => Promise<void>;
    remove: (field: string) => Promise<void>;
    error: GunError | null;
    isLoading: boolean;
    isConnected: boolean;
}
export interface UseGunCollectionReturn<T> {
    collection: Map<string, NodeT<T>> | undefined;
    items: NodeT<T>[];
    addToSet: (data: T, nodeID?: string) => Promise<void>;
    updateInSet: (nodeID: string, data: Partial<T>) => Promise<void>;
    removeFromSet: (nodeID: string) => Promise<void>;
    error: GunError | null;
    isLoading: boolean;
    count: number;
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
export declare const useGunKeyAuth: (gun: GunRef, keys: KeyPair, triggerAuth?: boolean) => readonly [any, any, any];
export declare const useGunKeys: (sea: any, existingKeys?: KeyPair | undefined | null) => any;
export declare const useGunOnNodeUpdated: <T>(ref: GunRef, opts: Options | undefined, cb: (data: T, nodeID: string) => void, cleanup?: () => void) => void;
export declare const useGunState: <T>(ref: GunRef, opts?: Options) => UseGunStateReturn<T>;
export declare const useGunCollectionState: <T extends Record<string, any>>(ref: GunRef, opts?: Options) => UseGunCollectionReturn<T>;
export declare const AuthContext: any;
export declare const AuthProvider: React.FC<AuthProviderOpts>;
export declare const useAuth: () => AuthContextType;
export declare const GunContext: any;
export declare const GunProvider: React.FC<{
    gun: GunStatic;
    options: GunOptions;
    children: React.ReactNode;
}>;
export declare const useGunContext: () => IGunChainReference;
export declare const useGunDebug: (ref: IGunChainReference, label: string, enabled?: boolean) => void;
export declare const useGunConnection: (ref: IGunChainReference) => {
    isConnected: boolean;
    lastSeen: Date | null;
    error: GunError | null;
};
