export declare const encryptData: (
  data: any,
  encrypted: any,
  keys: any,
  SEA: any
) => Promise<any>;
export declare const decryptData: (
  data: any,
  encrypted: any,
  keys: any,
  SEA: any
) => Promise<any>;
export declare const useGun: (Gun: any, peerList: any) => any[];
export declare const useGunNamespace: (gun: any) => any[];
export declare const useGunKeyAuth: (
  gun: any,
  keys: any,
  triggerAuth: any
) => any[];
export declare const useGunKeys: (sea: any, retrieveFn?: () => any) => any[];
export declare const useGunState: (
  ref: any,
  {
    appKeys,
    SEA,
    interval,
    encrypted,
  }: {
    appKeys: any;
    SEA: any;
    interval?: number;
    encrypted?: boolean;
  }
) => any[];
export declare function useGunCollectionState(
  ref: any,
  {
    appKeys,
    SEA,
    interval,
    encrypted,
  }: {
    appKeys: any;
    SEA: any;
    interval?: number;
    encrypted?: boolean;
  }
): any[];
