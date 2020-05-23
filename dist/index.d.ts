export declare const encryptData: (
  data: any,
  encrypted: any,
  keys: any,
  sea: any
) => Promise<any>;
export declare const decryptData: (
  data: any,
  encrypted: any,
  keys: any,
  sea: any
) => Promise<any>;
export declare const useGun: (Gun: any, peerList: any) => any[];
export declare const useGunNamespace: (gun: any) => any[];
export declare const useGunKeyAuth: (
  gun: any,
  keys: any,
  triggerAuth: any
) => any[];
export declare const useGunKeys: (sea: any, initialState: any) => any[];
export declare const useGunState: (
  ref: any,
  {
    appKeys,
    sea,
    interval,
    encrypted,
  }: {
    appKeys: any;
    sea: any;
    interval?: number;
    encrypted?: boolean;
  }
) => any[];
export declare const useGunCollectionState: (
  ref: any,
  {
    appKeys,
    sea,
    interval,
    encrypted,
  }: {
    appKeys: any;
    sea: any;
    interval?: number;
    encrypted?: boolean;
  }
) => any[];
