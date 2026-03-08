import { del, get, patch, post } from "@/services/ApiService";
import type {
  ApiItemsResponse,
  CreateDeviceLinkRequest,
  CreateDeviceRequest,
  DeviceDto,
  DeviceLinkDto,
  DisplaySettingsDto,
  PatchDeviceRequest,
  PatchDisplaySettingsRequest,
} from "../models/dto";

const DEVICES_BASE = "/private/family/devices";
const DISPLAY_BASE = "/private/family/display-settings";
const LINKS_BASE = "/private/family/device-links";

export const devicesApi = {
  async getAll(): Promise<DeviceDto[]> {
    const response = await get<ApiItemsResponse<DeviceDto>>(DEVICES_BASE);
    return response.items;
  },

  getById(deviceUuid: string): Promise<DeviceDto> {
    return get(`${DEVICES_BASE}/${deviceUuid}`);
  },

  create(data: CreateDeviceRequest): Promise<DeviceDto> {
    return post(DEVICES_BASE, data);
  },

  update(deviceUuid: string, data: PatchDeviceRequest): Promise<DeviceDto> {
    return patch(`${DEVICES_BASE}/${deviceUuid}`, data);
  },

  remove(deviceUuid: string): Promise<void> {
    return del(`${DEVICES_BASE}/${deviceUuid}`);
  },
};

export const displaySettingsApi = {
  get(): Promise<DisplaySettingsDto> {
    return get(DISPLAY_BASE);
  },

  update(data: PatchDisplaySettingsRequest): Promise<DisplaySettingsDto> {
    return patch(DISPLAY_BASE, data);
  },
};

export const deviceLinksApi = {
  create(data: CreateDeviceLinkRequest): Promise<DeviceLinkDto> {
    return post(LINKS_BASE, data);
  },

  remove(deviceLinkUuid: string): Promise<void> {
    return del(`${LINKS_BASE}/${deviceLinkUuid}`);
  },
};
