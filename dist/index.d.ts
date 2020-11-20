export declare type GunStatic = any;
export declare type GunRef = any;
export declare type NamespacedRef = any;
export declare type KeyPair = {
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
};
export declare type Options = {
    appKeys?: undefined | string | KeyPair;
    sea?: any;
    interval?: number;
    useOpen?: boolean;
};
export declare type ActionType = {
    type: string;
    data: any;
};
export declare type UpdateType = {
    id: string;
    data: any;
};
export declare const encryptData: (data: any, keys: undefined | string | KeyPair, sea: any) => Promise<any>;
export declare const decryptData: (data: any, keys: undefined | string | KeyPair, sea: any) => Promise<any>;
export declare const debouncedUpdates: (dispatcher: any, timeout?: number) => (update: UpdateType) => () => void;
export declare const reducer: (state: {}, { data, type }: ActionType) => any;
export declare const useIsMounted: () => any;
export declare const useSafeReducer: <T>(reducer: any, initialState: any) => [T, Function];
export declare const useGun: (Gun: GunStatic, peerList: string[]) => any[];
export declare const useGunNamespace: (gun: GunRef) => any[];
export declare const useGunKeyAuth: (gun: GunRef, keys: KeyPair, triggerAuth?: boolean) => any[];
export declare const useGunKeys: (sea: any, initialValue: any) => any[];
export declare const useGunState: <T>(ref: GunRef, opts?: Options) => {
    fields: T;
    put: (data: T) => Promise<void>;
    remove: (field: string) => Promise<void>;
};
export declare const useGunCollectionState: <T>(ref: GunRef, opts?: Options) => {
    collection: Record<string, T>;
    addToSet: (data: T, nodeID?: string | undefined) => Promise<void>;
    updateInSet: (nodeID: string, data: T) => Promise<void>;
    removeFromSet: (nodeID: string) => Promise<void>;
};
