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
    appKeys: string | KeyPair;
    sea: any;
    interval?: number;
};
export declare type ActionType = {
    type: string;
    data: any;
};
export declare type UpdateType = {
    id: string;
    data: any;
};
export declare const encryptData: (data: any, keys: string | KeyPair, sea: any) => Promise<any>;
export declare const decryptData: (data: any, keys: string | KeyPair, sea: any) => Promise<any>;
export declare const useGun: (Gun: any, peerList: string[]) => any[];
export declare const useGunNamespace: (gun: any) => any[];
export declare const useGunKeyAuth: (gun: any, keys: KeyPair, triggerAuth?: boolean) => any[];
export declare const useGunKeys: (sea: any, initialValue: any) => any[];
export declare const useGunState: <T>(ref: any, opts?: Options) => {
    fields: T;
    put: (data: T) => Promise<void>;
    remove: (field: string) => Promise<void>;
};
export declare const useGunCollectionState: <T>(ref: any, opts?: Options) => {
    collection: Record<string, T>;
    addToSet: (data: T, nodeID?: string | undefined) => Promise<void>;
    updateInSet: (nodeID: string, data: T) => Promise<void>;
    removeFromSet: (nodeID: string) => Promise<void>;
};
